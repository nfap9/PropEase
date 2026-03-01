"""
Common dependencies for controllers.
"""

from collections.abc import Generator

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.configs.database import SessionLocal
from app.models.organization import MemberRole, OrganizationMember
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(lambda: None),  # Will be replaced with actual auth
) -> User:
    """Get current authenticated user."""
    # This is a placeholder - actual implementation will use JWT
    from app.dependencies import get_current_user as _get_current_user

    return _get_current_user(token=token, db=db)


def get_org_membership(
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrganizationMember:
    """Get organization membership and verify user has access."""
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization",
        )
    return membership


def require_role(allowed_roles: list[MemberRole]):
    """Dependency factory to require specific roles."""

    def role_checker(
        membership: OrganizationMember = Depends(get_org_membership),
    ) -> OrganizationMember:
        if membership.role not in allowed_roles:
            from fastapi import HTTPException, status

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return membership

    return role_checker
