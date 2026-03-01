"""
添加订阅套餐表

Revision ID: add_subscription
Revises: add_utility_config
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'add_subscription'
down_revision: Union[str, None] = 'add_utility_config'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """创建订阅套餐表。"""
    # 创建 subscription_plans 表
    op.create_table(
        'subscription_plans',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), unique=True, nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('price_monthly', sa.Numeric(10, 2), default=0, nullable=False),
        sa.Column('price_yearly', sa.Numeric(10, 2), default=0, nullable=False),
        sa.Column('max_apartments', sa.Integer, default=1, nullable=False),
        sa.Column('max_rooms', sa.Integer, default=100, nullable=False),
        sa.Column('max_members', sa.Integer, default=1, nullable=False),
        sa.Column('features', sa.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False),
        sa.Column('sort_order', sa.Integer, default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 创建索引
    op.create_index('ix_subscription_plans_code', 'subscription_plans', ['code'], unique=True)
    op.create_index('ix_subscription_plans_is_active', 'subscription_plans', ['is_active'])

    # 创建 organization_subscriptions 表
    op.create_table(
        'organization_subscriptions',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('organization_id', sa.String(26), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('plan_id', sa.String(26), sa.ForeignKey('subscription_plans.id'), nullable=False),
        sa.Column('status', sa.String(20), default='active', nullable=False),
        sa.Column('billing_cycle', sa.String(20), default='monthly', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('auto_renew', sa.Boolean, default=True, nullable=False),
        sa.Column('trial_ends_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 创建索引
    op.create_index('ix_organization_subscriptions_org_id', 'organization_subscriptions', ['organization_id'], unique=True)
    op.create_index('ix_organization_subscriptions_status', 'organization_subscriptions', ['status'])


def downgrade() -> None:
    """删除订阅套餐表。"""
    op.drop_index('ix_organization_subscriptions_status', table_name='organization_subscriptions', if_exists=True)
    op.drop_index('ix_organization_subscriptions_org_id', table_name='organization_subscriptions', if_exists=True)
    op.drop_table('organization_subscriptions')

    op.drop_index('ix_subscription_plans_is_active', table_name='subscription_plans', if_exists=True)
    op.drop_index('ix_subscription_plans_code', table_name='subscription_plans', if_exists=True)
    op.drop_table('subscription_plans')
