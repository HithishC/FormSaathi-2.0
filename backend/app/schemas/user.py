"""
Pydantic schemas for user registration, login, profile, and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: str = Field(..., min_length=5, max_length=255, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars)")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full legal name")
    phone: Optional[str] = Field(None, max_length=15, description="Phone number")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    """Schema for user login (uses OAuth2 form format)."""
    username: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class UserResponse(BaseModel):
    """Public user information response."""
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicantProfileCreate(BaseModel):
    """Schema for creating/setting applicant profile."""
    full_name: Optional[str] = Field(None, max_length=255)
    date_of_birth: Optional[str] = Field(None, description="YYYY-MM-DD format")
    gender: Optional[str] = Field(None, max_length=20)
    category: Optional[str] = Field(None, description="SC/ST/OBC_CAT1/OBC_2A/OBC_2B/OBC_3A/OBC_3B/GENERAL")
    annual_family_income: Optional[int] = Field(None, ge=0)
    domicile_state: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    aadhaar_number: Optional[str] = Field(None, description="Full Aadhaar number (will be hashed, only last 4 stored)")
    bank_account_linked: Optional[bool] = None
    npci_mapped: Optional[bool] = None
    sslc_registration_number: Optional[str] = Field(None, max_length=50)
    current_education_level: Optional[str] = Field(None, max_length=50)
    institution_name: Optional[str] = Field(None, max_length=255)

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            pattern = r"^\d{4}-\d{2}-\d{2}$"
            if not re.match(pattern, v):
                raise ValueError("Date must be in YYYY-MM-DD format")
        return v


class ApplicantProfileUpdate(BaseModel):
    """Schema for updating applicant profile fields."""
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    annual_family_income: Optional[int] = Field(None, ge=0)
    domicile_state: Optional[str] = None
    district: Optional[str] = None
    aadhaar_number: Optional[str] = Field(None, description="Full Aadhaar (will be hashed)")
    bank_account_linked: Optional[bool] = None
    npci_mapped: Optional[bool] = None
    sslc_registration_number: Optional[str] = None
    current_education_level: Optional[str] = None
    institution_name: Optional[str] = None


class ApplicantProfileResponse(BaseModel):
    """Applicant profile response (Aadhaar masked)."""
    id: str
    user_id: str
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    category: Optional[str] = None
    annual_family_income: Optional[int] = None
    domicile_state: Optional[str] = None
    district: Optional[str] = None
    aadhaar_last_four: Optional[str] = None
    bank_account_linked: bool = False
    npci_mapped: bool = False
    sslc_registration_number: Optional[str] = None
    current_education_level: Optional[str] = None
    institution_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
