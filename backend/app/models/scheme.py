"""
Scheme, eligibility rules, and required documents database models.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer, Text, JSON

from sqlalchemy.orm import relationship

from app.database import Base


class RuleOperator(str, enum.Enum):
    """Operators for eligibility rule evaluation."""
    EQ = "eq"
    NEQ = "neq"
    LT = "lt"
    LTE = "lte"
    GT = "gt"
    GTE = "gte"
    IN = "in"
    NOT_IN = "not_in"
    EXISTS = "exists"


class Scheme(Base):
    """Government scholarship scheme."""
    __tablename__ = "schemes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    department = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    portal_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    knowledge_base_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    eligibility_rules = relationship("SchemeEligibilityRule", back_populates="scheme", cascade="all, delete-orphan")
    required_documents = relationship("SchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="scheme", cascade="all, delete-orphan")


class SchemeEligibilityRule(Base):
    """Individual eligibility rule for a scheme."""
    __tablename__ = "scheme_eligibility_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    rule_key = Column(String(100), nullable=False)
    field_name = Column(String(100), nullable=False)
    operator = Column(Enum(RuleOperator), nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    is_disqualifying = Column(Boolean, default=False, nullable=False)
    priority = Column(Integer, default=0, nullable=False)
    condition_category = Column(JSON, nullable=True)  # Category-specific rules
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    scheme = relationship("Scheme", back_populates="eligibility_rules")


class SchemeDocument(Base):
    """Document required for a scheme application."""
    __tablename__ = "scheme_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id = Column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False)
    document_name = Column(String(255), nullable=False)
    is_mandatory = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    digilocker_doc_type = Column(String(50), nullable=True)

    # Relationships
    scheme = relationship("Scheme", back_populates="required_documents")
