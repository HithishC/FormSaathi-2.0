"""
Privacy Shield, Consent, and Audit router for FormSaathi.
Provides DPDP-aligned consent management, immutable audit trails,
AI processing logs, and cryptographic user data erasure.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
import logging

from app.database import get_db
from app.models.consent import ConsentRecord, ConsentType
from app.models.audit import AuditEvent, AIProcessingLog
from app.models.user import User
from app.schemas.privacy import (
    ConsentRequest,
    ConsentResponse,
    ConsentListResponse,
    AuditEventResponse,
    AIProcessingLogResponse,
    PrivacyDataDeletionResponse,
    PrivacyDataDeletionRequest,
)
from app.security.auth import get_current_active_user, verify_password
from app.services.privacy_shield import PrivacyShieldService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/privacy", tags=["Privacy Shield"])


@router.get("/consents", response_model=ConsentListResponse)
def get_consents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all current consent settings and their statuses."""
    consents = db.query(ConsentRecord).filter(ConsentRecord.user_id == current_user.id).all()
    # If no records exist, return default consent types as not granted
    if not consents:
        defaults = []
        for ct in ConsentType:
            rec = ConsentRecord(
                id=f"default_{ct.value.lower()}",
                user_id=current_user.id,
                consent_type=ct,
                is_granted=False,
            )
            defaults.append(rec)
        return ConsentListResponse(consents=[ConsentResponse.model_validate(c) for c in defaults])

    return ConsentListResponse(consents=[ConsentResponse.model_validate(c) for c in consents])


@router.post("/consents", response_model=ConsentResponse)
def update_consent(
    data: ConsentRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Grant or revoke specific consent (e.g. AI_ANALYSIS, DIGILOCKER_ACCESS)."""
    try:
        c_type = ConsentType(data.consent_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid consent type '{data.consent_type}'.",
        )

    rec = PrivacyShieldService.record_consent(
        db=db,
        user_id=current_user.id,
        consent_type=c_type,
        is_granted=data.is_granted,
        ip_address=request.client.host if request.client else None,
        details=data.details,
    )
    return ConsentResponse.model_validate(rec)


@router.delete("/consents/{consent_type}", response_model=ConsentResponse)
def revoke_consent(
    consent_type: str,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Explicitly revoke a given consent type."""
    try:
        c_type = ConsentType(consent_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid consent type '{consent_type}'.",
        )

    rec = PrivacyShieldService.record_consent(
        db=db,
        user_id=current_user.id,
        consent_type=c_type,
        is_granted=False,
        ip_address=request.client.host if request.client else None,
        details="User revoked consent via Privacy Shield settings.",
    )
    return ConsentResponse.model_validate(rec)


@router.get("/audit-log", response_model=List[AuditEventResponse])
def get_audit_log(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the citizen's personal immutable security audit trail."""
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.user_id == current_user.id)
        .order_by(AuditEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return [AuditEventResponse.model_validate(e) for e in events]


@router.get("/ai-processing-log", response_model=List[AIProcessingLogResponse])
def get_ai_processing_log(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Inspect full transparent log of AI operations performed with redaction audit."""
    logs = (
        db.query(AIProcessingLog)
        .filter(AIProcessingLog.user_id == current_user.id)
        .order_by(AIProcessingLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [AIProcessingLogResponse.model_validate(l) for l in logs]


@router.delete("/data", response_model=PrivacyDataDeletionResponse)
def delete_all_user_data(
    data: PrivacyDataDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Execute complete DPDP Right-to-be-Forgotten data erasure.
    Physically purges vault files and cascades deletions of applications and verifications.
    """
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect. Your account has not been deleted.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Save the ID before deletion; db.commit() expires ORM objects.
    # The User row no longer exists after successful account erasure.
    user_id = current_user.id

    try:
        deleted_counts = PrivacyShieldService.delete_user_data(
            db=db, user_id=user_id
        )
    except (OSError, ValueError, SQLAlchemyError) as exc:
        db.rollback()
        logger.exception("Account data erasure failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data erasure could not be completed. Please retry or contact support.",
        ) from exc

    return PrivacyDataDeletionResponse(
        success=True,
        user_id=user_id,
        deleted_items=deleted_counts,
        message="Your account and associated personal data have been permanently deleted. Necessary security audit events have been retained in anonymized form.",
    )
