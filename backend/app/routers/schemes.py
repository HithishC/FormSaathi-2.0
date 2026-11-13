"""
Schemes router for FormSaathi.
Provides scheme discovery, criteria breakdown, and official document requirements.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.scheme import Scheme, SchemeDocument
from app.schemas.scheme import (
    SchemeResponse,
    SchemeDetailResponse,
    SchemeListResponse,
    SchemeDocumentResponse,
)

router = APIRouter(prefix="/api/schemes", tags=["Schemes"])


@router.get("", response_model=SchemeListResponse)
def list_schemes(db: Session = Depends(get_db)):
    """List all active government scholarship schemes."""
    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    return SchemeListResponse(
        schemes=[SchemeResponse.model_validate(s) for s in schemes],
        total=len(schemes),
    )


@router.get("/{scheme_id}", response_model=SchemeDetailResponse)
def get_scheme(scheme_id: str, db: Session = Depends(get_db)):
    """Get full details of a specific scholarship scheme including rules and document checklist."""
    scheme = db.query(Scheme).filter((Scheme.id == scheme_id) | (Scheme.slug == scheme_id)).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found.",
        )
    return SchemeDetailResponse.model_validate(scheme)


@router.get("/{scheme_id}/documents", response_model=List[SchemeDocumentResponse])
def get_scheme_documents(scheme_id: str, db: Session = Depends(get_db)):
    """Get the official checklist of documents required for this scheme."""
    scheme = db.query(Scheme).filter((Scheme.id == scheme_id) | (Scheme.slug == scheme_id)).first()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found.",
        )
    docs = db.query(SchemeDocument).filter(SchemeDocument.scheme_id == scheme.id).all()
    return [SchemeDocumentResponse.model_validate(d) for d in docs]
