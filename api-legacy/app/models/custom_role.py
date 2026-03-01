"""
Custom role model for organization-specific roles.
"""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class CustomRole(Base, TimestampMixin, ULIDMixin):
    """
    组织自定义角色模型。

    允许组织创建自定义角色并配置权限。
    """

    __tablename__ = "custom_roles"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, doc="系统预置角色不可删除")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # 权限配置，存储权限代码列表
    permissions: Mapped[list | None] = mapped_column(
        # JSON list of permission codes
        String(2000),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")

    __table_args__ = (Index("ix_custom_roles_org_name", "organization_id", "name", unique=True),)
