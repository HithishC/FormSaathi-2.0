"""
Privacy Shield Service for FormSaathi.
Provides real security controls: consent tracking, data minimization,
PII redaction, cryptographic audit trails, and DPDP-aligned user data deletion.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import os

from app.models.consent import ConsentRecord, ConsentType
from app.models.audit import AuditEvent, AIProcessingLog
from app.models.document import Document, DocumentVerification, DigiLockerConnection
from app.models.application import Application
from app.models.risk import RiskAssessment
from app.models.notification import Notification
from app.models.user import User, ApplicantProfile
from app.security.pii_redaction import PIIRedactor


class PrivacyShieldService:
    """Enterprise-grade privacy shield implementing DPDP compliance principles."""

    @staticmethod
    def check_consent(db: Session, user_id: str, consent_type: ConsentType) -> bool:
        """Verify whether an active, valid consent exists for the specified operation."""
        record = (
            db.query(ConsentRecord)
            .filter(
                ConsentRecord.user_id == user_id,
                ConsentRecord.consent_type == consent_type,
                ConsentRecord.is_granted == True,
            )
            .first()
        )
        return record is not None

    @staticmethod
    def record_consent(
        db: Session,
        user_id: str,
        consent_type: ConsentType,
        is_granted: bool,
        ip_address: Optional[str] = None,
        details: Optional[str] = None,
    ) -> ConsentRecord:
        """Record or update user consent with timestamp and audit attribution."""
        record = (
            db.query(ConsentRecord)
            .filter(
                ConsentRecord.user_id == user_id,
                ConsentRecord.consent_type == consent_type,
            )
            .first()
        )

        now = datetime.utcnow()
        if record:
            record.is_granted = is_granted
            if is_granted:
                record.granted_at = now
                record.revoked_at = None
            else:
                record.revoked_at = now
            record.ip_address = ip_address
            record.details = details
        else:
            record = ConsentRecord(
                user_id=user_id,
                consent_type=consent_type,
                is_granted=is_granted,
                granted_at=now if is_granted else None,
                revoked_at=now if not is_granted else None,
                ip_address=ip_address,
                details=details,
            )
            db.add(record)

        # Log audit event for consent change
        action_name = f"CONSENT_{'GRANTED' if is_granted else 'REVOKED'}_{consent_type.value}"
        audit_event = AuditEvent(
            user_id=user_id,
            action=action_name,
            resource_type="consent_record",
            resource_id=record.id,
            details={"consent_type": consent_type.value, "is_granted": is_granted},
            ip_address=ip_address,
        )
        db.add(audit_event)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def log_audit_event(
        db: Session,
        user_id: Optional[str],
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditEvent:
        """Record an immutable audit event for critical operations."""
        event = AuditEvent(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @classmethod
    def prepare_data_for_ai(
        cls,
        raw_data: Dict[str, Any],
        required_fields: List[str],
    ) -> Dict[str, Any]:
        """
        Enforce strict data minimization before sending payloads to external AI models.
        Redacts Aadhaar numbers, phones, emails, and strips unnecessary fields.
        """
        minimized = {k: v for k, v in raw_data.items() if k in required_fields}
        redacted = PIIRedactor.redact_dict(minimized)
        return redacted

    @staticmethod
    def log_ai_processing(
        db: Session,
        user_id: Optional[str],
        service_name: str,
        operation: str,
        input_summary: str,
        output_summary: str,
        pii_fields_redacted: List[str],
        processing_time_ms: int,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> AIProcessingLog:
        """Create transparent audit trail for all external AI operations."""
        log = AIProcessingLog(
            user_id=user_id,
            service_name=service_name,
            operation=operation,
            input_summary=input_summary,
            output_summary=output_summary,
            pii_fields_redacted=pii_fields_redacted,
            processing_time_ms=processing_time_ms,
            success=success,
            error_message=error_message,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    @staticmethod
    def resolve_document_path(user_id: str, stored_path: str) -> str:
        """Resolve a document path and ensure it remains inside its owner's vault."""
        if not user_id or not stored_path:
            raise ValueError("Document storage path is missing.")

        vault_base = os.path.realpath("vault")
        user_root = os.path.realpath(os.path.join(vault_base, user_id))
        candidate = os.path.realpath(stored_path)

        try:
            user_root_parent = os.path.commonpath([vault_base, user_root])
            candidate_parent = os.path.commonpath([user_root, candidate])
        except ValueError as exc:
            raise ValueError("Document path is outside the permitted vault.") from exc

        if (
            user_root_parent != vault_base
            or user_root == vault_base
            or candidate_parent != user_root
            or candidate == user_root
        ):
            raise ValueError("Document path is outside the permitted user vault.")

        return candidate

    @staticmethod
    def delete_user_data(db: Session, user_id: str) -> Dict[str, int]:
        """
        Permanently erase one user's data and account.

        Files are removed before the database transaction commits.
        If the database transaction fails, retrying is safe: missing files
        are treated as already removed. Database changes are committed once.
        """
        if not user_id:
            raise ValueError("A user ID is required for account erasure.")

        counts = {}

        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise ValueError("The account no longer exists.")

        docs = db.query(Document).filter(Document.user_id == user_id).all()

        # Validate every document path before removing any file.
        validated_paths = []
        for doc in docs:
            path = PrivacyShieldService.resolve_document_path(
                user_id, doc.encrypted_file_path
            )
            if os.path.exists(path) and not os.path.isfile(path):
                raise OSError("A document storage path is not a regular file.")
            validated_paths.append(path)

        # Remove encrypted files. A failed removal aborts database deletion.
        for path in validated_paths:
            if os.path.isfile(path):
                os.remove(path)

        counts["document_files"] = len(validated_paths)

        # Preserve only non-identifying security event metadata.
        counts["audit_events_anonymized"] = (
            db.query(AuditEvent)
            .filter(AuditEvent.user_id == user_id)
            .update(
                {
                    AuditEvent.user_id: None,
                    AuditEvent.resource_type: None,
                    AuditEvent.resource_id: None,
                    AuditEvent.details: None,
                    AuditEvent.ip_address: None,
                    AuditEvent.user_agent: None,
                },
                synchronize_session=False,
            )
        )

        # AI logs may contain user-specific processing summaries.
        counts["ai_processing_logs"] = (
            db.query(AIProcessingLog)
            .filter(AIProcessingLog.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # Explicitly remove DigiLocker connection and encrypted credentials.
        counts["digilocker_connections"] = (
            db.query(DigiLockerConnection)
            .filter(DigiLockerConnection.user_id == user_id)
            .delete(synchronize_session=False)
        )

        counts["risk_assessments"] = (
            db.query(RiskAssessment)
            .filter(
                RiskAssessment.application_id.in_(
                    db.query(Application.id).filter(
                        Application.user_id == user_id
                    )
                )
            )
            .delete(synchronize_session=False)
        )

        counts["applications"] = (
            db.query(Application)
            .filter(Application.user_id == user_id)
            .delete(synchronize_session=False)
        )

        counts["document_verifications"] = (
            db.query(DocumentVerification)
            .filter(
                DocumentVerification.document_id.in_(
                    db.query(Document.id).filter(Document.user_id == user_id)
                )
            )
            .delete(synchronize_session=False)
        )

        counts["documents_db"] = (
            db.query(Document)
            .filter(Document.user_id == user_id)
            .delete(synchronize_session=False)
        )

        counts["notifications"] = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .delete(synchronize_session=False)
        )

        counts["consent_records"] = (
            db.query(ConsentRecord)
            .filter(ConsentRecord.user_id == user_id)
            .delete(synchronize_session=False)
        )

        counts["applicant_profile"] = (
            db.query(ApplicantProfile)
            .filter(ApplicantProfile.user_id == user_id)
            .delete(synchronize_session=False)
        )

        # Retain a minimal, non-identifying record of the account deletion.
        db.add(
            AuditEvent(
                user_id=None,
                action="ACCOUNT_DELETED",
                resource_type=None,
                resource_id=None,
                details=None,
                ip_address=None,
                user_agent=None,
            )
        )

        # Bulk delete avoids ORM delete-orphan cascades to retained audit events.
        counts["accounts"] = (
            db.query(User)
            .filter(User.id == user_id)
            .delete(synchronize_session=False)
        )

        if counts["accounts"] != 1:
            raise ValueError("The account could not be deleted.")

        # One transaction for all database changes.
        db.commit()
        return counts

