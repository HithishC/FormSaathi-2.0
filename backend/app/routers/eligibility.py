"""
Eligibility Engine router for FormSaathi.
Provides rule-based deterministic evaluation, dynamic questionnaires,
and Sarvam AI multilingual explanations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.models.user import User, ApplicantProfile
from app.schemas.eligibility import (
    EligibilityRequest,
    EligibilityResponse,
    EligibilityExplainRequest,
    EligibilityExplanationResponse,
    QuestionnaireResponse,
)
from app.security.auth import get_current_active_user
from app.services.eligibility_engine import EligibilityEngine
from app.services.sarvam_ai import SarvamAIService

router = APIRouter(prefix="/api/eligibility", tags=["Eligibility Engine"])


@router.post("/assess", response_model=EligibilityResponse)
def assess_eligibility(
    request: EligibilityRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Assess user eligibility for a scholarship scheme deterministically."""
    scheme = db.query(Scheme).filter((Scheme.id == request.scheme_id) | (Scheme.slug == request.scheme_id)).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{request.scheme_id}' not found.",
        )

    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    return EligibilityEngine.assess_eligibility(db=db, profile=profile, scheme=scheme)


@router.post("/explain", response_model=EligibilityExplanationResponse)
async def explain_eligibility(
    request: EligibilityExplainRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get natural language explanation of eligibility in Kannada ('kn') or English ('en') via Sarvam AI."""
    scheme = db.query(Scheme).filter((Scheme.id == request.scheme_id) | (Scheme.slug == request.scheme_id)).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{request.scheme_id}' not found.",
        )

    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    assessment = EligibilityEngine.assess_eligibility(db=db, profile=profile, scheme=scheme)

    conditions_dict = [c.model_dump() for c in assessment.conditions]
    explanation = await SarvamAIService.explain_eligibility(
        conditions=conditions_dict,
        overall_eligible=assessment.overall_eligible,
        language=request.language,
        db=db,
        user_id=current_user.id,
    )

    return EligibilityExplanationResponse(
        scheme_id=scheme.id,
        language=request.language,
        explanation=explanation,
        original_conditions=assessment.conditions,
    )


@router.get("/questionnaire/{scheme_id}", response_model=QuestionnaireResponse)
def get_questionnaire(
    scheme_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Fetch the dynamic questionnaire tailored to this scheme's specific criteria."""
    scheme = db.query(Scheme).filter((Scheme.id == scheme_id) | (Scheme.slug == scheme_id)).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found.",
        )

    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    return EligibilityEngine.get_questionnaire(db=db, scheme=scheme, profile=profile)
