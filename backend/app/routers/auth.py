"""
Authentication and user profile router for FormSaathi.
Handles registration, login, profile retrieval, and privacy-preserving profile updates.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User, UserRole, ApplicantProfile, CategoryEnum
from app.schemas.user import (
    UserCreate,
    Token,
    UserResponse,
    ApplicantProfileCreate,
    ApplicantProfileUpdate,
    ApplicantProfileResponse,
)
from app.security.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from app.security.encryption import hash_aadhaar
from app.services.privacy_shield import PrivacyShieldService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new citizen applicant account."""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = User(
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.APPLICANT,
    )
    db.add(user)
    db.flush()

    # Create empty initial applicant profile
    profile = ApplicantProfile(
        user_id=user.id,
        full_name=user_data.full_name,
        domicile_state="Karnataka",
    )
    db.add(profile)

    # Log audit event
    PrivacyShieldService.log_audit_event(
        db=db,
        user_id=user.id,
        action="USER_REGISTERED",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None,
    )

    db.commit()

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
    )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """Authenticate user with username (email) and password."""
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    if request:
        PrivacyShieldService.log_audit_event(
            db=db,
            user_id=user.id,
            action="USER_LOGIN",
            resource_type="user",
            resource_id=user.id,
            ip_address=request.client.host if request.client else None,
        )

    token = create_access_token(data={"sub": user.id, "role": user.role.value})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        role=user.role.value,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve currently authenticated user profile."""
    return current_user


@router.get("/profile", response_model=ApplicantProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the applicant's scholarship profile."""
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    if not profile:
        profile = ApplicantProfile(user_id=current_user.id, full_name=current_user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile", response_model=ApplicantProfileResponse)
def update_profile(
    profile_data: ApplicantProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update applicant scholarship profile with privacy preservation."""
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    if not profile:
        profile = ApplicantProfile(user_id=current_user.id)
        db.add(profile)

    update_dict = profile_data.model_dump(exclude_unset=True)

    # Secure Aadhaar handling: hash full Aadhaar and store only last 4
    if "aadhaar_number" in update_dict and update_dict["aadhaar_number"]:
        raw_aadhaar = str(update_dict.pop("aadhaar_number")).replace(" ", "").replace("-", "")
        if len(raw_aadhaar) == 12:
            profile.aadhaar_hash = hash_aadhaar(raw_aadhaar)
            profile.aadhaar_last_four = raw_aadhaar[-4:]
    elif "aadhaar_number" in update_dict:
        update_dict.pop("aadhaar_number")

    if "category" in update_dict and update_dict["category"]:
        try:
            profile.category = CategoryEnum(update_dict.pop("category"))
        except ValueError:
            pass

    for k, v in update_dict.items():
        if hasattr(profile, k) and v is not None:
            setattr(profile, k, v)

    db.commit()
    db.refresh(profile)
    return profile
