"""
Consent tracking database model for privacy compliance.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ConsentType(str, enum.Enum):
    """Types of consent tracked."""
    DATA_PROCESSING = "DATA_PROCESSING"
    AI_ANALYSIS = "AI_ANALYSIS"
    DIGILOCKER_ACCESS = "DIGILOCKER_ACCESS"
    DOCUMENT_STORAGE = "DOCUMENT_STORAGE"
    NOTIFICATION = "NOTIFICATION"


class ConsentRecord(Base):
    """Record of user consent for various data operations."""
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(Enum(ConsentType), nullable=False)
    is_granted = Column(Boolean, default=False, nullable=False)
    granted_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    details = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="consent_records")
