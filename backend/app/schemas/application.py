"""
Pydantic schemas for application tracking.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    """Request to create a new application."""
    scheme_id: str = Field(..., description="UUID of the scheme to apply for")
    tracking_mode: str = Field(default="ASSISTED", description="OFFICIAL or ASSISTED")
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    """Request to update application status."""
    status: str = Field(..., description="New application status")
    source: str = Field(default="USER_REPORTED", description="Source of the update")
    notes: Optional[str] = None


class ApplicationOfficialReference(BaseModel):
    """Request to add official portal reference number."""
    official_reference_number: str = Field(..., min_length=1, max_length=100)


class StatusEventResponse(BaseModel):
    """Individual status change event."""
    id: str
    from_status: Optional[str] = None
    to_status: str
    source: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationResponse(BaseModel):
    """Full application details."""
    id: str
    reference_number: str
    user_id: str
    scheme_id: str
    scheme_name: Optional[str] = None
    status: str
    tracking_mode: str
    official_reference_number: Optional[str] = None
    submitted_at: Optional[datetime] = None
    last_updated_at: datetime
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicationTimeline(BaseModel):
    """Application timeline with all status events."""
    application_id: str
    reference_number: str
    current_status: str
    events: List[StatusEventResponse]


class ApplicationListResponse(BaseModel):
    """List of applications."""
    applications: List[ApplicationResponse]
    total: int
