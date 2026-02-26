"""
Organization repository for data access operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.organization import Organization, OrganizationMember, MemberRole


class OrganizationRepository(BaseRepository[Organization]):
    """Repository for Organization model."""

    def __init__(self, db: Session):
        super().__init__(db, Organization)

    def find_by_slug(self, slug: str) -> Optional[Organization]:
        """Find organization by slug."""
        return self.db.query(Organization).filter(Organization.slug == slug).first()


class OrganizationMemberRepository(BaseRepository[OrganizationMember]):
    """Repository for OrganizationMember model."""

    def __init__(self, db: Session):
        super().__init__(db, OrganizationMember)

    def find_membership(
        self, org_id: int, user_id: int
    ) -> Optional[OrganizationMember]:
        """Find membership by organization and user."""
        return (
            self.db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )

    def find_user_organizations(self, user_id: int) -> List[Organization]:
        """Find all organizations a user belongs to."""
        return (
            self.db.query(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .filter(OrganizationMember.user_id == user_id)
            .all()
        )

    def find_organization_members(
        self, org_id: int
    ) -> List[OrganizationMember]:
        """Find all members of an organization."""
        return (
            self.db.query(OrganizationMember)
            .filter(OrganizationMember.organization_id == org_id)
            .all()
        )

    def is_member(self, org_id: int, user_id: int) -> bool:
        """Check if user is a member of organization."""
        return self.find_membership(org_id, user_id) is not None

    def has_role(self, org_id: int, user_id: int, roles: List[MemberRole]) -> bool:
        """Check if user has one of the specified roles."""
        membership = self.find_membership(org_id, user_id)
        return membership is not None and membership.role in roles
