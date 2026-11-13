"""
Audit and AI processing log database models.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class AuditEvent(Base):
    """Audit trail for all significant user and system actions."""
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_events")


class AIProcessingLog(Base):
    """Log of all AI processing operations for transparency and compliance."""
    __tablename__ = "ai_processing_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    service_name = Column(String(100), nullable=False)
    operation = Column(String(100), nullable=False)
    input_summary = Column(Text, nullable=True)  # Redacted summary, never raw PII
    output_summary = Column(Text, nullable=True)
    pii_fields_redacted = Column(JSON, nullable=True)  # List of field names that were redacted
    processing_time_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="ai_processing_logs")
