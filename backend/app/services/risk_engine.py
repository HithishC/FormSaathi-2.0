"""
Application Risk and Intervention Engine for FormSaathi.
Evaluates application completeness, detects compliance bottlenecks,
computes explainable Readiness Scores, and generates actionable intervention guidance.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatus
from app.models.scheme import Scheme, SchemeDocument
from app.models.document import Document, DocumentVerification
from app.models.user import ApplicantProfile
from app.models.risk import RiskAssessment
from app.schemas.risk import (
    RiskAssessmentResponse,
    RiskFactor,
    ReadinessPassportResponse,
    ReadinessCategory,
)


class RiskEngine:
    """Pre-submission verification & risk mitigation engine."""

    @classmethod
    def assess_application(
        cls,
        db: Session,
        application_id: str,
    ) -> RiskAssessmentResponse:
        """
        Assess risk factors, missing items, and readiness score for an application.
        Scores preparedness across: Profile, Documents, Verification, and Bank readiness.
        """
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application '{application_id}' not found.")

        scheme = db.query(Scheme).filter(Scheme.id == app.scheme_id).first()
        profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == app.user_id).first()
        uploaded_docs = db.query(Document).filter(Document.user_id == app.user_id).all()
        doc_map = {d.document_type: d for d in uploaded_docs}

        risk_factors: List[RiskFactor] = []
        missing_docs: List[str] = []

        total_weight = 100.0
        deductions = 0.0

        # 1. Profile completeness check
        if not profile:
            deductions += 40.0
            risk_factors.append(
                RiskFactor(
                    factor="MISSING_APPLICANT_PROFILE",
                    severity="HIGH",
                    description="Applicant profile has not been configured.",
                    recommendation="Complete the scholarship eligibility questionnaire to establish baseline qualifications.",
                )
            )
        else:
            if not profile.bank_account_linked or not profile.npci_mapped:
                deductions += 15.0
                risk_factors.append(
                    RiskFactor(
                        factor="BANK_DBT_NOT_MAPPED",
                        severity="HIGH",
                        description="Bank account is not mapped to NPCI for Direct Benefit Transfer.",
                        recommendation="Visit your bank branch with your Aadhaar card to map your account on NPCI mapper. Without this, scholarship funds will bounce.",
                    )
                )

            if not profile.sslc_registration_number:
                deductions += 10.0
                risk_factors.append(
                    RiskFactor(
                        factor="MISSING_SSLC_NUMBER",
                        severity="HIGH",
                        description="SSLC registration number / SATS ID is missing from your profile.",
                        recommendation="Enter your 10th standard registration number for automatic board mark verification.",
                    )
                )

            if profile.annual_family_income and profile.annual_family_income > 250000:
                deductions += 25.0
                risk_factors.append(
                    RiskFactor(
                        factor="INCOME_CEILING_WARNING",
                        severity="HIGH",
                        description=f"Annual family income ₹{profile.annual_family_income:,} exceeds the general ceiling of ₹2,50,000.",
                        recommendation="Verify whether your specific category (e.g. SC/ST) permits higher income thresholds or if exclusions apply.",
                    )
                )

        # 2. Mandatory documents check
        req_docs = (
            db.query(SchemeDocument)
            .filter(SchemeDocument.scheme_id == scheme.id, SchemeDocument.is_mandatory == True)
            .all()
        )

        for req in req_docs:
            if req.document_type not in doc_map:
                missing_docs.append(req.document_name)
                deductions += 10.0
                risk_factors.append(
                    RiskFactor(
                        factor=f"MISSING_{req.document_type}",
                        severity="HIGH",
                        description=f"Mandatory document '{req.document_name}' has not been uploaded or imported from DigiLocker.",
                        recommendation=f"Import '{req.document_name}' via DigiLocker or upload a clear scanned PDF in your Secure Vault.",
                    )
                )
            else:
                doc = doc_map[req.document_type]
                # Check verification status
                verif = (
                    db.query(DocumentVerification)
                    .filter(DocumentVerification.document_id == doc.id)
                    .first()
                )
                if verif:
                    if verif.name_match_status == "POSSIBLE_MISMATCH":
                        deductions += 8.0
                        risk_factors.append(
                            RiskFactor(
                                factor=f"NAME_MISMATCH_{req.document_type}",
                                severity="MEDIUM",
                                description=f"Name on '{req.document_name}' does not match your profile name perfectly.",
                                recommendation="Provide an affidavit or ensure names match exactly before college e-attestation.",
                            )
                        )
                    if verif.expiry_status == "EXPIRED":
                        deductions += 15.0
                        risk_factors.append(
                            RiskFactor(
                                factor=f"EXPIRED_{req.document_type}",
                                severity="HIGH",
                                description=f"The certificate '{req.document_name}' has expired.",
                                recommendation="Obtain a freshly renewed certificate from Nadakacheri / Revenue portal.",
                            )
                        )

        # 3. Status-specific risk checks
        if app.status == ApplicationStatus.INFO_REQUESTED:
            deductions += 20.0
            risk_factors.append(
                RiskFactor(
                    factor="UNRESOLVED_DEPARTMENT_QUERY",
                    severity="HIGH",
                    description="The scholarship verification officer has requested clarification or re-upload.",
                    recommendation="Review the department query in the tracking timeline and submit required evidence promptly.",
                )
            )

        # Calculate Readiness Score (bounded between 0 and 100)
        readiness_score = max(0.0, min(100.0, round(total_weight - deductions, 1)))

        # Upsert RiskAssessment record
        existing_ra = (
            db.query(RiskAssessment)
            .filter(RiskAssessment.application_id == application_id)
            .first()
        )

        now = datetime.utcnow()
        factors_data = [rf.model_dump() for rf in risk_factors]

        if existing_ra:
            existing_ra.readiness_score = readiness_score
            existing_ra.risk_factors = factors_data
            existing_ra.missing_documents = missing_docs
            existing_ra.assessed_at = now
            ra_record = existing_ra
        else:
            ra_record = RiskAssessment(
                application_id=application_id,
                readiness_score=readiness_score,
                risk_factors=factors_data,
                missing_documents=missing_docs,
                assessed_at=now,
            )
            db.add(ra_record)

        db.commit()
        db.refresh(ra_record)

        return RiskAssessmentResponse(
            id=ra_record.id,
            application_id=application_id,
            readiness_score=readiness_score,
            risk_factors=risk_factors,
            missing_documents=missing_docs,
            assessed_at=now,
        )

    @classmethod
    def get_readiness_passport(
        cls,
        db: Session,
        application_id: str,
    ) -> ReadinessPassportResponse:
        """Generate comprehensive Readiness Passport summarizing application preparedness."""
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise ValueError(f"Application '{application_id}' not found.")

        scheme = db.query(Scheme).filter(Scheme.id == app.scheme_id).first()
        assessment = cls.assess_application(db, application_id)

        # 4 Categorical readiness evaluations
        profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == app.user_id).first()
        uploaded_docs = db.query(Document).filter(Document.user_id == app.user_id).all()
        doc_map = {d.document_type: d for d in uploaded_docs}

        # Category 1: Profile Completeness
        prof_score = 100.0 if profile and profile.annual_family_income and profile.category and profile.domicile_state else 50.0
        c1 = ReadinessCategory(
            category="Applicant Profile",
            status="COMPLETE" if prof_score == 100 else "PARTIAL",
            score=prof_score,
            items=[
                {"name": "Karnataka Domicile", "status": "VERIFIED" if profile and profile.domicile_state == "Karnataka" else "MISSING"},
                {"name": "Caste Category", "status": "VERIFIED" if profile and profile.category else "MISSING"},
                {"name": "Income Bracket", "status": "VERIFIED" if profile and profile.annual_family_income else "MISSING"},
            ],
        )

        # Category 2: Document Vault
        req_docs = (
            db.query(SchemeDocument)
            .filter(SchemeDocument.scheme_id == scheme.id, SchemeDocument.is_mandatory == True)
            .all()
        )
        matched_count = sum(1 for r in req_docs if r.document_type in doc_map)
        doc_score = round((matched_count / max(len(req_docs), 1)) * 100, 1)
        c2 = ReadinessCategory(
            category="Document Verification",
            status="COMPLETE" if doc_score >= 100 else ("PARTIAL" if doc_score > 0 else "MISSING"),
            score=doc_score,
            items=[
                {"name": r.document_name, "status": "IN_VAULT" if r.document_type in doc_map else "MISSING"}
                for r in req_docs
            ],
        )

        # Category 3: Bank & DBT Seeding
        dbt_ok = bool(profile and profile.bank_account_linked and profile.npci_mapped)
        c3 = ReadinessCategory(
            category="Direct Benefit Transfer (DBT)",
            status="COMPLETE" if dbt_ok else "MISSING",
            score=100.0 if dbt_ok else 20.0,
            items=[
                {"name": "Aadhaar Bank Seeding", "status": "ACTIVE" if profile and profile.bank_account_linked else "INACTIVE"},
                {"name": "NPCI DBT Mapping", "status": "ACTIVE" if profile and profile.npci_mapped else "INACTIVE"},
            ],
        )

        # Category 4: Portal Readiness
        app_status_score = 100.0 if app.status != ApplicationStatus.ELIGIBILITY_CHECKED else 60.0
        c4 = ReadinessCategory(
            category="Portal Submission Status",
            status="COMPLETE" if app.status in [ApplicationStatus.SUBMITTED, ApplicationStatus.APPROVED, ApplicationStatus.BENEFIT_DISBURSED] else "IN_PROGRESS",
            score=app_status_score,
            items=[
                {"name": "Application Reference", "status": app.reference_number},
                {"name": "Tracking Mode", "status": app.tracking_mode.value},
                {"name": "Current Lifecycle Stage", "status": app.status.value},
            ],
        )

        next_steps = []
        if assessment.missing_documents:
            next_steps.append(f"Upload or import remaining {len(assessment.missing_documents)} required documents.")
        if not dbt_ok:
            next_steps.append("Complete Aadhaar seeding and NPCI mapping at your bank branch.")
        if assessment.readiness_score >= 85:
            next_steps.append("Your application is in top shape! Proceed to submit or verify e-Attestation.")
        else:
            next_steps.append("Address High-priority risk factors to maximize pre-submission readiness.")

        return ReadinessPassportResponse(
            application_id=app.id,
            reference_number=app.reference_number,
            scheme_name=scheme.name,
            overall_score=assessment.readiness_score,
            categories=[c1, c2, c3, c4],
            next_steps=next_steps,
            estimated_completion="Ready for Submission" if assessment.readiness_score >= 85 else "Action Items Pending",
        )
