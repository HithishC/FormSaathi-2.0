"""
API routers package.
"""
from app.routers.auth import router as auth_router
from app.routers.schemes import router as schemes_router
from app.routers.eligibility import router as eligibility_router
from app.routers.documents import router as documents_router
from app.routers.digilocker import router as digilocker_router
from app.routers.applications import router as applications_router
from app.routers.privacy import router as privacy_router
from app.routers.risk import router as risk_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "schemes_router",
    "eligibility_router",
    "documents_router",
    "digilocker_router",
    "applications_router",
    "privacy_router",
    "risk_router",
    "notifications_router",
    "admin_router",
]
