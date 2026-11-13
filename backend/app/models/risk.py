"""
Risk assessment database model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class RiskAssessment(Base):
    """Risk and readiness assessment for an application."""
    __tablename__ = "risk_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    readiness_score = Column(Float, default=0.0, nullable=False)  # 0-100
    risk_factors = Column(JSON, nullable=True)  # Array of {factor, severity, description, recommendation}
    missing_documents = Column(JSON, nullable=True)  # Array of missing document types
    assessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="risk_assessments")
