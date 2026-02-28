"""add_organization_is_active

Revision ID: add_org_is_active
Revises: add_admin_system
Create Date: 2026-02-28 20:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "add_org_is_active"
down_revision: Union[str, None] = "add_admin_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_organizations_is_active", "organizations", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_organizations_is_active", table_name="organizations")
    op.drop_column("organizations", "is_active")
