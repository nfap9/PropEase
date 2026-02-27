"""
Permission models for role-based access control.
"""
from sqlalchemy import String, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List, Optional
from datetime import datetime
import enum

from app.configs.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization, MemberRole
    from app.models.user import User


class Resource(str, enum.Enum):
    """资源类型"""
    APARTMENT = "apartment"
    ROOM = "room"
    TENANT = "tenant"
    LEASE = "lease"
    BILL = "bill"
    UTILITY = "utility"
    MEMBER = "member"
    SETTINGS = "settings"
    REPORT = "report"


class Action(str, enum.Enum):
    """操作类型"""
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"
    EXPORT = "export"
    MANAGE = "manage"  # 管理权限（包含所有操作）


class SystemRole(str, enum.Enum):
    """系统角色枚举"""
    SUPER_ADMIN = "super_admin"     # 超级管理员
    SUPPORT = "support"             # 客服
    OPERATIONS = "operations"       # 运营
    FINANCE = "finance"             # 财务
    READONLY = "readonly"           # 只读


class Permission(Base, TimestampMixin):
    """权限定义表 - 定义所有可用的权限"""
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resource: Mapped[Resource] = mapped_column(SQLEnum(Resource), nullable=False)
    action: Mapped[Action] = mapped_column(SQLEnum(Action), nullable=False)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    organization_role_permissions: Mapped[List["OrganizationRolePermission"]] = relationship(
        "OrganizationRolePermission", back_populates="permission", cascade="all, delete-orphan"
    )
    system_role_permissions: Mapped[List["SystemRolePermission"]] = relationship(
        "SystemRolePermission", back_populates="permission", cascade="all, delete-orphan"
    )


class OrganizationRolePermission(Base, TimestampMixin):
    """组织角色权限配置 - 每个组织可以自定义角色权限"""
    __tablename__ = "organization_role_permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # MemberRole value
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id"), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")
    permission: Mapped["Permission"] = relationship("Permission", back_populates="organization_role_permissions")


class SystemRoleConfig(Base, TimestampMixin):
    """系统角色配置 - 系统级角色定义"""
    __tablename__ = "system_role_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role: Mapped[SystemRole] = mapped_column(SQLEnum(SystemRole), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SystemRolePermission(Base, TimestampMixin):
    """系统角色权限 - 系统角色拥有的权限"""
    __tablename__ = "system_role_permissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    role: Mapped[SystemRole] = mapped_column(SQLEnum(SystemRole), nullable=False)
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id"), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    permission: Mapped["Permission"] = relationship("Permission", back_populates="system_role_permissions")


class UserSystemRole(Base, TimestampMixin):
    """用户系统角色关联 - 用户可以拥有多个系统角色"""
    __tablename__ = "user_system_roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[SystemRole] = mapped_column(SQLEnum(SystemRole), nullable=False)
    granted_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    granter: Mapped[Optional["User"]] = relationship("User", foreign_keys=[granted_by])
