"""
Document Vault router for FormSaathi.
Provides encrypted document upload, metadata listing, and deletion.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import re
import logging
import uuid
from datetime import datetime
from io import BytesIO
import warnings
from pypdf import PdfReader
from PIL import Image

from app.database import get_db
from app.models.document import Document, DocumentSource, DocumentType
from app.models.user import User
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentResponse,
    DocumentListResponse,
)
from app.security.auth import get_current_active_user
from app.security.encryption import EncryptionService
from app.services.privacy_shield import PrivacyShieldService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Document Vault"])



def _validate_file_structure(content: bytes, detected_mime: str) -> None:
    """Reject malformed or unsafe PDF and image structures."""

    if detected_mime == "application/pdf":
        try:
            reader = PdfReader(BytesIO(content), strict=True)

            if reader.is_encrypted:
                raise ValueError("Encrypted PDFs are not supported.")

            if len(reader.pages) < 1:
                raise ValueError("PDF contains no pages.")

            # Force page content streams to be parsed as well.
            for page in reader.pages:
                page_contents = page.get_contents()
                if page_contents is not None:
                    page_contents.get_data()

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="The PDF is malformed, encrypted, or cannot be parsed.",
            ) from exc

        return

    expected_format = {
        "image/jpeg": "JPEG",
        "image/png": "PNG",
    }.get(detected_mime)

    if expected_format is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported document format.",
        )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)

            with Image.open(BytesIO(content)) as image:
                if image.format != expected_format:
                    raise ValueError("Image format mismatch.")

                width, height = image.size

                if width <= 0 or height <= 0:
                    raise ValueError("Invalid image dimensions.")

                if width * height > 40_000_000:
                    raise ValueError("Image dimensions exceed the safety limit.")

                image.verify()

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="The image is malformed, truncated, or exceeds the image safety limit.",
        ) from exc


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Validate and encrypt an uploaded PDF, JPEG, or PNG document.
    Only encrypted bytes are written to the vault.
    """
    max_upload_size = 10 * 1024 * 1024

    # Read at most one byte beyond the limit to avoid unbounded reads.
    content = await file.read(max_upload_size + 1)
    await file.close()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty files cannot be uploaded.",
        )

    if len(content) > max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 10MB limit.",
        )

    # Sanitize the filename and reject missing/unsupported extensions.
    raw_filename = (file.filename or "").replace("\\", "/")
    safe_filename = os.path.basename(raw_filename)
    safe_filename = re.sub(
        r'[\x00-\x1f<>:"/\\|?*]',
        "_",
        safe_filename,
    ).strip(" .")

    if not safe_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid filename is required.",
        )

    extension = os.path.splitext(safe_filename)[1].lower()

    # Detect file type from its actual binary signature.
    if content.startswith(b"%PDF-"):
        detected_mime = "application/pdf"
        expected_extension = {".pdf"}
    elif content.startswith(b"\xff\xd8\xff"):
        detected_mime = "image/jpeg"
        expected_extension = {".jpg", ".jpeg"}
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        detected_mime = "image/png"
        expected_extension = {".png"}
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file content. Upload a valid PDF, JPEG, or PNG.",
        )

    if extension not in expected_extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File extension does not match the actual file content.",
        )

    supplied_mime = (file.content_type or "").split(";")[0].strip().lower()

    if supplied_mime and supplied_mime not in (
        detected_mime,
        "application/octet-stream",
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Declared MIME type does not match the actual file content.",
        )

    # Validate the actual file structure before encryption or storage.
    _validate_file_structure(content, detected_mime)

    # Resolve the document type against the actual enum.
    if document_type and document_type.strip():
        normalized_type = document_type.strip().upper()
        try:
            resolved_type = DocumentType[normalized_type]
        except KeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document type.",
            )
    else:
        resolved_type = DocumentType.OTHER

    # Encrypt before writing anything to persistent storage.
    enc_service = EncryptionService()
    encrypted_bytes = enc_service.encrypt_file(content)

    vault_dir = os.path.join("vault", current_user.id)
    file_id = uuid.uuid4().hex
    enc_file_path = os.path.join(vault_dir, f"{file_id}.enc")

    file_written = False

    try:
        os.makedirs(vault_dir, exist_ok=True)

        # Exclusive creation prevents accidental overwriting.
        with open(enc_file_path, "xb") as encrypted_file:
            encrypted_file.write(encrypted_bytes)

        file_written = True

        doc = Document(
            user_id=current_user.id,
            document_type=resolved_type,
            original_filename=safe_filename,
            encrypted_file_path=enc_file_path,
            file_size=len(content),
            mime_type=detected_mime,
            source=DocumentSource.UPLOAD,
            is_verified=False,
            uploaded_at=datetime.utcnow(),
        )

        db.add(doc)
        db.flush()

        PrivacyShieldService.log_audit_event(
            db=db,
            user_id=current_user.id,
            action="DOCUMENT_UPLOADED",
            resource_type="document",
            resource_id=doc.id,
            details={
                "filename": safe_filename,
                "document_type": resolved_type.value,
                "encrypted": True,
                "mime_type": detected_mime,
            },
        )

        db.commit()

    except Exception:
        logger.exception("Document upload failed during storage or database transaction")
        db.rollback()

        # Remove the encrypted file if the database transaction fails.
        if os.path.exists(enc_file_path):
            try:
                os.remove(enc_file_path)
            except OSError:
                logger.exception("Failed to remove orphaned encrypted upload after rollback")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document upload failed. No document was saved.",
        )

    return DocumentUploadResponse.model_validate(doc)


@router.get("", response_model=DocumentListResponse)
def list_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List all documents currently stored in the applicant's Secure Vault."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve document metadata and verification status (never exposes raw file content)."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{doc_id}' not found in vault.",
        )
    return DocumentResponse.model_validate(doc)


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Securely delete a document and purge encrypted bytes from storage."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{doc_id}' not found.",
        )

    try:
        file_path = PrivacyShieldService.resolve_document_path(
            current_user.id, doc.encrypted_file_path
        )
        if os.path.exists(file_path):
            if not os.path.isfile(file_path):
                raise OSError("Document storage path is not a regular file.")
            os.remove(file_path)
    except (ValueError, OSError) as exc:
        db.rollback()
        logger.exception("Document deletion failed for document %s", doc_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document could not be securely deleted. Its record has been preserved.",
        ) from exc

    db.delete(doc)

    PrivacyShieldService.log_audit_event(
        db=db,
        user_id=current_user.id,
        action="DOCUMENT_DELETED",
        resource_type="document",
        resource_id=doc_id,
    )

    db.commit()
    return {"message": "Document securely deleted from vault."}


@router.post("/{doc_id}/analyze")
def analyze_document(
    doc_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Check document ownership before reporting analysis availability.
    Genuine OCR and AI analysis remain disabled.
    """
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Document analysis is temporarily unavailable. "
            "No OCR or AI extraction was performed, and this document "
            "has not been verified."
        ),
    )
