"""
DigiLocker Integration router for FormSaathi.
Provides consent-based connection, status checks, document listing,
and verified document retrieval with clear SANDBOX demarcation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models.user import User
from app.schemas.digilocker import (
    DigiLockerAuthResponse,
    DigiLockerCallbackRequest,
    DigiLockerStatusResponse,
    DigiLockerDocumentListResponse,
    DigiLockerFetchResponse,
)
from app.security.auth import get_current_active_user
from app.services.digilocker_service import DigiLockerService

router = APIRouter(prefix="/api/digilocker", tags=["DigiLocker (Sandbox)"])


@router.get("/auth-url", response_model=DigiLockerAuthResponse)
def get_auth_url(current_user: User = Depends(get_current_active_user)):
    """Generate DigiLocker OAuth 2.0 authorization URL for consent."""
    state = f"fs_state_{uuid.uuid4().hex[:12]}"
    return DigiLockerService.get_auth_url(state=state)


@router.post("/callback", response_model=DigiLockerStatusResponse)
def handle_callback(
    data: DigiLockerCallbackRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Process OAuth callback and establish DigiLocker connection."""
    return DigiLockerService.connect_sandbox(
        db=db,
        user_id=current_user.id,
        code=data.code,
        ip_address=request.client.host if request.client else None,
    )


@router.get("/status", response_model=DigiLockerStatusResponse)
def get_connection_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Check DigiLocker connection and authorization status."""
    return DigiLockerService.get_status(db=db, user_id=current_user.id)


@router.get("/documents", response_model=DigiLockerDocumentListResponse)
def list_available_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List issued certificates available in the applicant's DigiLocker repository."""
    return DigiLockerService.list_available_documents(db=db, user_id=current_user.id)


@router.post("/fetch/{doc_type}", response_model=DigiLockerFetchResponse)
def fetch_document(
    doc_type: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Fetch and digitally verify an official certificate from DigiLocker into the Secure Vault."""
    try:
        return DigiLockerService.fetch_document(db=db, user_id=current_user.id, doc_type=doc_type)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e),
        )


@router.delete("/disconnect")
def disconnect_digilocker(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Revoke DigiLocker access token and disconnect account."""
    DigiLockerService.disconnect(db=db, user_id=current_user.id)
    return {"message": "DigiLocker disconnected and access tokens invalidated."}
