"""add_is_system_to_admin_users

Revision ID: d1eb5a629364
Revises: add_subscription_orders
Create Date: 2026-03-01 10:39:15.111446

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1eb5a629364'
down_revision: Union[str, None] = 'add_subscription_orders'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_users",
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("admin_users", "is_system")
