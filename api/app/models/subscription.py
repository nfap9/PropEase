"""
Subscription models for plan management.
"""
from sqlalchemy import String, ForeignKey, Numeric, Date, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional, List
from datetime import date
import enum

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class SubscriptionStatus(str, enum.Enum):
    """订阅状态"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    TRIAL = "trial"


class BillingCycle(str, enum.Enum):
    """计费周期"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionPlan(Base, TimestampMixin, ULIDMixin):
    """
    订阅套餐。

    定义可用的订阅套餐及其权益。
    """
    __tablename__ = "subscription_plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # free/pro/enterprise
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price_monthly: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    price_yearly: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    max_apartments: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # -1 表示无限制
    max_rooms: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # 其他特性配置
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    subscriptions: Mapped[List["OrganizationSubscription"]] = relationship(
        "OrganizationSubscription", back_populates="plan"
    )


class OrganizationSubscription(Base, TimestampMixin, ULIDMixin):
    """
    组织订阅。

    记录组织的订阅状态和历史。
    """
    __tablename__ = "organization_subscriptions"

    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # 每个组织只有一个活跃订阅
    )
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("subscription_plans.id"),
        nullable=False,
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        default=SubscriptionStatus.ACTIVE,
        nullable=False,
    )
    billing_cycle: Mapped[BillingCycle] = mapped_column(
        default=BillingCycle.MONTHLY,
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trial_ends_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="subscription")
    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", back_populates="subscriptions")
