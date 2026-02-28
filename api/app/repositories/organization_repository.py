"""
Organization repository for data access operations.
"""


from sqlalchemy.orm import Session

from app.models.organization import MemberRole, Organization, OrganizationMember
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    """Repository for Organization model."""

    def __init__(self, db: Session):
        super().__init__(db, Organization)

    def find_by_slug(self, slug: str) -> Organization | None:
        """Find organization by slug."""
        return self.db.query(Organization).filter(Organization.slug == slug).first()


class OrganizationMemberRepository(BaseRepository[OrganizationMember]):
    """Repository for OrganizationMember model."""

    def __init__(self, db: Session):
        super().__init__(db, OrganizationMember)

    def find_membership(self, org_id: str, user_id: str) -> OrganizationMember | None:
        """Find membership by organization and user."""
        return (
            self.db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
            .first()
        )

    def find_user_organizations(self, user_id: str) -> list[Organization]:
        """Find all organizations a user belongs to."""
        return (
            self.db.query(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .filter(OrganizationMember.user_id == user_id)
            .all()
        )

    def find_organization_members(self, org_id: str) -> list[OrganizationMember]:
        """Find all members of an organization."""
        return self.db.query(OrganizationMember).filter(OrganizationMember.organization_id == org_id).all()

    def is_member(self, org_id: str, user_id: str) -> bool:
        """Check if user is a member of organization."""
        return self.find_membership(org_id, user_id) is not None

    def has_role(self, org_id: str, user_id: str, roles: list[MemberRole]) -> bool:
        """Check if user has one of the specified roles."""
        membership = self.find_membership(org_id, user_id)
        return membership is not None and membership.role in roles
