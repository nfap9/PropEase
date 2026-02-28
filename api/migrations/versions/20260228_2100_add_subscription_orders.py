"""add_subscription_orders

Revision ID: add_subscription_orders
Revises: add_org_is_active
Create Date: 2026-02-28 21:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_subscription_orders"
down_revision: Union[str, None] = "add_org_is_active"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subscription_orders",
        sa.Column("id", sa.String(26), primary_key=True),
        sa.Column("order_no", sa.String(64), nullable=False),
        sa.Column("organization_id", sa.String(26), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.String(26), sa.ForeignKey("subscription_plans.id"), nullable=False),
        sa.Column("billing_cycle", sa.String(20), default="monthly", nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), default="CNY", nullable=False),
        sa.Column("status", sa.String(32), default="pending", nullable=False),
        sa.Column("payment_method", sa.String(32), default="wechat_native", nullable=False),
        sa.Column("code_url", sa.String(512), nullable=True),
        sa.Column("wechat_transaction_id", sa.String(64), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("organization_subscription_id", sa.String(26), sa.ForeignKey("organization_subscriptions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_subscription_orders_order_no", "subscription_orders", ["order_no"], unique=True)
    op.create_index("ix_subscription_orders_organization_id", "subscription_orders", ["organization_id"])
    op.create_index("ix_subscription_orders_status", "subscription_orders", ["status"])


def downgrade() -> None:
    op.drop_index("ix_subscription_orders_status", table_name="subscription_orders", if_exists=True)
    op.drop_index("ix_subscription_orders_organization_id", table_name="subscription_orders", if_exists=True)
    op.drop_index("ix_subscription_orders_order_no", table_name="subscription_orders", if_exists=True)
    op.drop_table("subscription_orders")
