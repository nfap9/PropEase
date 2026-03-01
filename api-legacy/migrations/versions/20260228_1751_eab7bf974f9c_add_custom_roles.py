"""add_custom_roles

Revision ID: eab7bf974f9c
Revises: 5b9082dc9042
Create Date: 2026-02-28 17:51:38.543693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eab7bf974f9c'
down_revision: Union[str, None] = '5b9082dc9042'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create custom_roles table
    op.create_table(
        'custom_roles',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('organization_id', sa.String(26), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('permissions', sa.String(2000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create indexes for custom_roles
    op.create_index('ix_custom_roles_organization_id', 'custom_roles', ['organization_id'])
    op.create_index('ix_custom_roles_org_name', 'custom_roles', ['organization_id', 'name'], unique=True)

    # Add custom_role_id to organization_members
    op.add_column(
        'organization_members',
        sa.Column('custom_role_id', sa.String(26), sa.ForeignKey('custom_roles.id', ondelete='SET NULL'), nullable=True)
    )


def downgrade() -> None:
    # Drop custom_role_id from organization_members
    op.drop_column('organization_members', 'custom_role_id')

    # Drop custom_roles indexes and table
    op.drop_index('ix_custom_roles_org_name', 'custom_roles')
    op.drop_index('ix_custom_roles_organization_id', 'custom_roles')
    op.drop_table('custom_roles')
