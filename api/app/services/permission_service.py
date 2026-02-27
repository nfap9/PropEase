"""
Permission service for role-based access control.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.permission_repository import (
    PermissionRepository,
    OrganizationRolePermissionRepository,
    SystemRoleConfigRepository,
    SystemRolePermissionRepository,
    UserSystemRoleRepository,
)
from app.repositories.organization_repository import OrganizationMemberRepository
from app.models.permission import (
    Permission,
    Resource,
    Action,
    SystemRole,
    OrganizationRolePermission,
    SystemRoleConfig,
    SystemRolePermission,
)
from app.models.organization import MemberRole
from app.utils.permission_defaults import (
    get_permission_name,
    DEFAULT_ORG_PERMISSIONS,
    DEFAULT_SYSTEM_ROLE_PERMISSIONS,
    SYSTEM_ROLE_CONFIGS,
)


class PermissionService(BaseService):
    """权限服务"""

    def __init__(self, db: Session):
        super().__init__(db)
        self.permission_repo = PermissionRepository(db)
        self.org_role_perm_repo = OrganizationRolePermissionRepository(db)
        self.system_role_config_repo = SystemRoleConfigRepository(db)
        self.system_role_perm_repo = SystemRolePermissionRepository(db)
        self.user_system_role_repo = UserSystemRoleRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    def initialize_permissions(self) -> None:
        """初始化权限数据（系统启动时调用）"""
        for resource in Resource:
            for action in Action:
                code = f"{resource.value}:{action.value}"
                if not self.permission_repo.find_by_code(code):
                    permission = Permission(
                        resource=resource,
                        action=action,
                        code=code,
                        name=get_permission_name(resource, action),
                    )
                    self.permission_repo.create(permission)

    def initialize_system_roles(self) -> None:
        """初始化系统角色配置"""
        for config in SYSTEM_ROLE_CONFIGS:
            if not self.system_role_config_repo.find_by_role(config["role"]):
                role_config = SystemRoleConfig(
                    role=config["role"],
                    name=config["name"],
                    description=config.get("description"),
                    is_active=True,
                )
                self.system_role_config_repo.create(role_config)

        # 初始化系统角色权限
        for role, perms in DEFAULT_SYSTEM_ROLE_PERMISSIONS.items():
            for resource, action in perms:
                permission = self.permission_repo.find_by_resource_action(
                    resource, action
                )
                if permission:
                    existing = (
                        self.db.query(SystemRolePermission)
                        .filter(
                            SystemRolePermission.role == role,
                            SystemRolePermission.permission_id == permission.id,
                        )
                        .first()
                    )
                    if not existing:
                        role_perm = SystemRolePermission(
                            role=role,
                            permission_id=permission.id,
                            is_enabled=True,
                        )
                        self.db.add(role_perm)
        self.db.commit()

    def initialize_org_permissions(self, org_id: int) -> None:
        """初始化组织默认权限配置"""
        for role, perms in DEFAULT_ORG_PERMISSIONS.items():
            for resource, action in perms:
                permission = self.permission_repo.find_by_resource_action(
                    resource, action
                )
                if permission:
                    # 检查是否已存在
                    existing = (
                        self.db.query(OrganizationRolePermission)
                        .filter(
                            OrganizationRolePermission.organization_id == org_id,
                            OrganizationRolePermission.role == role.value,
                            OrganizationRolePermission.permission_id == permission.id,
                        )
                        .first()
                    )
                    if not existing:
                        config = OrganizationRolePermission(
                            organization_id=org_id,
                            role=role.value,
                            permission_id=permission.id,
                            is_enabled=True,
                        )
                        self.db.add(config)
        self.db.commit()

    def check_permission(
        self, user_id: int, org_id: int, permission_code: str
    ) -> bool:
        """
        检查用户在组织中是否拥有指定权限

        优先级：
        1. 系统超级管理员拥有所有权限
        2. owner 角色拥有所有权限
        3. 检查角色权限配置
        """
        # 检查系统角色
        if self.user_system_role_repo.is_super_admin(user_id):
            return True

        # 获取用户在组织中的角色
        membership = self.member_repo.find_membership(org_id, user_id)
        if not membership:
            return False

        # owner 拥有所有权限
        if membership.role == MemberRole.OWNER:
            return True

        # 检查角色权限配置
        return self.org_role_perm_repo.has_permission(
            org_id, membership.role.value, permission_code
        )

    def check_system_permission(
        self, user_id: int, permission_code: str
    ) -> bool:
        """
        检查用户是否拥有系统级权限

        用于跨组织的权限检查
        """
        # 超级管理员拥有所有权限
        if self.user_system_role_repo.is_super_admin(user_id):
            return True

        # 获取用户的所有系统角色
        user_roles = self.user_system_role_repo.get_user_system_roles(user_id)

        # 检查任意一个系统角色是否有该权限
        for role in user_roles:
            if self.system_role_perm_repo.has_permission(role, permission_code):
                return True

        return False

    def get_role_permissions(
        self, org_id: int, role: MemberRole
    ) -> List[Permission]:
        """获取组织角色的所有启用的权限"""
        if role == MemberRole.OWNER:
            # owner 返回所有权限
            return self.permission_repo.get_all_permissions()

        return self.org_role_perm_repo.get_enabled_permissions(org_id, role.value)

    def update_role_permissions(
        self,
        org_id: int,
        role: MemberRole,
        permission_codes: List[str],
        user_id: int,
    ) -> bool:
        """
        更新组织角色权限

        owner 角色权限不可修改
        """
        # 只有 owner 可以修改权限
        if not self.member_repo.has_role(org_id, user_id, [MemberRole.OWNER]):
            return False

        # owner 权限不可修改
        if role == MemberRole.OWNER:
            return False

        # 获取权限ID
        permissions = self.permission_repo.get_permissions_by_codes(permission_codes)
        permission_ids = [p.id for p in permissions]

        self.org_role_perm_repo.set_role_permissions(org_id, role.value, permission_ids)
        return True

    def get_all_permissions(self) -> List[Permission]:
        """获取所有可用权限（用于UI展示）"""
        return self.permission_repo.get_all_permissions()

    def get_permissions_grouped(self) -> dict[str, List[Permission]]:
        """获取按资源分组的权限"""
        permissions = self.get_all_permissions()
        grouped: dict[str, List[Permission]] = {}
        for perm in permissions:
            if perm.resource.value not in grouped:
                grouped[perm.resource.value] = []
            grouped[perm.resource.value].append(perm)
        return grouped

    def get_user_permissions(self, user_id: int, org_id: int) -> List[str]:
        """获取用户在组织中的所有权限代码"""
        # 系统超级管理员返回所有权限
        if self.user_system_role_repo.is_super_admin(user_id):
            return [p.code for p in self.get_all_permissions()]

        membership = self.member_repo.find_membership(org_id, user_id)
        if not membership:
            return []

        # owner 返回所有权限
        if membership.role == MemberRole.OWNER:
            return [p.code for p in self.get_all_permissions()]

        # 返回角色启用的权限
        permissions = self.get_role_permissions(org_id, membership.role)
        return [p.code for p in permissions]

    def get_user_system_roles(self, user_id: int) -> List[SystemRole]:
        """获取用户的所有系统角色"""
        return self.user_system_role_repo.get_user_system_roles(user_id)

    def is_super_admin(self, user_id: int) -> bool:
        """检查用户是否是超级管理员"""
        return self.user_system_role_repo.is_super_admin(user_id)

    def get_system_role_configs(self) -> List[SystemRoleConfig]:
        """获取所有系统角色配置"""
        return self.system_role_config_repo.get_all_active()

    def grant_system_role(
        self, user_id: int, role: SystemRole, granted_by: int
    ) -> bool:
        """授予用户系统角色"""
        # 只有超级管理员可以授予系统角色
        if not self.is_super_admin(granted_by):
            return False

        self.user_system_role_repo.grant_role(user_id, role, granted_by)
        return True

    def revoke_system_role(
        self, user_id: int, role: SystemRole, revoked_by: int
    ) -> bool:
        """撤销用户的系统角色"""
        # 只有超级管理员可以撤销系统角色
        if not self.is_super_admin(revoked_by):
            return False

        return self.user_system_role_repo.revoke_role(user_id, role)
