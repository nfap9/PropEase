"""add phone field and sms_verification_codes table

Revision ID: add_phone_sms
Revises: add_billing_day
Create Date: 2026-02-27 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_phone_sms'
down_revision: Union[str, None] = 'add_billing_day'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 添加 phone 字段（先允许为空）
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))

    # 2. 创建 phone 字段的唯一索引
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=True)

    # 3. 将 email 字段改为可空
    op.alter_column('users', 'email', nullable=True)

    # 4. 创建短信验证码表
    op.create_table(
        'sms_verification_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('code', sa.String(6), nullable=False),
        sa.Column('purpose', sa.String(20), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sms_verification_codes_id'), 'sms_verification_codes', ['id'])
    op.create_index(op.f('ix_sms_verification_codes_phone'), 'sms_verification_codes', ['phone'])


def downgrade() -> None:
    # 删除验证码表
    op.drop_index(op.f('ix_sms_verification_codes_phone'), table_name='sms_verification_codes')
    op.drop_index(op.f('ix_sms_verification_codes_id'), table_name='sms_verification_codes')
    op.drop_table('sms_verification_codes')

    # 恢复 email 为非空（如果有数据可能会失败）
    op.alter_column('users', 'email', nullable=False)

    # 删除 phone 字段索引和字段
    op.drop_index(op.f('ix_users_phone'), table_name='users')
    op.drop_column('users', 'phone')
