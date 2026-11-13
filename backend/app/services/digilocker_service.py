"""
DigiLocker Integration Service for FormSaathi.
Provides consent-based authorized document access.
Includes a fully functional, transparently labelled SANDBOX implementation
for development and evaluation when live DigiLocker partner credentials are unavailable.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.document import Document, DocumentSource, DigiLockerConnection
from app.models.consent import ConsentType
from app.schemas.digilocker import (
    DigiLockerAuthResponse,
    DigiLockerStatusResponse,
    DigiLockerDocumentInfo,
    DigiLockerDocumentListResponse,
    DigiLockerFetchResponse,
)
from app.services.privacy_shield import PrivacyShieldService

settings = get_settings()


class DigiLockerService:
    """Consent-driven DigiLocker service with transparent sandbox demarcation."""

    SANDBOX_DOCUMENTS = [
        {
            "doc_type": "INCOME_CERTIFICATE",
            "name": "Income Certificate (ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ)",
            "description": "Form No. 16/RD certificate issued by Revenue Department, Govt of Karnataka",
            "issuer": "Revenue Department, Government of Karnataka (Nadakacheri)",
            "uri": "in.gov.kar.nadakacheri-INC-2024-984210",
            "sample_fields": {
                "certificate_number": "RD00382910482",
                "applicant_name": "Ramesh Kumar Gowda",
                "annual_income": 180000,
                "issued_date": "2024-05-15",
                "valid_till": "2029-05-14",
                "issuing_authority": "Tahsildar, Bengaluru South",
                "status": "VALID",
            },
        },
        {
            "doc_type": "CASTE_CERTIFICATE",
            "name": "Caste & Community Certificate (ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ)",
            "description": "Category-1 / 2A / 3A / SC / ST Certificate issued by Revenue Authority",
            "issuer": "Revenue Department, Government of Karnataka (Nadakacheri)",
            "uri": "in.gov.kar.nadakacheri-CST-2024-510928",
            "sample_fields": {
                "certificate_number": "RD00592817402",
                "applicant_name": "Ramesh Kumar Gowda",
                "category": "OBC_CAT1",
                "caste_name": "Category-1 (Rural/Backward)",
                "issued_date": "2023-08-10",
                "valid_till": "PERMANENT / LIFELONG",
                "issuing_authority": "Tahsildar, Bengaluru South",
                "status": "VALID",
            },
        },
        {
            "doc_type": "SSLC_MARKSHEET",
            "name": "10th / SSLC Examination Marksheet",
            "description": "Secondary School Leaving Certificate (KSEEB / SATS)",
            "issuer": "Karnataka Secondary Education Examination Board (KSEAB)",
            "uri": "in.gov.kar.kseeb-SSLC-2021-849201",
            "sample_fields": {
                "registration_number": "20210849201",
                "student_name": "Ramesh Kumar Gowda",
                "year_of_passing": 2021,
                "total_marks": 542,
                "max_marks": 625,
                "percentage": 86.72,
                "grade": "DISTINCTION",
                "status": "VERIFIED",
            },
        },
        {
            "doc_type": "AADHAAR",
            "name": "Aadhaar Card (UIDAI Digital e-Aadhaar)",
            "description": "Masked e-Aadhaar with verification signature (Last 4 digits only)",
            "issuer": "Unique Identification Authority of India (UIDAI)",
            "uri": "in.gov.uidai-EAA-2024-739102",
            "sample_fields": {
                "masked_aadhaar": "XXXX-XXXX-4819",
                "name": "Ramesh Kumar Gowda",
                "gender": "MALE",
                "dob": "2004-06-18",
                "state": "Karnataka",
                "pincode": "560068",
                "status": "VERIFIED_DIGITALLY",
            },
        },
    ]

    @classmethod
    def get_auth_url(cls, state: str) -> DigiLockerAuthResponse:
        """
        Generate DigiLocker OAuth 2.0 authorization URL.
        Returns a sandbox URL pointing to our verified simulation flow.
        """
        auth_url = (
            f"{settings.DIGILOCKER_AUTH_URL}?"
            f"response_type=code&"
            f"client_id={settings.DIGILOCKER_CLIENT_ID}&"
            f"redirect_uri={settings.DIGILOCKER_REDIRECT_URI}&"
            f"state={state}&"
            f"scope=user,documents"
        )
        return DigiLockerAuthResponse(
            auth_url=auth_url,
            state=state,
            sandbox_mode=True,
        )

    @classmethod
    def connect_sandbox(
        cls,
        db: Session,
        user_id: str,
        code: str,
        ip_address: Optional[str] = None,
    ) -> DigiLockerStatusResponse:
        """Complete the OAuth consent exchange for the user in Sandbox mode."""
        conn = db.query(DigiLockerConnection).filter(DigiLockerConnection.user_id == user_id).first()
        now = datetime.utcnow()
        expiry = now + timedelta(days=30)

        fake_token = f"dl_sbx_tok_{uuid.uuid4().hex}"
        fake_dl_id = f"DL-IN-KAR-{uuid.uuid4().hex[:8].upper()}"

        if conn:
            conn.is_connected = True
            conn.connected_at = now
            conn.revoked_at = None
            conn.token_expires_at = expiry
            conn.access_token_encrypted = fake_token
            conn.digilocker_id_encrypted = fake_dl_id
        else:
            conn = DigiLockerConnection(
                user_id=user_id,
                is_connected=True,
                connected_at=now,
                token_expires_at=expiry,
                access_token_encrypted=fake_token,
                digilocker_id_encrypted=fake_dl_id,
            )
            db.add(conn)

        # Record consent in Privacy Shield
        PrivacyShieldService.record_consent(
            db=db,
            user_id=user_id,
            consent_type=ConsentType.DIGILOCKER_ACCESS,
            is_granted=True,
            ip_address=ip_address,
            details="User consented to retrieve verified educational and identity certificates via DigiLocker Sandbox.",
        )

        db.commit()
        db.refresh(conn)

        return DigiLockerStatusResponse(
            is_connected=True,
            connected_at=conn.connected_at,
            sandbox_mode=True,
        )

    @classmethod
    def get_status(cls, db: Session, user_id: str) -> DigiLockerStatusResponse:
        """Check active DigiLocker connection status for user."""
        conn = db.query(DigiLockerConnection).filter(DigiLockerConnection.user_id == user_id).first()
        if conn and conn.is_connected:
            return DigiLockerStatusResponse(
                is_connected=True,
                connected_at=conn.connected_at,
                sandbox_mode=True,
            )
        return DigiLockerStatusResponse(
            is_connected=False,
            connected_at=None,
            sandbox_mode=True,
        )

    @classmethod
    def list_available_documents(cls, db: Session, user_id: str) -> DigiLockerDocumentListResponse:
        """Return documents available for import from DigiLocker repository."""
        docs = [
            DigiLockerDocumentInfo(
                doc_type=d["doc_type"],
                name=d["name"],
                description=d["description"],
                issuer=d["issuer"],
                available=True,
                uri=d["uri"],
                sandbox_mode=True,
            )
            for d in cls.SANDBOX_DOCUMENTS
        ]
        return DigiLockerDocumentListResponse(
            documents=docs,
            sandbox_mode=True,
        )

    @classmethod
    def fetch_document(
        cls,
        db: Session,
        user_id: str,
        doc_type: str,
    ) -> DigiLockerFetchResponse:
        """
        Sandbox catalogue entries are demonstrations, not real issued documents.
        Do not create fake verified records or placeholder encrypted file paths.
        """
        target_doc = next(
            (d for d in cls.SANDBOX_DOCUMENTS if d["doc_type"] == doc_type),
            None,
        )
        if not target_doc:
            raise ValueError(
                f"Document type '{doc_type}' is not available in the sandbox catalogue."
            )

        raise RuntimeError(
            "DigiLocker sandbox import is demonstration-only. "
            "No real certificate was retrieved, stored, or verified. "
            "Upload an actual document to use the secure vault."
        )

    @classmethod
    def disconnect(cls, db: Session, user_id: str) -> bool:
        """Revoke DigiLocker connection and invalidate access tokens."""
        conn = db.query(DigiLockerConnection).filter(DigiLockerConnection.user_id == user_id).first()
        if conn:
            conn.is_connected = False
            conn.revoked_at = datetime.utcnow()
            conn.access_token_encrypted = None

        PrivacyShieldService.record_consent(
            db=db,
            user_id=user_id,
            consent_type=ConsentType.DIGILOCKER_ACCESS,
            is_granted=False,
            details="User revoked DigiLocker access.",
        )

        db.commit()
        return True
