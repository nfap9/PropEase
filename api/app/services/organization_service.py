"""
Organization service for organization management.
"""

import re
import ulid
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
        self, user_id: str, data: OrganizationCreate, is_personal: bool = False
    ) -> Organization:
        """
        Create a new organization and add user as owner.

        Args:
            user_id: Creator user ID
            data: Organization creation data
            is_personal: Whether this is a personal team (default False)

        Returns:
            Created organization
        """
        # Generate slug if not provided
        if data.slug:
            slug = data.slug
        else:
            slug = data.name.lower()
            slug = re.sub(r'\s+', '-', slug)
            slug = re.sub(r'[^a-z0-9-]', '', slug)

        # Ensure slug uniqueness
        base_slug = slug
        counter = 1
        while self.org_repo.find_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create organization
        org = Organization(
            name=data.name,
            slug=slug,
            settings={},
            is_personal=is_personal,
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

    def create_personal_team(self, user_id: str, user_name: str) -> Organization:
        """
        Create a personal team for a newly registered user.

        Personal teams:
        - Have is_personal=True
        - Cannot invite other members
        - Can be migrated to a formal team later

        Args:
            user_id: User ID
            user_name: User's full name (used for team name)

        Returns:
            Created personal team
        """
        # Generate unique slug for personal team
        slug = f"personal-{ulid.new().lower()}"

        org = Organization(
            name=f"{user_name}的个人团队",
            slug=slug,
            settings={},
            is_personal=True,
        )
        org = self.org_repo.create(org)

        # Add user as owner
        membership = OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=MemberRole.OWNER,
        )
        self.db.add(membership)
        self.db.commit()

        # Initialize permissions
        permission_service = PermissionService(self.db)
        permission_service.initialize_org_permissions(org.id)

        return org

    def get_personal_team(self, user_id: str) -> Organization | None:
        """Get user's personal team if exists."""
        orgs = self.member_repo.find_user_organizations(user_id)
        for org in orgs:
            if org.is_personal:
                return org
        return None

    def migrate_personal_team(
        self, personal_org_id: str, target_org_id: str, user_id: str
    ) -> dict:
        """
        Migrate data from personal team to a formal team.

        This transfers all apartments, tenants, leases, and other data
        from the personal team to the target organization.

        Args:
            personal_org_id: Personal team ID
            target_org_id: Target organization ID
            user_id: User performing the migration

        Returns:
            Dict with migration statistics

        Raises:
            ValueError: If validation fails
        """
        # Verify user is owner of both organizations
        personal_membership = self.member_repo.find_membership(personal_org_id, user_id)
        target_membership = self.member_repo.find_membership(target_org_id, user_id)

        if not personal_membership or personal_membership.role != MemberRole.OWNER:
            raise ValueError("您不是个人团队的所有者")
        if not target_membership or target_membership.role != MemberRole.OWNER:
            raise ValueError("您不是目标团队的所有者")

        # Verify personal_org is actually a personal team
        personal_org = self.org_repo.get(personal_org_id)
        if not personal_org or not personal_org.is_personal:
            raise ValueError("源团队不是个人团队")

        # Verify target is not a personal team
        target_org = self.org_repo.get(target_org_id)
        if not target_org or target_org.is_personal:
            raise ValueError("目标团队不能是个人团队")

        stats = {
            "apartments": 0,
            "rooms": 0,
            "tenants": 0,
            "leases": 0,
            "bills": 0,
            "utility_readings": 0,
        }

        # Migrate apartments (rooms will cascade)
        from app.models.apartment import Apartment
        apartments = self.db.query(Apartment).filter(
            Apartment.organization_id == personal_org_id
        ).all()
        for apt in apartments:
            apt.organization_id = target_org_id
            stats["apartments"] += 1
            stats["rooms"] += len(apt.rooms) if hasattr(apt, 'rooms') else 0

        # Migrate tenants
        from app.models.tenant import Tenant
        tenants = self.db.query(Tenant).filter(
            Tenant.organization_id == personal_org_id
        ).all()
        for tenant in tenants:
            tenant.organization_id = target_org_id
            stats["tenants"] += 1

        # Migrate bills (through leases)
        from app.models.lease import Lease
        from app.models.bill import Bill
        leases = self.db.query(Lease).join(
            Apartment, Lease.room_id == Apartment.rooms  # type: ignore
        ).filter(
            Apartment.organization_id == personal_org_id
        ).all()
        stats["leases"] = len(leases)

        # Migrate utility readings
        from app.models.utility import UtilityReading
        readings = self.db.query(UtilityReading).join(
            Apartment, UtilityReading.room_id == Apartment.rooms  # type: ignore
        ).filter(
            Apartment.organization_id == personal_org_id
        ).all()
        stats["utility_readings"] = len(readings)

        # Delete personal team membership
        self.db.delete(personal_membership)

        # Delete personal team
        self.db.delete(personal_org)

        self.db.commit()

        return stats

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
        """
        Delete an organization if user is owner.

        Note: This performs a hard delete. Use get_deletion_preview first
        to show the user what will be deleted.
        """
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            return False

        return self.org_repo.delete(org_id)

    def get_deletion_preview(self, org_id: str, user_id: str) -> dict:
        """
        Get a preview of what will be deleted when deleting an organization.

        Returns statistics about data that will be deleted and any blocking issues.

        Args:
            org_id: Organization ID
            user_id: User requesting deletion

        Returns:
            Dict with can_delete, blockers, and stats fields

        Raises:
            ValueError: If user is not owner
        """
        # Check ownership
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            raise ValueError("只有团队所有者可以删除团队")

        org = self.org_repo.get(org_id)
        if not org:
            raise ValueError("团队不存在")

        blockers = []
        stats = {
            "apartments": 0,
            "rooms": 0,
            "tenants": 0,
            "active_leases": 0,
            "pending_bills": 0,
            "members": 0,
        }

        # Check for active subscription
        if org.subscription and org.subscription.status == "active":
            blockers.append("团队有活跃的订阅，请先取消订阅")

        # Count apartments and rooms
        from app.models.apartment import Apartment
        apartments = self.db.query(Apartment).filter(
            Apartment.organization_id == org_id
        ).all()
        stats["apartments"] = len(apartments)
        for apt in apartments:
            stats["rooms"] += len(apt.rooms) if hasattr(apt, 'rooms') else 0

        # Count tenants
        from app.models.tenant import Tenant
        stats["tenants"] = self.db.query(Tenant).filter(
            Tenant.organization_id == org_id
        ).count()

        # Count active leases
        from app.models.lease import Lease
        stats["active_leases"] = self.db.query(Lease).join(
            Apartment, Lease.room_id == Apartment.id
        ).filter(
            Apartment.organization_id == org_id,
            Lease.is_active == True,
        ).count()

        # Count pending bills
        from app.models.bill import Bill, BillStatus
        stats["pending_bills"] = self.db.query(Bill).join(
            Lease, Bill.lease_id == Lease.id
        ).join(
            Apartment, Lease.room_id == Apartment.id
        ).filter(
            Apartment.organization_id == org_id,
            Bill.status == BillStatus.PENDING,
        ).count()

        # Count members
        stats["members"] = len(self.member_repo.find_organization_members(org_id))

        return {
            "can_delete": len(blockers) == 0,
            "blockers": blockers,
            "stats": stats,
            "org_name": org.name,
            "is_personal": org.is_personal,
        }

    def confirm_and_delete(
        self, org_id: str, user_id: str, confirmed_name: str
    ) -> bool:
        """
        Delete organization after confirming the name matches.

        This provides a safety check to prevent accidental deletion.

        Args:
            org_id: Organization ID
            user_id: User requesting deletion
            confirmed_name: The name the user typed to confirm deletion

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If name doesn't match or other validation fails
        """
        preview = self.get_deletion_preview(org_id, user_id)

        if not preview["can_delete"]:
            raise ValueError(preview["blockers"][0])

        if confirmed_name != preview["org_name"]:
            raise ValueError("团队名称不匹配")

        return self.delete_organization(org_id, user_id)

    def list_members(self, org_id: str, user_id: str) -> list[OrganizationMember]:
        """List all members of an organization."""
        if not self.member_repo.is_member(org_id, user_id):
            return []
        return self.member_repo.find_organization_members(org_id)

    def add_member(
        self, org_id: str, user_id: str, phone: str, role: MemberRole
    ) -> OrganizationMember:
        """
        Add a new member to organization.

        Raises:
            ValueError: If organization is a personal team or other validation fails
        """
        # Check if organization is a personal team
        org = self.org_repo.get(org_id)
        if org and org.is_personal:
            raise ValueError("个人团队无法邀请成员，请先升级为正式团队")

        # Check permission
        if not self.member_repo.has_role(
            org_id, user_id, [MemberRole.OWNER, MemberRole.ADMIN]
        ):
            raise ValueError("您没有权限邀请成员")

        # Find user by phone
        new_user = self.user_repo.find_by_phone(phone)
        if not new_user:
            raise ValueError("用户不存在")

        # Check if already a member
        if self.member_repo.is_member(org_id, new_user.id):
            raise ValueError("用户已经是团队成员")

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
