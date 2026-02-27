"""
User repository for data access operations.
"""
from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.user import User


class UserRepository(BaseRepository[User]):
    """Repository for User model."""

    def __init__(self, db: Session):
        super().__init__(db, User)

    def find_by_phone(self, phone: str) -> Optional[User]:
        """Find user by phone number."""
        return self.db.query(User).filter(User.phone == phone).first()

    def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email address."""
        return self.db.query(User).filter(User.email == email).first()

    def find_by_organization(self, org_id: int) -> list[User]:
        """Find all users in an organization."""
        from app.models.organization import OrganizationMember

        return (
            self.db.query(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .filter(OrganizationMember.organization_id == org_id)
            .all()
        )

    def exists_by_phone(self, phone: str) -> bool:
        """Check if user exists by phone."""
        return self.find_by_phone(phone) is not None

    def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        return self.find_by_email(email) is not None
