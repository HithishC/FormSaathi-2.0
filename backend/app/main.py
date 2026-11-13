"""
FormSaathi 2.0 — FastAPI Application Entrypoint.
An AI-powered, privacy-first government application intelligence and tracking platform.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import os

from app.config import get_settings
from app.database import create_all_tables, SessionLocal
from app.models.user import User, UserRole, ApplicantProfile, CategoryEnum
from app.models.scheme import Scheme, SchemeEligibilityRule, SchemeDocument, RuleOperator
from app.models.consent import ConsentRecord, ConsentType
from app.security.auth import hash_password
from app.security.encryption import hash_aadhaar
from app.routers import (
    auth_router,
    schemes_router,
    eligibility_router,
    documents_router,
    digilocker_router,
    applications_router,
    privacy_router,
    risk_router,
    notifications_router,
    admin_router,
)

settings = get_settings()


def seed_database():
    """Seed the flagship Karnataka scheme if it is not already present."""
    db = SessionLocal()
    try:
        # 1. Seed Flagship Scheme: Karnataka Post-Matric Scholarship
        scheme_file = os.path.join(os.path.dirname(__file__), "data", "schemes", "karnataka_post_matric.json")
        if os.path.exists(scheme_file):
            with open(scheme_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            existing_scheme = db.query(Scheme).filter(Scheme.id == data["id"]).first()
            if not existing_scheme:
                scheme = Scheme(
                    id=data["id"],
                    name=data["name"],
                    slug=data["id"],
                    description=data.get("description"),
                    department=data.get("department"),
                    category="Post-Matric Scholarship",
                    portal_url=data.get("portal_url"),
                    is_active=True,
                    knowledge_base_path=scheme_file,
                )
                db.add(scheme)
                db.flush()

                # Add rules
                for r in data.get("eligibility_rules", []):
                    rule_record = SchemeEligibilityRule(
                        scheme_id=scheme.id,
                        rule_key=r["rule_key"],
                        field_name=r["field_name"],
                        operator=RuleOperator(r["operator"]),
                        value=r["value"],
                        description=r.get("description"),
                        is_disqualifying=r.get("is_disqualifying", False),
                        condition_category=r.get("condition_category"),
                    )
                    db.add(rule_record)

                # Add documents
                for d in data.get("required_documents", []):
                    doc_record = SchemeDocument(
                        scheme_id=scheme.id,
                        document_type=d["type"],
                        document_name=d["name"],
                        is_mandatory=d.get("mandatory", True),
                        description=d.get("description"),
                        digilocker_doc_type=d.get("digilocker_type"),
                    )
                    db.add(doc_record)

                db.commit()

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    # Create all tables on startup
    create_all_tables()
    seed_database()
    yield


app = FastAPI(
    title="FormSaathi 2.0 API",
    description="Privacy-First AI-Powered Government Scheme Assistance Platform",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(documents_router)
app.include_router(digilocker_router)
app.include_router(applications_router)
app.include_router(privacy_router)
app.include_router(risk_router)
app.include_router(notifications_router)
app.include_router(admin_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint for operational monitoring."""
    return {
        "status": "healthy",
        "service": "FormSaathi API",
        "version": "2.0.0",
        "flagship_scheme": "Karnataka Post-Matric Scholarship",
        "privacy_shield": "ACTIVE",
        "sandbox_mode": True,
    }
