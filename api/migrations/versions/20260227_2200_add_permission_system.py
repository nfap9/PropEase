"""add permission system tables

Revision ID: add_permission_system
Revises: add_phone_sms
Create Date: 2026-02-27 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_permission_system'
down_revision: Union[str, None] = 'add_phone_sms'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建权限表
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resource', sa.Enum('apartment', 'room', 'tenant', 'lease',
                                       'bill', 'utility', 'member', 'settings', 'report',
                                       name='resource'), nullable=False),
        sa.Column('action', sa.Enum('view', 'create', 'edit', 'delete', 'export', 'manage',
                                     name='action'), nullable=False),
        sa.Column('code', sa.String(100), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resource', 'action', name='uq_permission_resource_action'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_permissions_id'), 'permissions', ['id'])

    # 创建组织角色权限表
    op.create_table(
        'organization_role_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'role', 'permission_id', name='uq_org_role_permission')
    )
    op.create_index(op.f('ix_organization_role_permissions_id'), 'organization_role_permissions', ['id'])

    # 创建系统角色配置表
    op.create_table(
        'system_role_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('super_admin', 'support', 'operations', 'finance', 'readonly',
                                   name='systemrole'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role')
    )
    op.create_index(op.f('ix_system_role_configs_id'), 'system_role_configs', ['id'])

    # 创建系统角色权限表
    op.create_table(
        'system_role_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('super_admin', 'support', 'operations', 'finance', 'readonly',
                                   name='systemrole'), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role', 'permission_id', name='uq_system_role_permission')
    )
    op.create_index(op.f('ix_system_role_permissions_id'), 'system_role_permissions', ['id'])

    # 创建用户系统角色关联表
    op.create_table(
        'user_system_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.Enum('super_admin', 'support', 'operations', 'finance', 'readonly',
                                   name='systemrole'), nullable=False),
        sa.Column('granted_by', sa.Integer(), nullable=True),
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'role', name='uq_user_system_role')
    )
    op.create_index(op.f('ix_user_system_roles_id'), 'user_system_roles', ['id'])


def downgrade() -> None:
    # 删除用户系统角色关联表
    op.drop_index(op.f('ix_user_system_roles_id'), table_name='user_system_roles')
    op.drop_table('user_system_roles')

    # 删除系统角色权限表
    op.drop_index(op.f('ix_system_role_permissions_id'), table_name='system_role_permissions')
    op.drop_table('system_role_permissions')

    # 删除系统角色配置表
    op.drop_index(op.f('ix_system_role_configs_id'), table_name='system_role_configs')
    op.drop_table('system_role_configs')

    # 删除组织角色权限表
    op.drop_index(op.f('ix_organization_role_permissions_id'), table_name='organization_role_permissions')
    op.drop_table('organization_role_permissions')

    # 删除权限表
    op.drop_index(op.f('ix_permissions_id'), table_name='permissions')
    op.drop_table('permissions')

    # 删除枚举类型
    op.execute("DROP TYPE IF EXISTS systemrole")
    op.execute("DROP TYPE IF EXISTS action")
    op.execute("DROP TYPE IF EXISTS resource")
