"""
Subscription models for plan management.
"""

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price_monthly: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    price_yearly: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    max_apartments: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # -1 表示无限制
    max_rooms: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # 其他特性配置
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    subscriptions: Mapped[list["OrganizationSubscription"]] = relationship(
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
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    trial_ends_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="subscription")
    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", back_populates="subscriptions")


class SubscriptionOrderStatus(str, enum.Enum):
    """订阅支付订单状态"""

    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class SubscriptionOrderPaymentMethod(str, enum.Enum):
    """订阅订单支付方式"""

    WECHAT_NATIVE = "wechat_native"


class SubscriptionOrder(Base, TimestampMixin, ULIDMixin):
    """
    订阅支付订单。

    用于微信支付等渠道的订阅购买/续费/升级，支付成功后开通或更新组织订阅。
    """

    __tablename__ = "subscription_orders"

    order_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("subscription_plans.id"),
        nullable=False,
    )
    billing_cycle: Mapped[BillingCycle] = mapped_column(
        SQLEnum(BillingCycle, values_callable=lambda x: [e.value for e in x], native_enum=False),
        default=BillingCycle.MONTHLY,
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="CNY", nullable=False)
    status: Mapped[SubscriptionOrderStatus] = mapped_column(
        SQLEnum(SubscriptionOrderStatus, values_callable=lambda x: [e.value for e in x], native_enum=False),
        default=SubscriptionOrderStatus.PENDING,
        nullable=False,
        index=True,
    )
    payment_method: Mapped[SubscriptionOrderPaymentMethod] = mapped_column(
        SQLEnum(SubscriptionOrderPaymentMethod, values_callable=lambda x: [e.value for e in x], native_enum=False),
        default=SubscriptionOrderPaymentMethod.WECHAT_NATIVE,
        nullable=False,
    )
    code_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    wechat_transaction_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    organization_subscription_id: Mapped[str | None] = mapped_column(
        ForeignKey("organization_subscriptions.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")
    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan")
