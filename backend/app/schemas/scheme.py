"""
Pydantic schemas for scheme-related responses.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class SchemeDocumentResponse(BaseModel):
    """Individual document requirement for a scheme."""
    id: str
    document_type: str
    document_name: str
    is_mandatory: bool
    description: Optional[str] = None
    digilocker_doc_type: Optional[str] = None

    model_config = {"from_attributes": True}


class SchemeEligibilityRuleResponse(BaseModel):
    """Eligibility rule for a scheme."""
    id: str
    rule_key: str
    field_name: str
    operator: str
    value: Any
    description: Optional[str] = None
    is_disqualifying: bool
    condition_category: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class SchemeResponse(BaseModel):
    """Summary scheme information."""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    portal_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SchemeDetailResponse(BaseModel):
    """Detailed scheme information with rules and documents."""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    portal_url: Optional[str] = None
    is_active: bool
    knowledge_base_path: Optional[str] = None
    eligibility_rules: List[SchemeEligibilityRuleResponse] = []
    required_documents: List[SchemeDocumentResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class SchemeListResponse(BaseModel):
    """Paginated list of schemes."""
    schemes: List[SchemeResponse]
    total: int
