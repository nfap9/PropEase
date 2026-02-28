"""
Organization service for organization management.
"""

from sqlalchemy.orm import Session

from app.models.organization import MemberRole, Organization, OrganizationMember
from app.repositories.organization_repository import (
    OrganizationMemberRepository,
    OrganizationRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.services.base import BaseService
from app.services.permission_service import PermissionService


class OrganizationService(BaseService):
    """Service for organization management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.org_repo = OrganizationRepository(db)
        self.member_repo = OrganizationMemberRepository(db)
        self.user_repo = UserRepository(db)

    def list_organizations(self, user_id: str) -> list[Organization]:
        """List all organizations a user belongs to."""
        return self.member_repo.find_user_organizations(user_id)

    def get_organization(self, org_id: str, user_id: str) -> Organization | None:
        """Get an organization if user has access."""
        if not self.member_repo.is_member(org_id, user_id):
            return None
        return self.org_repo.get(org_id)

    def create_organization(
        self, user_id: str, data: OrganizationCreate
    ) -> Organization:
        """Create a new organization and add user as owner."""
        import re

        # Generate slug if not provided
        if data.slug:
            slug = data.slug
        else:
            slug = data.name.lower()
            slug = re.sub(r'\s+', '-', slug)
            slug = re.sub(r'[^a-z0-9-]', '', slug)

        # Create organization
        org = Organization(
            name=data.name,
            slug=slug,
            settings={},
        )
        org = self.org_repo.create(org)

        # Add creator as owner
        membership = OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=MemberRole.OWNER,
        )
        self.db.add(membership)
        self.db.commit()

        # Initialize default role permissions for the organization
        permission_service = PermissionService(self.db)
        permission_service.initialize_org_permissions(org.id)

        return org

    def update_organization(
        self, org_id: str, user_id: str, data: OrganizationUpdate
    ) -> Organization | None:
        """Update an organization if user has permission."""
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER, MemberRole.ADMIN]):
            return None

        org = self.org_repo.get(org_id)
        if not org:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(org, field, value)

        self.db.commit()
        self.db.refresh(org)
        return org

    def delete_organization(self, org_id: str, user_id: str) -> bool:
        """Delete an organization if user is owner."""
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            return False

        return self.org_repo.delete(org_id)

    def list_members(self, org_id: str, user_id: str) -> list[OrganizationMember]:
        """List all members of an organization."""
        if not self.member_repo.is_member(org_id, user_id):
            return []
        return self.member_repo.find_organization_members(org_id)

    def add_member(
        self, org_id: str, user_id: str, phone: str, role: MemberRole
    ) -> OrganizationMember | None:
        """Add a new member to organization."""
        # Check permission
        if not self.member_repo.has_role(
            org_id, user_id, [MemberRole.OWNER, MemberRole.ADMIN]
        ):
            return None

        # Find user by phone
        new_user = self.user_repo.find_by_phone(phone)
        if not new_user:
            return None

        # Check if already a member
        if self.member_repo.is_member(org_id, new_user.id):
            return None

        # Add member
        membership = OrganizationMember(
            organization_id=org_id,
            user_id=new_user.id,
            role=role,
        )
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        return membership

    def update_member_role(
        self, org_id: str, user_id: str, member_user_id: str, role: MemberRole
    ) -> OrganizationMember | None:
        """Update a member's role."""
        # Only owner can change roles
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            return None

        membership = self.member_repo.find_membership(org_id, member_user_id)
        if not membership:
            return None

        membership.role = role
        self.db.commit()
        self.db.refresh(membership)
        return membership

    def remove_member(
        self, org_id: str, user_id: str, member_user_id: str
    ) -> bool:
        """Remove a member from organization."""
        # Only owner can remove members
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            return False

        membership = self.member_repo.find_membership(org_id, member_user_id)
        if not membership:
            return False

        self.db.delete(membership)
        self.db.commit()
        return True
