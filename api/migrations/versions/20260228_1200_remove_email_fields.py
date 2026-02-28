"""
删除用户和租客的email字段

Revision ID: remove_email_fields
Revises: ulid_migration
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'remove_email_fields'
down_revision: Union[str, None] = 'ulid_migration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """删除 users 和 tenants 表的 email 字段。"""
    # 删除 users 表的 email 字段
    op.drop_index('ix_users_email', table_name='users', if_exists=True)
    op.drop_column('users', 'email', if_exists=True)

    # 删除 tenants 表的 email 字段
    op.drop_column('tenants', 'email', if_exists=True)


def downgrade() -> None:
    """恢复 users 和 tenants 表的 email 字段。"""
    # 恢复 users 表的 email 字段
    op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 恢复 tenants 表的 email 字段
    op.add_column('tenants', sa.Column('email', sa.String(255), nullable=True))
