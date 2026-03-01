"""add_is_personal_to_organization

Revision ID: edbb48541bc7
Revises: add_subscription
Create Date: 2026-02-28 17:31:04.598328

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edbb48541bc7'
down_revision: Union[str, None] = 'add_subscription'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_personal column to organizations table
    op.add_column(
        'organizations',
        sa.Column('is_personal', sa.Boolean(), nullable=False, server_default='false')
    )
    # Create index for faster lookups
    op.create_index('ix_organizations_is_personal', 'organizations', ['is_personal'])


def downgrade() -> None:
    op.drop_index('ix_organizations_is_personal', 'organizations')
    op.drop_column('organizations', 'is_personal')
