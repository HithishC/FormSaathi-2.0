"""
Pydantic schemas for eligibility assessment.
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class EligibilityCondition(BaseModel):
    """Individual eligibility condition evaluation result."""
    rule_key: str
    field_name: str
    met: bool
    explanation: str
    is_disqualifying: bool
    applicant_value: Optional[Any] = None
    required_value: Optional[Any] = None


class EligibilityRequest(BaseModel):
    """Request to assess eligibility for a scheme."""
    scheme_id: str = Field(..., description="UUID of the scheme to assess against")


class EligibilityResponse(BaseModel):
    """Complete eligibility assessment result."""
    scheme_id: str
    scheme_name: str
    overall_eligible: bool
    eligibility_percentage: float = Field(..., ge=0, le=100)
    conditions: List[EligibilityCondition]
    disqualifying_conditions: List[EligibilityCondition]
    missing_info: List[str]
    required_documents: List[str]
    recommendation: str


class EligibilityExplainRequest(BaseModel):
    """Request AI explanation of eligibility in a given language."""
    scheme_id: str
    language: str = Field(default="en", description="Target language code (e.g., 'kn' for Kannada, 'hi' for Hindi)")


class EligibilityExplanationResponse(BaseModel):
    """AI-generated explanation of eligibility."""
    scheme_id: str
    language: str
    explanation: str
    original_conditions: List[EligibilityCondition]


class QuestionnaireField(BaseModel):
    """A field in the dynamic eligibility questionnaire."""
    field_name: str
    label: str
    field_type: str  # text, number, select, boolean
    required: bool
    options: Optional[List[str]] = None
    description: Optional[str] = None
    current_value: Optional[Any] = None


class QuestionnaireResponse(BaseModel):
    """Dynamic questionnaire for a scheme."""
    scheme_id: str
    scheme_name: str
    fields: List[QuestionnaireField]
    completion_percentage: float
