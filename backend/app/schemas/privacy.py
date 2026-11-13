"""
Pydantic schemas for privacy, consent, and audit.
"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class ConsentRequest(BaseModel):
    """Request to grant or update consent."""
    consent_type: str = Field(..., description="DATA_PROCESSING/AI_ANALYSIS/DIGILOCKER_ACCESS/DOCUMENT_STORAGE/NOTIFICATION")
    is_granted: bool = Field(..., description="True to grant, False to revoke")
    details: Optional[str] = None


class ConsentResponse(BaseModel):
    """Consent record response."""
    id: str
    consent_type: str
    is_granted: bool
    granted_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    details: Optional[str] = None

    model_config = {"from_attributes": True}


class ConsentListResponse(BaseModel):
    """List of user consents."""
    consents: List[ConsentResponse]


class AuditEventResponse(BaseModel):
    """Audit event record."""
    id: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AIProcessingLogResponse(BaseModel):
    """AI processing log entry."""
    id: str
    service_name: str
    operation: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    pii_fields_redacted: Optional[List[str]] = None
    processing_time_ms: Optional[int] = None
    success: bool
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PrivacyDataDeletionResponse(BaseModel):
    """Response after requesting data deletion."""
    success: bool
    user_id: str
    deleted_items: Dict[str, int]
    message: str


class PrivacyDataDeletionRequest(BaseModel):
    """Require the account password before irreversible account erasure."""
    current_password: str = Field(..., min_length=1, max_length=256)
