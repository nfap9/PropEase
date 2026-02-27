"""
Permission repository for data access operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.permission import (
    Permission,
    Resource,
    Action,
    SystemRole,
    OrganizationRolePermission,
    SystemRoleConfig,
    SystemRolePermission,
    UserSystemRole,
)


class PermissionRepository(BaseRepository[Permission]):
    """Repository for Permission model."""

    def __init__(self, db: Session):
        super().__init__(db, Permission)

    def find_by_code(self, code: str) -> Optional[Permission]:
        """根据权限代码查找"""
        return self.db.query(Permission).filter(Permission.code == code).first()

    def find_by_resource_action(
        self, resource: Resource, action: Action
    ) -> Optional[Permission]:
        """根据资源和操作查找"""
        return (
            self.db.query(Permission)
            .filter(Permission.resource == resource, Permission.action == action)
            .first()
        )

    def get_all_permissions(self) -> List[Permission]:
        """获取所有权限"""
        return self.db.query(Permission).order_by(Permission.resource, Permission.action).all()

    def get_permissions_by_resource(self, resource: Resource) -> List[Permission]:
        """获取指定资源的所有权限"""
        return (
            self.db.query(Permission)
            .filter(Permission.resource == resource)
            .order_by(Permission.action)
            .all()
        )

    def get_permissions_by_codes(self, codes: List[str]) -> List[Permission]:
        """根据权限代码列表获取权限"""
        return self.db.query(Permission).filter(Permission.code.in_(codes)).all()


class OrganizationRolePermissionRepository(BaseRepository[OrganizationRolePermission]):
    """Repository for OrganizationRolePermission model."""

    def __init__(self, db: Session):
        super().__init__(db, OrganizationRolePermission)

    def get_role_permissions(
        self, org_id: int, role: str
    ) -> List[OrganizationRolePermission]:
        """获取组织角色的所有权限配置"""
        return (
            self.db.query(OrganizationRolePermission)
            .filter(
                OrganizationRolePermission.organization_id == org_id,
                OrganizationRolePermission.role == role,
            )
            .all()
        )

    def get_enabled_permission_ids(self, org_id: int, role: str) -> List[int]:
        """获取组织角色启用的权限ID列表"""
        return [
            r.permission_id
            for r in self.db.query(OrganizationRolePermission)
            .filter(
                OrganizationRolePermission.organization_id == org_id,
                OrganizationRolePermission.role == role,
                OrganizationRolePermission.is_enabled == True,
            )
            .all()
        ]

    def has_permission(
        self, org_id: int, role: str, permission_code: str
    ) -> bool:
        """检查角色是否拥有指定权限"""
        return (
            self.db.query(OrganizationRolePermission)
            .join(Permission)
            .filter(
                OrganizationRolePermission.organization_id == org_id,
                OrganizationRolePermission.role == role,
                OrganizationRolePermission.is_enabled == True,
                Permission.code == permission_code,
            )
            .first()
            is not None
        )

    def set_role_permissions(
        self, org_id: int, role: str, permission_ids: List[int]
    ) -> None:
        """设置角色权限（完全替换）"""
        # 删除现有关联
        self.db.query(OrganizationRolePermission).filter(
            OrganizationRolePermission.organization_id == org_id,
            OrganizationRolePermission.role == role,
        ).delete()

        # 创建新关联
        for perm_id in permission_ids:
            config = OrganizationRolePermission(
                organization_id=org_id,
                role=role,
                permission_id=perm_id,
                is_enabled=True,
            )
            self.db.add(config)

        self.db.commit()

    def get_enabled_permissions(self, org_id: int, role: str) -> List[Permission]:
        """获取组织角色启用的权限列表"""
        return (
            self.db.query(Permission)
            .join(OrganizationRolePermission)
            .filter(
                OrganizationRolePermission.organization_id == org_id,
                OrganizationRolePermission.role == role,
                OrganizationRolePermission.is_enabled == True,
            )
            .all()
        )


class SystemRoleConfigRepository(BaseRepository[SystemRoleConfig]):
    """Repository for SystemRoleConfig model."""

    def __init__(self, db: Session):
        super().__init__(db, SystemRoleConfig)

    def find_by_role(self, role: SystemRole) -> Optional[SystemRoleConfig]:
        """根据角色查找配置"""
        return (
            self.db.query(SystemRoleConfig)
            .filter(SystemRoleConfig.role == role)
            .first()
        )

    def get_all_active(self) -> List[SystemRoleConfig]:
        """获取所有活跃的系统角色配置"""
        return (
            self.db.query(SystemRoleConfig)
            .filter(SystemRoleConfig.is_active == True)
            .all()
        )


class SystemRolePermissionRepository(BaseRepository[SystemRolePermission]):
    """Repository for SystemRolePermission model."""

    def __init__(self, db: Session):
        super().__init__(db, SystemRolePermission)

    def get_role_permissions(self, role: SystemRole) -> List[SystemRolePermission]:
        """获取系统角色的所有权限配置"""
        return (
            self.db.query(SystemRolePermission)
            .filter(SystemRolePermission.role == role)
            .all()
        )

    def get_enabled_permission_ids(self, role: SystemRole) -> List[int]:
        """获取系统角色启用的权限ID列表"""
        return [
            r.permission_id
            for r in self.db.query(SystemRolePermission)
            .filter(
                SystemRolePermission.role == role,
                SystemRolePermission.is_enabled == True,
            )
            .all()
        ]

    def has_permission(self, role: SystemRole, permission_code: str) -> bool:
        """检查系统角色是否拥有指定权限"""
        return (
            self.db.query(SystemRolePermission)
            .join(Permission)
            .filter(
                SystemRolePermission.role == role,
                SystemRolePermission.is_enabled == True,
                Permission.code == permission_code,
            )
            .first()
            is not None
        )

    def get_enabled_permissions(self, role: SystemRole) -> List[Permission]:
        """获取系统角色启用的权限列表"""
        return (
            self.db.query(Permission)
            .join(SystemRolePermission)
            .filter(
                SystemRolePermission.role == role,
                SystemRolePermission.is_enabled == True,
            )
            .all()
        )


class UserSystemRoleRepository(BaseRepository[UserSystemRole]):
    """Repository for UserSystemRole model."""

    def __init__(self, db: Session):
        super().__init__(db, UserSystemRole)

    def get_user_system_roles(self, user_id: int) -> List[SystemRole]:
        """获取用户的所有系统角色"""
        return [
            r.role
            for r in self.db.query(UserSystemRole)
            .filter(UserSystemRole.user_id == user_id)
            .all()
        ]

    def has_system_role(self, user_id: int, role: SystemRole) -> bool:
        """检查用户是否拥有指定系统角色"""
        return (
            self.db.query(UserSystemRole)
            .filter(
                UserSystemRole.user_id == user_id,
                UserSystemRole.role == role,
            )
            .first()
            is not None
        )

    def is_super_admin(self, user_id: int) -> bool:
        """检查用户是否是超级管理员"""
        return self.has_system_role(user_id, SystemRole.SUPER_ADMIN)

    def grant_role(
        self, user_id: int, role: SystemRole, granted_by: Optional[int] = None
    ) -> UserSystemRole:
        """授予用户系统角色"""
        from datetime import datetime, timezone

        user_role = UserSystemRole(
            user_id=user_id,
            role=role,
            granted_by=granted_by,
            granted_at=datetime.now(timezone.utc),
        )
        return self.create(user_role)

    def revoke_role(self, user_id: int, role: SystemRole) -> bool:
        """撤销用户的系统角色"""
        user_role = (
            self.db.query(UserSystemRole)
            .filter(
                UserSystemRole.user_id == user_id,
                UserSystemRole.role == role,
            )
            .first()
        )
        if user_role:
            self.db.delete(user_role)
            self.db.commit()
            return True
        return False
