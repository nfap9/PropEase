"""
添加公寓公用费用配置表

Revision ID: add_utility_config
Revises: remove_email_fields
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'add_utility_config'
down_revision: Union[str, None] = 'remove_email_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """创建 utility_configs 表。"""
    op.create_table(
        'utility_configs',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('apartment_id', sa.String(26), sa.ForeignKey('apartments.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('water_price_per_unit', sa.Numeric(10, 2), nullable=True),
        sa.Column('electricity_price_per_unit', sa.Numeric(10, 2), nullable=True),
        sa.Column('internet_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('management_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('service_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # 创建索引（apartment_id 已有 unique 约束，这里创建普通索引用于查询优化）
    op.create_index('ix_utility_configs_apartment_id', 'utility_configs', ['apartment_id'], unique=True)


def downgrade() -> None:
    """删除 utility_configs 表。"""
    op.drop_index('ix_utility_configs_apartment_id', table_name='utility_configs', if_exists=True)
    op.drop_table('utility_configs')
