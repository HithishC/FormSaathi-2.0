"""
Applications and Lifecycle Tracking router for FormSaathi.
Handles scholarship application creation, status timeline retrieval,
assisted tracking updates, and official SSP reference pairing.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.application import Application, ApplicationStatus, TrackingMode, StatusSource
from app.models.scheme import Scheme
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationStatusUpdate,
    ApplicationOfficialReference,
    ApplicationTimeline,
    StatusEventResponse,
)
from app.security.auth import get_current_active_user
from app.services.application_tracker import ApplicationTrackerService

router = APIRouter(prefix="/api/applications", tags=["Applications & Tracking"])


def _format_app_response(app: Application, db: Session) -> ApplicationResponse:
    scheme = db.query(Scheme).filter(Scheme.id == app.scheme_id).first()
    return ApplicationResponse(
        id=app.id,
        reference_number=app.reference_number,
        user_id=app.user_id,
        scheme_id=app.scheme_id,
        scheme_name=scheme.name if scheme else "Karnataka Scholarship",
        status=app.status.value,
        tracking_mode=app.tracking_mode.value,
        official_reference_number=app.official_reference_number,
        submitted_at=app.submitted_at,
        last_updated_at=app.last_updated_at,
        notes=app.notes,
        created_at=app.created_at,
    )


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new application tracking lifecycle record for a scheme."""
    try:
        mode = TrackingMode(data.tracking_mode)
    except ValueError:
        mode = TrackingMode.ASSISTED

    try:
        app = ApplicationTrackerService.create_application(
            db=db,
            user_id=current_user.id,
            scheme_id=data.scheme_id,
            tracking_mode=mode,
            notes=data.notes,
        )
        return _format_app_response(app, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all tracked applications for the authenticated applicant."""
    apps = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    formatted = [_format_app_response(a, db) for a in apps]
    return ApplicationListResponse(applications=formatted, total=len(formatted))


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get complete details for an individual application."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )
    return _format_app_response(app, db)


@router.get("/{app_id}/timeline", response_model=ApplicationTimeline)
def get_application_timeline(
    app_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the chronological lifecycle stage history for an application."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    timeline_data = ApplicationTrackerService.get_timeline(db=db, application_id=app.id)
    return ApplicationTimeline(
        application_id=app.id,
        reference_number=app.reference_number,
        current_status=app.status.value,
        events=[
            StatusEventResponse(
                id=e.id,
                from_status=e.from_status,
                to_status=e.to_status,
                source=e.source.value if hasattr(e.source, "value") else str(e.source),
                notes=e.notes,
                created_at=e.created_at,
            )
            for e in timeline_data.events
        ],
    )


@router.put("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(
    app_id: str,
    data: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Advance status stage in assisted tracking mode (with source attribution)."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    try:
        new_status = ApplicationStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{data.status}'.",
        )

    try:
        source = StatusSource(data.source)
    except ValueError:
        source = StatusSource.USER_REPORTED

    updated_app = ApplicationTrackerService.update_status(
        db=db,
        application_id=app.id,
        new_status=new_status,
        source=source,
        notes=data.notes,
    )
    return _format_app_response(updated_app, db)


@router.put("/{app_id}/official-reference", response_model=ApplicationResponse)
def set_official_reference(
    app_id: str,
    data: ApplicationOfficialReference,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Pair official State Scholarship Portal (SSP) reference ID."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    app.official_reference_number = data.official_reference_number
    db.commit()
    db.refresh(app)
    return _format_app_response(app, db)
