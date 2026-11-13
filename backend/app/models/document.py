"""
Document, verification, and DigiLocker connection database models.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class DocumentType(str, enum.Enum):
    """Types of documents supported."""
    AADHAAR = "AADHAAR"
    CASTE_CERTIFICATE = "CASTE_CERTIFICATE"
    INCOME_CERTIFICATE = "INCOME_CERTIFICATE"
    SSLC_MARKSHEET = "SSLC_MARKSHEET"
    PREVIOUS_MARKSHEET = "PREVIOUS_MARKSHEET"
    COLLEGE_ADMISSION = "COLLEGE_ADMISSION"
    BANK_PASSBOOK = "BANK_PASSBOOK"
    DISABILITY_CERTIFICATE = "DISABILITY_CERTIFICATE"
    HOSTEL_PROOF = "HOSTEL_PROOF"
    OTHER = "OTHER"


class DocumentSource(str, enum.Enum):
    """Source of the uploaded document."""
    UPLOAD = "UPLOAD"
    DIGILOCKER = "DIGILOCKER"


class VerificationType(str, enum.Enum):
    """How the document was verified."""
    AI_ANALYSIS = "AI_ANALYSIS"
    DIGILOCKER_VERIFIED = "DIGILOCKER_VERIFIED"
    MANUAL = "MANUAL"


class Document(Base):
    """Uploaded or fetched document record."""
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    original_filename = Column(String(255), nullable=False)
    encrypted_file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    source = Column(Enum(DocumentSource), default=DocumentSource.UPLOAD, nullable=False)
    digilocker_uri = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="documents")
    verifications = relationship("DocumentVerification", back_populates="document", cascade="all, delete-orphan")


class DocumentVerification(Base):
    """Verification result for a document."""
    __tablename__ = "document_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    verification_type = Column(Enum(VerificationType), nullable=False)
    extracted_fields = Column(JSON, nullable=True)
    issues = Column(JSON, nullable=True)  # Array of issue objects
    confidence_score = Column(Float, nullable=True)
    name_match_status = Column(String(50), nullable=True)
    expiry_status = Column(String(50), nullable=True)
    ai_explanation = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="verifications")


class DigiLockerConnection(Base):
    """User's DigiLocker OAuth connection."""
    __tablename__ = "digilocker_connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    digilocker_id_encrypted = Column(String(500), nullable=True)
    access_token_encrypted = Column(String(1000), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    is_connected = Column(Boolean, default=False, nullable=False)
    connected_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="digilocker_connection")
