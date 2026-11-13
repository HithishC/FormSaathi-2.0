"""
User and ApplicantProfile database models.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    APPLICANT = "applicant"
    ADMIN = "admin"


class CategoryEnum(str, enum.Enum):
    """Caste/community category enumeration for Karnataka scholarships."""
    SC = "SC"
    ST = "ST"
    OBC_CAT1 = "OBC_CAT1"
    OBC_2A = "OBC_2A"
    OBC_2B = "OBC_2B"
    OBC_3A = "OBC_3A"
    OBC_3B = "OBC_3B"
    GENERAL = "GENERAL"


class User(Base):
    """Core user account model."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(15), nullable=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.APPLICANT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("ApplicantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="user", cascade="all, delete-orphan")
    ai_processing_logs = relationship("AIProcessingLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    digilocker_connection = relationship("DigiLockerConnection", back_populates="user", uselist=False, cascade="all, delete-orphan")


class ApplicantProfile(Base):
    """Detailed applicant profile with scholarship-relevant fields."""
    __tablename__ = "applicant_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(10), nullable=True)  # YYYY-MM-DD string
    gender = Column(String(20), nullable=True)
    category = Column(Enum(CategoryEnum), nullable=True)
    annual_family_income = Column(Integer, nullable=True)
    domicile_state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    aadhaar_last_four = Column(String(4), nullable=True)  # Only last 4 digits stored
    aadhaar_hash = Column(String(64), nullable=True)  # SHA-256 hash
    bank_account_linked = Column(Boolean, default=False, nullable=False)
    npci_mapped = Column(Boolean, default=False, nullable=False)
    sslc_registration_number = Column(String(50), nullable=True)
    current_education_level = Column(String(50), nullable=True)
    institution_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")
