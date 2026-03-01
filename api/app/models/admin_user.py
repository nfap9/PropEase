"""
运营后台账号模型。

与业务侧 User 完全隔离，仅用于运营后台登录与权限。
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.admin_role import AdminRole


class AdminUser(Base, TimestampMixin, ULIDMixin):
    """
    运营账号。

    使用 username + password 登录，与业务用户（手机号）分离。
    """

    __tablename__ = "admin_users"

    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    role_id: Mapped[str] = mapped_column(
        ForeignKey("admin_roles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    failed_login_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    role: Mapped["AdminRole"] = relationship("AdminRole", back_populates="users")

    def __repr__(self) -> str:
        return f"<AdminUser id={self.id!r} username={self.username!r}>"
