"""
Risk Assessment and Readiness Passport router for FormSaathi.
Provides pre-submission application quality scores, bottlenecks, and intervention guidance.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.models.user import User
from app.schemas.risk import RiskAssessmentResponse, ReadinessPassportResponse
from app.security.auth import get_current_active_user
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/api/risk", tags=["Risk & Readiness Engine"])


@router.get("/assessment/{app_id}", response_model=RiskAssessmentResponse)
def get_risk_assessment(
    app_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Compute application readiness score and ranked risk factors."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    return RiskEngine.assess_application(db=db, application_id=app.id)


@router.get("/readiness/{app_id}", response_model=ReadinessPassportResponse)
def get_readiness_passport(
    app_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve the comprehensive Scheme Readiness Passport with actionable next steps."""
    app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application '{app_id}' not found.",
        )

    return RiskEngine.get_readiness_passport(db=db, application_id=app.id)
