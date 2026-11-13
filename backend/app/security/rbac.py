"""
Role-Based Access Control (RBAC) utilities.
"""
import enum
from functools import wraps
from typing import List

from fastapi import Depends, HTTPException, status

from app.models.user import User, UserRole
from app.security.auth import get_current_active_user


class Role(str, enum.Enum):
    """Application roles mirror UserRole for RBAC checks."""
    APPLICANT = "applicant"
    ADMIN = "admin"


def require_role(*roles: Role):
    """
    FastAPI dependency factory: restrict endpoint to users with specified role(s).

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(Role.ADMIN))])
        def admin_endpoint(): ...

    Args:
        *roles: One or more Role values that are permitted.

    Returns:
        A FastAPI dependency function.
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = Role(current_user.role.value)
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(r.value for r in roles)}",
            )
        return current_user

    return role_checker
