"""
Application Lifecycle Tracking Service for FormSaathi.
Tracks the complete journey across 10 official stages from discovery to disbursement.
Maintains an immutable timeline of status transitions and notifications.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.application import (
    Application,
    ApplicationStatus,
    TrackingMode,
    StatusSource,
    ApplicationStatusEvent,
    generate_reference_number,
)
from app.models.notification import Notification, NotificationType
from app.models.scheme import Scheme
from app.schemas.application import (
    ApplicationResponse,
    StatusEventResponse,
    ApplicationTimeline,
)


class ApplicationTrackerService:
    """Manages application creation, state transitions, timeline, and notification dispatch."""

    # 10 official lifecycle stages in canonical order
    STAGE_ORDER = [
        ApplicationStatus.ELIGIBILITY_CHECKED,
        ApplicationStatus.DOCUMENTS_PREPARED,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.INITIAL_VERIFICATION,
        ApplicationStatus.DEPARTMENT_REVIEW,
        ApplicationStatus.INFO_REQUESTED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.BENEFIT_SANCTIONED,
        ApplicationStatus.PAYMENT_INITIATED,
        ApplicationStatus.BENEFIT_DISBURSED,
    ]

    STAGE_DESCRIPTIONS = {
        ApplicationStatus.ELIGIBILITY_CHECKED: "Scheme criteria evaluated and confirmed against official norms.",
        ApplicationStatus.DOCUMENTS_PREPARED: "Mandatory certificates (Income, Caste, SSLC, Admission) compiled & verified in vault.",
        ApplicationStatus.SUBMITTED: "Application uploaded and locked on official State Scholarship Portal (SSP).",
        ApplicationStatus.INITIAL_VERIFICATION: "College e-Attestation Officer verified original certificates.",
        ApplicationStatus.DEPARTMENT_REVIEW: "Social Welfare / Backward Classes Welfare Department reviewing application.",
        ApplicationStatus.INFO_REQUESTED: "Department nodal officer requested document clarification / correction.",
        ApplicationStatus.APPROVED: "Application successfully approved by sanctioning authority.",
        ApplicationStatus.REJECTED: "Application rejected. Review objection notes and re-apply or appeal.",
        ApplicationStatus.BENEFIT_SANCTIONED: "Scholarship financial grant officially sanctioned by the Department.",
        ApplicationStatus.PAYMENT_INITIATED: "Direct Benefit Transfer (DBT) payment instruction sent via PFMS / K2 treasury.",
        ApplicationStatus.BENEFIT_DISBURSED: "Scholarship funds successfully credited to student's Aadhaar-linked bank account.",
    }

    @classmethod
    def create_application(
        cls,
        db: Session,
        user_id: str,
        scheme_id: str,
        tracking_mode: TrackingMode = TrackingMode.ASSISTED,
        official_ref: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Application:
        """Create a new application tracking record with initial ELIGIBILITY_CHECKED status."""
        scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
        if not scheme:
            raise ValueError(f"Scheme with id '{scheme_id}' not found.")

        # Check if active application already exists for this scheme and user
        existing = (
            db.query(Application)
            .filter(
                Application.user_id == user_id,
                Application.scheme_id == scheme_id,
            )
            .first()
        )
        if existing:
            return existing

        now = datetime.utcnow()
        app = Application(
            user_id=user_id,
            scheme_id=scheme_id,
            status=ApplicationStatus.ELIGIBILITY_CHECKED,
            tracking_mode=tracking_mode,
            official_reference_number=official_ref,
            submitted_at=now,
            last_updated_at=now,
            notes=notes or "Application tracking started on FormSaathi.",
        )
        db.add(app)
        db.flush()

        # Record initial status event
        event = ApplicationStatusEvent(
            application_id=app.id,
            from_status=None,
            to_status=ApplicationStatus.ELIGIBILITY_CHECKED.value,
            source=StatusSource.SYSTEM,
            notes=cls.STAGE_DESCRIPTIONS[ApplicationStatus.ELIGIBILITY_CHECKED],
            created_at=now,
        )
        db.add(event)

        # Create user notification
        notif = Notification(
            user_id=user_id,
            title="Application Journey Started",
            message=f"Application {app.reference_number} for {scheme.name} is now tracked. Next step: Prepare required documents.",
            notification_type=NotificationType.SUCCESS,
            related_entity_type="application",
            related_entity_id=app.id,
        )
        db.add(notif)

        db.commit()
        db.refresh(app)
        return app

    @classmethod
    def update_status(
        cls,
        db: Session,
        application_id: str,
        new_status: ApplicationStatus,
        source: StatusSource = StatusSource.USER_REPORTED,
        notes: Optional[str] = None,
    ) -> Application:
        """Advance application stage and add chronological event."""
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application '{application_id}' not found.")

        old_status = app.status.value if app.status else None
        now = datetime.utcnow()

        app.status = new_status
        app.last_updated_at = now
        if notes:
            app.notes = notes

        event_note = notes or cls.STAGE_DESCRIPTIONS.get(new_status, f"Status transitioned to {new_status.value}")
        event = ApplicationStatusEvent(
            application_id=app.id,
            from_status=old_status,
            to_status=new_status.value,
            source=source,
            notes=event_note,
            created_at=now,
        )
        db.add(event)

        # Notify user
        notif = Notification(
            user_id=app.user_id,
            title=f"Application Status Updated: {new_status.value.replace('_', ' ').title()}",
            message=f"Ref {app.reference_number}: {event_note}",
            notification_type=NotificationType.INFO,
            related_entity_type="application",
            related_entity_id=app.id,
        )
        db.add(notif)

        db.commit()
        db.refresh(app)
        return app

    @classmethod
    def get_timeline(cls, db: Session, application_id: str) -> ApplicationTimeline:
        """Fetch full chronological status history for an application."""
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application '{application_id}' not found.")

        events = (
            db.query(ApplicationStatusEvent)
            .filter(ApplicationStatusEvent.application_id == application_id)
            .order_by(ApplicationStatusEvent.created_at.asc())
            .all()
        )

        return ApplicationTimeline(
            application_id=app.id,
            reference_number=app.reference_number,
            current_status=app.status.value,
            events=[StatusEventResponse.model_validate(e) for e in events],
        )
