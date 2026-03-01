"""
Notification model for user notifications.
"""

import enum
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, ForeignKey, Index, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class NotificationType(str, enum.Enum):
    """通知类型"""

    LEASE_EXPIRING = "lease_expiring"  # 租约即将到期
    LEASE_EXPIRED = "lease_expired"  # 租约已到期
    BILL_OVERDUE = "bill_overdue"  # 账单逾期
    BILL_DUE_SOON = "bill_due_soon"  # 账单即将到期
    PAYMENT_RECEIVED = "payment_received"  # 收到付款
    MEMBER_JOINED = "member_joined"  # 新成员加入
    SYSTEM = "system"  # 系统通知


class Notification(Base, TimestampMixin, ULIDMixin):
    """
    用户通知模型。

    用于存储租约到期、账单逾期等提醒通知。
    """

    __tablename__ = "notifications"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 关联业务数据的元数据，如租约ID、账单ID等
    extra_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    organization: Mapped["Organization"] = relationship("Organization")

    __table_args__ = (Index("ix_notifications_user_unread", "user_id", "is_read"),)
