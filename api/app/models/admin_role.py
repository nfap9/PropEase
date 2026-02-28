"""
运营后台角色模型。

与业务侧 Organization/CustomRole 隔离，用于运营人员权限控制。
"""

from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.admin_user import AdminUser


class AdminRole(Base, TimestampMixin, ULIDMixin):
    """
    运营角色。

    权限列表存储在 permissions JSON 中，如 ["admin:user:read", "admin:org:write"]。
    系统预置角色 is_system=True 不可删除。
    """

    __tablename__ = "admin_roles"

    name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    permissions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    users: Mapped[list["AdminUser"]] = relationship("AdminUser", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<AdminRole id={self.id!r} name={self.name!r}>"
