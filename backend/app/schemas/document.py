"""
Pydantic schemas for document upload, analysis, and verification.
"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    """Response after uploading a document."""
    id: str
    document_type: str
    original_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    source: str
    is_verified: bool
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    """Document details (without file content for security)."""
    id: str
    user_id: str
    document_type: str
    original_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    source: str
    is_verified: bool
    uploaded_at: datetime
    expires_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """List of user documents."""
    documents: List[DocumentResponse]
    total: int


class DocumentIssue(BaseModel):
    """An issue found during document analysis."""
    field: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    recommendation: str


class DocumentAnalysisResponse(BaseModel):
    """Result of AI document analysis."""
    document_id: str
    document_type: str
    extracted_fields: Dict[str, Any] = {}
    issues: List[DocumentIssue] = []
    confidence_score: float = Field(0.0, ge=0, le=1)
    name_match_status: Optional[str] = None
    expiry_status: Optional[str] = None
    ai_explanation: Optional[str] = None
    verified_at: datetime


class DocumentVerificationResponse(BaseModel):
    """Document verification record."""
    id: str
    document_id: str
    verification_type: str
    extracted_fields: Optional[Dict[str, Any]] = None
    issues: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    name_match_status: Optional[str] = None
    expiry_status: Optional[str] = None
    ai_explanation: Optional[str] = None
    verified_at: datetime

    model_config = {"from_attributes": True}
