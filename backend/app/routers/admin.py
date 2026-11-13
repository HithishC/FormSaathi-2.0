"""
Admin Dashboard router for FormSaathi.
Restricted to administrators. Provides scheme oversight, application audits,
and departmental status updates.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus, StatusSource
from app.models.document import Document
from app.models.scheme import Scheme
from app.schemas.user import UserResponse
from app.schemas.application import ApplicationResponse, ApplicationStatusUpdate
from app.security.auth import get_admin_user
from app.services.application_tracker import ApplicationTrackerService

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])


@router.get("/stats")
def get_admin_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Aggregate statistics for admin dashboard."""
    total_users = db.query(User).count()
    total_apps = db.query(Application).count()
    total_docs = db.query(Document).count()
    active_schemes = db.query(Scheme).filter(Scheme.is_active == True).count()

    approved_apps = db.query(Application).filter(Application.status == ApplicationStatus.APPROVED).count()
    disbursed_apps = db.query(Application).filter(Application.status == ApplicationStatus.BENEFIT_DISBURSED).count()
    under_review = db.query(Application).filter(
        Application.status.in_([
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INITIAL_VERIFICATION,
            ApplicationStatus.DEPARTMENT_REVIEW,
        ])
    ).count()

    return {
        "total_users": total_users,
        "total_applications": total_apps,
        "total_documents_secured": total_docs,
        "active_schemes": active_schemes,
        "approved_count": approved_apps,
        "disbursed_count": disbursed_apps,
        "in_progress_count": under_review,
    }


@router.get("/users", response_model=List[UserResponse])
def list_users(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all registered users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/applications")
def list_all_applications(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all submitted applications across all applicants (admin only)."""
    apps = db.query(Application).order_by(Application.created_at.desc()).limit(100).all()
    results = []
    for a in apps:
        user = db.query(User).filter(User.id == a.user_id).first()
        scheme = db.query(Scheme).filter(Scheme.id == a.scheme_id).first()
        results.append({
            "id": a.id,
            "reference_number": a.reference_number,
            "applicant_name": user.full_name if user else "Unknown",
            "applicant_email": user.email if user else "",
            "scheme_name": scheme.name if scheme else "",
            "status": a.status.value,
            "tracking_mode": a.tracking_mode.value,
            "official_reference_number": a.official_reference_number,
            "submitted_at": a.submitted_at,
            "last_updated_at": a.last_updated_at,
        })
    return results


@router.put("/applications/{app_id}/status")
def admin_update_status(
    app_id: str,
    data: ApplicationStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update application lifecycle status from administrative portal."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    try:
        new_status = ApplicationStatus(data.status)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{data.status}'.")

    updated = ApplicationTrackerService.update_status(
        db=db,
        application_id=app.id,
        new_status=new_status,
        source=StatusSource.OFFICIAL_API,
        notes=data.notes or f"Status updated by Administrator {admin.full_name}.",
    )
    return {"message": "Status updated successfully.", "status": updated.status.value}
