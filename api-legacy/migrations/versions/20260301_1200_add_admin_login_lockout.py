"""add_admin_login_lockout

Revision ID: admin_login_lockout
Revises: d1eb5a629364
Create Date: 2026-03-01 12:00:00

运营账号安全：登录失败次数与锁定时间，用于防暴力破解。
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "admin_login_lockout"
down_revision: Union[str, None] = "d1eb5a629364"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "admin_users",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "locked_until")
    op.drop_column("admin_users", "failed_login_attempts")
