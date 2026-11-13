"""
Pydantic schemas for risk assessment and readiness passport.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class RiskFactor(BaseModel):
    """Individual risk factor identified."""
    factor: str
    severity: str  # HIGH, MEDIUM, LOW
    description: str
    recommendation: str


class RiskAssessmentResponse(BaseModel):
    """Risk assessment result for an application."""
    id: str
    application_id: str
    readiness_score: float = Field(..., ge=0, le=100)
    risk_factors: List[RiskFactor] = []
    missing_documents: List[str] = []
    assessed_at: datetime

    model_config = {"from_attributes": True}


class ReadinessCategory(BaseModel):
    """A category in the readiness passport."""
    category: str
    status: str  # COMPLETE, PARTIAL, MISSING
    score: float
    items: List[Dict[str, Any]]


class ReadinessPassportResponse(BaseModel):
    """Comprehensive readiness view for an application."""
    application_id: str
    reference_number: str
    scheme_name: str
    overall_score: float
    categories: List[ReadinessCategory]
    next_steps: List[str]
    estimated_completion: str
