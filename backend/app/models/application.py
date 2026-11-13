"""
Application and status tracking database models.
"""
import uuid
import enum
import random
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    """Application lifecycle status."""
    ELIGIBILITY_CHECKED = "ELIGIBILITY_CHECKED"
    DOCUMENTS_PREPARED = "DOCUMENTS_PREPARED"
    SUBMITTED = "SUBMITTED"
    INITIAL_VERIFICATION = "INITIAL_VERIFICATION"
    DEPARTMENT_REVIEW = "DEPARTMENT_REVIEW"
    INFO_REQUESTED = "INFO_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    BENEFIT_SANCTIONED = "BENEFIT_SANCTIONED"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    BENEFIT_DISBURSED = "BENEFIT_DISBURSED"


class TrackingMode(str, enum.Enum):
    """How the application is being tracked."""
    OFFICIAL = "OFFICIAL"
    ASSISTED = "ASSISTED"


class StatusSource(str, enum.Enum):
    """Source of a status update."""
    SYSTEM = "SYSTEM"
    OFFICIAL_API = "OFFICIAL_API"
    USER_REPORTED = "USER_REPORTED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"


def generate_reference_number() -> str:
    """Generate a unique reference number in format FS-YYYY-XXXXXX."""
    year = datetime.utcnow().year
    random_part = str(random.randint(100000, 999999))
    return f"FS-{year}-{random_part}"


class Application(Base):
    """Scholarship application tracking."""
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_number = Column(String(20), unique=True, nullable=False, index=True, default=generate_reference_number)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.ELIGIBILITY_CHECKED, nullable=False)
    tracking_mode = Column(Enum(TrackingMode), default=TrackingMode.ASSISTED, nullable=False)
    official_reference_number = Column(String(100), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="applications")
    scheme = relationship("Scheme", back_populates="applications")
    status_events = relationship("ApplicationStatusEvent", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationStatusEvent.created_at")
    risk_assessments = relationship("RiskAssessment", back_populates="application", cascade="all, delete-orphan")


class ApplicationStatusEvent(Base):
    """Audit trail for application status changes."""
    __tablename__ = "application_status_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    source = Column(Enum(StatusSource), default=StatusSource.SYSTEM, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="status_events")
