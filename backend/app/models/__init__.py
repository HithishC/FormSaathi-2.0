"""
SQLAlchemy ORM models for FormSaathi.
All models are imported here for Alembic auto-detection and relationship resolution.
"""
from app.models.user import User, ApplicantProfile
from app.models.scheme import Scheme, SchemeEligibilityRule, SchemeDocument
from app.models.application import Application, ApplicationStatusEvent
from app.models.document import Document, DocumentVerification, DigiLockerConnection
from app.models.consent import ConsentRecord
from app.models.audit import AuditEvent, AIProcessingLog
from app.models.notification import Notification
from app.models.risk import RiskAssessment

__all__ = [
    "User",
    "ApplicantProfile",
    "Scheme",
    "SchemeEligibilityRule",
    "SchemeDocument",
    "Application",
    "ApplicationStatusEvent",
    "Document",
    "DocumentVerification",
    "DigiLockerConnection",
    "ConsentRecord",
    "AuditEvent",
    "AIProcessingLog",
    "Notification",
    "RiskAssessment",
]
