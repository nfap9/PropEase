"""
Custom role service for organization role management.
"""
import json
from typing import List, Optional
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.custom_role_repository import CustomRoleRepository
from app.repositories.organization_repository import OrganizationMemberRepository
from app.models.custom_role import CustomRole
from app.models.organization import MemberRole
from app.schemas.custom_role import CustomRoleCreate, CustomRoleUpdate


class CustomRoleService(BaseService):
    """Service for custom role management."""

    # Default permissions for preset roles
    DEFAULT_ROLE_PERMISSIONS = {
        "管理员": [
            "apartment:view", "apartment:create", "apartment:edit",
            "room:view", "room:create", "room:edit",
            "tenant:view", "tenant:create", "tenant:edit",
            "lease:view", "lease:create", "lease:edit",
            "bill:view", "bill:create", "bill:edit",
            "utility:view", "utility:create", "utility:edit",
            "report:view", "report:export",
        ],
        "财务": [
            "apartment:view",
            "room:view",
            "tenant:view",
            "lease:view",
            "bill:view", "bill:create", "bill:edit",
            "utility:view",
            "report:view", "report:export",
        ],
        "运营": [
            "apartment:view", "apartment:create", "apartment:edit",
            "room:view", "room:create", "room:edit",
            "tenant:view", "tenant:create", "tenant:edit",
            "lease:view", "lease:create", "lease:edit",
            "bill:view",
            "utility:view", "utility:create", "utility:edit",
            "report:view", "report:export",
        ],
    }

    def __init__(self, db: Session):
        super().__init__(db)
        self.role_repo = CustomRoleRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    def list_roles(self, org_id: str, active_only: bool = True) -> List[CustomRole]:
        """List all custom roles in an organization."""
        return self.role_repo.find_by_organization(org_id, active_only)

    def get_role(self, role_id: str, org_id: str) -> Optional[CustomRole]:
        """Get a custom role by ID within an organization."""
        role = self.role_repo.get(role_id)
        if role and role.organization_id == org_id:
            return role
        return None

    def create_role(self, org_id: str, data: CustomRoleCreate) -> CustomRole:
        """
        Create a new custom role.

        Args:
            org_id: Organization ID
            data: Role creation data

        Returns:
            Created role

        Raises:
            ValueError: If role name already exists
        """
        # Check for duplicate name
        existing = self.role_repo.find_by_name(org_id, data.name)
        if existing:
            raise ValueError("角色名称已存在")

        # Convert permissions list to JSON string
        permissions_str = json.dumps(data.permissions) if data.permissions else None

        role = CustomRole(
            organization_id=org_id,
            name=data.name,
            description=data.description,
            is_system=False,
            is_active=True,
            permissions=permissions_str,
        )
        return self.role_repo.create(role)

    def update_role(
        self, role_id: str, org_id: str, data: CustomRoleUpdate
    ) -> Optional[CustomRole]:
        """
        Update a custom role.

        Args:
            role_id: Role ID
            org_id: Organization ID
            data: Update data

        Returns:
            Updated role or None if not found

        Raises:
            ValueError: If role is system preset or name conflict
        """
        role = self.get_role(role_id, org_id)
        if not role:
            return None

        if role.is_system:
            raise ValueError("系统预置角色不可修改")

        # Check for duplicate name if changing
        if data.name and data.name != role.name:
            existing = self.role_repo.find_by_name(org_id, data.name)
            if existing:
                raise ValueError("角色名称已存在")

        update_data = data.model_dump(exclude_unset=True)

        # Handle permissions conversion
        if "permissions" in update_data:
            update_data["permissions"] = json.dumps(update_data["permissions"])

        for field, value in update_data.items():
            if value is not None:
                setattr(role, field, value)

        self.db.commit()
        self.db.refresh(role)
        return role

    def delete_role(self, role_id: str, org_id: str) -> bool:
        """
        Delete a custom role.

        Args:
            role_id: Role ID
            org_id: Organization ID

        Returns:
            True if deleted

        Raises:
            ValueError: If role is system preset
        """
        role = self.get_role(role_id, org_id)
        if not role:
            return False

        if role.is_system:
            raise ValueError("系统预置角色不可删除")

        return self.role_repo.delete(role_id)

    def initialize_default_roles(self, org_id: str) -> List[CustomRole]:
        """
        Initialize default custom roles for a new organization.

        Args:
            org_id: Organization ID

        Returns:
            List of created roles
        """
        created_roles = []

        for name, permissions in self.DEFAULT_ROLE_PERMISSIONS.items():
            existing = self.role_repo.find_by_name(org_id, name)
            if existing:
                continue

            role = CustomRole(
                organization_id=org_id,
                name=name,
                description=f"系统预置{name}角色",
                is_system=True,
                is_active=True,
                permissions=json.dumps(permissions),
            )
            self.db.add(role)
            created_roles.append(role)

        if created_roles:
            self.db.commit()
            for role in created_roles:
                self.db.refresh(role)

        return created_roles

    def get_role_permissions(self, role_id: str, org_id: str) -> List[str]:
        """
        Get permissions for a role.

        Args:
            role_id: Role ID
            org_id: Organization ID

        Returns:
            List of permission codes
        """
        role = self.get_role(role_id, org_id)
        if not role or not role.permissions:
            return []

        try:
            return json.loads(role.permissions)
        except (json.JSONDecodeError, TypeError):
            return []

    def get_member_effective_permissions(
        self, org_id: str, user_id: str
    ) -> List[str]:
        """
        Get effective permissions for a member.

        Combines permissions from their role and custom role.

        Args:
            org_id: Organization ID
            user_id: User ID

        Returns:
            List of permission codes
        """
        membership = self.member_repo.find_membership(org_id, user_id)
        if not membership:
            return []

        # Owner and admin have all permissions
        if membership.role in [MemberRole.OWNER, MemberRole.ADMIN]:
            return ["*"]

        permissions = set()

        # Add permissions from custom role
        if membership.custom_role_id:
            custom_perms = self.get_role_permissions(
                membership.custom_role_id, org_id
            )
            permissions.update(custom_perms)

        return list(permissions)
