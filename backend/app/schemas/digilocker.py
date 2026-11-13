"""
Pydantic schemas for DigiLocker integration.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class DigiLockerAuthResponse(BaseModel):
    """Response with DigiLocker authorization URL."""
    auth_url: str
    state: str
    sandbox_mode: bool = True


class DigiLockerCallbackRequest(BaseModel):
    """DigiLocker OAuth callback data."""
    code: str
    state: str


class DigiLockerStatusResponse(BaseModel):
    """DigiLocker connection status."""
    is_connected: bool
    connected_at: Optional[datetime] = None
    sandbox_mode: bool = True


class DigiLockerDocumentInfo(BaseModel):
    """Information about a document available in DigiLocker."""
    doc_type: str
    name: str
    description: str
    issuer: str
    available: bool
    uri: Optional[str] = None
    sandbox_mode: bool = True


class DigiLockerDocumentListResponse(BaseModel):
    """List of documents available in DigiLocker."""
    documents: List[DigiLockerDocumentInfo]
    sandbox_mode: bool = True


class DigiLockerFetchResponse(BaseModel):
    """Response after fetching a document from DigiLocker."""
    document_id: str
    doc_type: str
    name: str
    source: str = "DIGILOCKER"
    is_verified: bool = False
    sandbox_mode: bool = True
    message: str
