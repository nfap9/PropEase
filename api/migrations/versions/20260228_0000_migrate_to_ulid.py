"""
迁移到ULID主键

Revision ID: ulid_migration
Revises: 20260227_2200_add_permission_system
Create Date: 2026-02-28

这是一个破坏性迁移，需要：
1. 停止应用服务
2. 备份数据库
3. 运行迁移
4. 更新应用代码
5. 重启服务

注意：此迁移会删除所有现有数据并重建表结构。
在生产环境执行前请务必做好数据备份！
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from ulid import ulid
import json


revision: str = 'ulid_migration'
down_revision: Union[str, None] = 'add_permission_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def generate_ulid() -> str:
    return ulid()


def upgrade() -> None:
    """
    执行ULID迁移。

    由于整数主键无法直接转换为字符串主键，
    我们需要重建所有表。
    """
    conn = op.get_bind()

    # 获取所有现有表的数据
    tables_data = {}

    # 读取所有表的数据（按依赖顺序）
    tables_to_backup = [
        'payments',
        'bills',
        'utility_readings',
        'leases',
        'system_role_permissions',
        'organization_role_permissions',
        'user_system_roles',
        'rooms',
        'tenants',
        'apartments',
        'organization_members',
        'sms_verification_codes',
        'organizations',
        'system_role_configs',
        'permissions',
        'users',
    ]

    for table in tables_to_backup:
        try:
            result = conn.execute(text(f"SELECT * FROM {table}"))
            tables_data[table] = [dict(row._mapping) for row in result.fetchall()]
        except Exception:
            tables_data[table] = []

    # 按依赖顺序删除所有表（反向依赖）
    tables_to_drop = [
        'payments',
        'bills',
        'utility_readings',
        'leases',
        'rooms',
        'system_role_permissions',
        'organization_role_permissions',
        'user_system_roles',
        'tenants',
        'apartments',
        'organization_members',
        'sms_verification_codes',
        'organizations',
        'system_role_configs',
        'permissions',
        'users',
    ]

    for table in tables_to_drop:
        conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))

    # 创建ID映射
    id_mapping = {}

    # 按依赖顺序创建新表并迁移数据

    # 1. users 表
    conn.execute(text("""
        CREATE TABLE users (
            id VARCHAR(26) PRIMARY KEY,
            phone VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))
    conn.execute(text("CREATE INDEX ix_users_phone ON users(phone)"))

    # 迁移 users 数据
    id_mapping['users'] = {}
    for row in tables_data.get('users', []):
        new_id = generate_ulid()
        id_mapping['users'][row['id']] = new_id
        conn.execute(text("""
            INSERT INTO users (id, phone, email, password_hash, full_name, is_active, created_at, updated_at)
            VALUES (:id, :phone, :email, :password_hash, :full_name, :is_active, :created_at, :updated_at)
        """), {
            'id': new_id,
            'phone': row['phone'],
            'email': row['email'],
            'password_hash': row['password_hash'],
            'full_name': row['full_name'],
            'is_active': row['is_active'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    # 2. permissions 表
    conn.execute(text("""
        CREATE TABLE permissions (
            id VARCHAR(26) PRIMARY KEY,
            resource VARCHAR(50) NOT NULL,
            action VARCHAR(50) NOT NULL,
            code VARCHAR(100) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    id_mapping['permissions'] = {}
    for row in tables_data.get('permissions', []):
        new_id = generate_ulid()
        id_mapping['permissions'][row['id']] = new_id
        conn.execute(text("""
            INSERT INTO permissions (id, resource, action, code, name, description, created_at, updated_at)
            VALUES (:id, :resource, :action, :code, :name, :description, :created_at, :updated_at)
        """), {
            'id': new_id,
            'resource': row['resource'],
            'action': row['action'],
            'code': row['code'],
            'name': row['name'],
            'description': row['description'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    # 3. system_role_configs 表
    conn.execute(text("""
        CREATE TABLE system_role_configs (
            id VARCHAR(26) PRIMARY KEY,
            role VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    id_mapping['system_role_configs'] = {}
    for row in tables_data.get('system_role_configs', []):
        new_id = generate_ulid()
        id_mapping['system_role_configs'][row['id']] = new_id
        conn.execute(text("""
            INSERT INTO system_role_configs (id, role, name, description, is_active, created_at, updated_at)
            VALUES (:id, :role, :name, :description, :is_active, :created_at, :updated_at)
        """), {
            'id': new_id,
            'role': row['role'],
            'name': row['name'],
            'description': row['description'],
            'is_active': row['is_active'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    # 4. organizations 表
    conn.execute(text("""
        CREATE TABLE organizations (
            id VARCHAR(26) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            plan VARCHAR(50) NOT NULL DEFAULT 'free',
            settings JSON,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))
    conn.execute(text("CREATE INDEX ix_organizations_slug ON organizations(slug)"))

    id_mapping['organizations'] = {}
    for row in tables_data.get('organizations', []):
        new_id = generate_ulid()
        id_mapping['organizations'][row['id']] = new_id
        # psycopg3 需要用 Json 包装器处理 JSON 字段
        from psycopg.types.json import Json
        settings_value = Json(row['settings']) if row['settings'] else None
        conn.execute(text("""
            INSERT INTO organizations (id, name, slug, plan, settings, created_at, updated_at)
            VALUES (:id, :name, :slug, :plan, :settings, :created_at, :updated_at)
        """), {
            'id': new_id,
            'name': row['name'],
            'slug': row['slug'],
            'plan': row['plan'],
            'settings': settings_value,
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    # 5. sms_verification_codes 表
    conn.execute(text("""
        CREATE TABLE sms_verification_codes (
            id VARCHAR(26) PRIMARY KEY,
            phone VARCHAR(20) NOT NULL,
            code VARCHAR(6) NOT NULL,
            purpose VARCHAR(20) NOT NULL,
            is_used BOOLEAN NOT NULL DEFAULT FALSE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))
    conn.execute(text("CREATE INDEX ix_sms_verification_codes_phone ON sms_verification_codes(phone)"))

    for row in tables_data.get('sms_verification_codes', []):
        new_id = generate_ulid()
        conn.execute(text("""
            INSERT INTO sms_verification_codes (id, phone, code, purpose, is_used, expires_at, created_at, updated_at)
            VALUES (:id, :phone, :code, :purpose, :is_used, :expires_at, :created_at, :updated_at)
        """), {
            'id': new_id,
            'phone': row['phone'],
            'code': row['code'],
            'purpose': row['purpose'],
            'is_used': row['is_used'],
            'expires_at': row['expires_at'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at'],
        })

    # 6. organization_members 表
    conn.execute(text("""
        CREATE TABLE organization_members (
            id VARCHAR(26) PRIMARY KEY,
            organization_id VARCHAR(26) NOT NULL REFERENCES organizations(id),
            user_id VARCHAR(26) NOT NULL REFERENCES users(id),
            role VARCHAR(20) NOT NULL DEFAULT 'member',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(organization_id, user_id)
        )
    """))

    id_mapping['organization_members'] = {}
    for row in tables_data.get('organization_members', []):
        new_id = generate_ulid()
        id_mapping['organization_members'][row['id']] = new_id
        new_org_id = id_mapping['organizations'].get(row['organization_id'])
        new_user_id = id_mapping['users'].get(row['user_id'])
        if new_org_id and new_user_id:
            conn.execute(text("""
                INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
                VALUES (:id, :organization_id, :user_id, :role, :created_at, :updated_at)
            """), {
                'id': new_id,
                'organization_id': new_org_id,
                'user_id': new_user_id,
                'role': row['role'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 7. apartments 表
    conn.execute(text("""
        CREATE TABLE apartments (
            id VARCHAR(26) PRIMARY KEY,
            organization_id VARCHAR(26) NOT NULL REFERENCES organizations(id),
            name VARCHAR(255) NOT NULL,
            address VARCHAR(500),
            description VARCHAR(1000),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    id_mapping['apartments'] = {}
    for row in tables_data.get('apartments', []):
        new_id = generate_ulid()
        id_mapping['apartments'][row['id']] = new_id
        new_org_id = id_mapping['organizations'].get(row['organization_id'])
        if new_org_id:
            conn.execute(text("""
                INSERT INTO apartments (id, organization_id, name, address, description, created_at, updated_at)
                VALUES (:id, :organization_id, :name, :address, :description, :created_at, :updated_at)
            """), {
                'id': new_id,
                'organization_id': new_org_id,
                'name': row['name'],
                'address': row['address'],
                'description': row['description'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 8. tenants 表
    conn.execute(text("""
        CREATE TABLE tenants (
            id VARCHAR(26) PRIMARY KEY,
            organization_id VARCHAR(26) NOT NULL REFERENCES organizations(id),
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            id_card VARCHAR(50),
            email VARCHAR(255),
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(50),
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    id_mapping['tenants'] = {}
    for row in tables_data.get('tenants', []):
        new_id = generate_ulid()
        id_mapping['tenants'][row['id']] = new_id
        new_org_id = id_mapping['organizations'].get(row['organization_id'])
        if new_org_id:
            conn.execute(text("""
                INSERT INTO tenants (id, organization_id, name, phone, id_card, email, emergency_contact, emergency_phone, notes, created_at, updated_at)
                VALUES (:id, :organization_id, :name, :phone, :id_card, :email, :emergency_contact, :emergency_phone, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'organization_id': new_org_id,
                'name': row['name'],
                'phone': row['phone'],
                'id_card': row['id_card'],
                'email': row['email'],
                'emergency_contact': row['emergency_contact'],
                'emergency_phone': row['emergency_phone'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 9. user_system_roles 表
    conn.execute(text("""
        CREATE TABLE user_system_roles (
            id VARCHAR(26) PRIMARY KEY,
            user_id VARCHAR(26) NOT NULL REFERENCES users(id),
            role VARCHAR(50) NOT NULL,
            granted_by VARCHAR(26) REFERENCES users(id),
            granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, role)
        )
    """))

    for row in tables_data.get('user_system_roles', []):
        new_id = generate_ulid()
        new_user_id = id_mapping['users'].get(row['user_id'])
        new_granted_by = id_mapping['users'].get(row['granted_by']) if row['granted_by'] else None
        if new_user_id:
            conn.execute(text("""
                INSERT INTO user_system_roles (id, user_id, role, granted_by, granted_at, created_at, updated_at)
                VALUES (:id, :user_id, :role, :granted_by, :granted_at, :created_at, :updated_at)
            """), {
                'id': new_id,
                'user_id': new_user_id,
                'role': row['role'],
                'granted_by': new_granted_by,
                'granted_at': row['granted_at'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 10. rooms 表
    conn.execute(text("""
        CREATE TABLE rooms (
            id VARCHAR(26) PRIMARY KEY,
            apartment_id VARCHAR(26) NOT NULL REFERENCES apartments(id),
            room_number VARCHAR(50) NOT NULL,
            layout VARCHAR(50),
            status VARCHAR(20) NOT NULL DEFAULT 'available',
            monthly_rent NUMERIC(10, 2) NOT NULL,
            area NUMERIC(10, 2),
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(apartment_id, room_number)
        )
    """))

    id_mapping['rooms'] = {}
    for row in tables_data.get('rooms', []):
        new_id = generate_ulid()
        id_mapping['rooms'][row['id']] = new_id
        new_apartment_id = id_mapping['apartments'].get(row['apartment_id'])
        if new_apartment_id:
            conn.execute(text("""
                INSERT INTO rooms (id, apartment_id, room_number, layout, status, monthly_rent, area, notes, created_at, updated_at)
                VALUES (:id, :apartment_id, :room_number, :layout, :status, :monthly_rent, :area, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'apartment_id': new_apartment_id,
                'room_number': row['room_number'],
                'layout': row['layout'],
                'status': row['status'],
                'monthly_rent': row['monthly_rent'],
                'area': row['area'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 11. leases 表
    conn.execute(text("""
        CREATE TABLE leases (
            id VARCHAR(26) PRIMARY KEY,
            room_id VARCHAR(26) NOT NULL REFERENCES rooms(id),
            tenant_id VARCHAR(26) NOT NULL REFERENCES tenants(id),
            start_date DATE NOT NULL,
            end_date DATE,
            billing_day INTEGER NOT NULL DEFAULT 1,
            monthly_rent NUMERIC(10, 2) NOT NULL,
            deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
            water_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
            electricity_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    id_mapping['leases'] = {}
    for row in tables_data.get('leases', []):
        new_id = generate_ulid()
        id_mapping['leases'][row['id']] = new_id
        new_room_id = id_mapping['rooms'].get(row['room_id'])
        new_tenant_id = id_mapping['tenants'].get(row['tenant_id'])
        if new_room_id and new_tenant_id:
            conn.execute(text("""
                INSERT INTO leases (id, room_id, tenant_id, start_date, end_date, billing_day, monthly_rent, deposit, water_rate, electricity_rate, is_active, notes, created_at, updated_at)
                VALUES (:id, :room_id, :tenant_id, :start_date, :end_date, :billing_day, :monthly_rent, :deposit, :water_rate, :electricity_rate, :is_active, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'room_id': new_room_id,
                'tenant_id': new_tenant_id,
                'start_date': row['start_date'],
                'end_date': row['end_date'],
                'billing_day': row['billing_day'],
                'monthly_rent': row['monthly_rent'],
                'deposit': row['deposit'],
                'water_rate': row['water_rate'],
                'electricity_rate': row['electricity_rate'],
                'is_active': row['is_active'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 12. organization_role_permissions 表
    conn.execute(text("""
        CREATE TABLE organization_role_permissions (
            id VARCHAR(26) PRIMARY KEY,
            organization_id VARCHAR(26) NOT NULL REFERENCES organizations(id),
            role VARCHAR(20) NOT NULL,
            permission_id VARCHAR(26) NOT NULL REFERENCES permissions(id),
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(organization_id, role, permission_id)
        )
    """))

    for row in tables_data.get('organization_role_permissions', []):
        new_id = generate_ulid()
        new_org_id = id_mapping['organizations'].get(row['organization_id'])
        new_perm_id = id_mapping['permissions'].get(row['permission_id'])
        if new_org_id and new_perm_id:
            conn.execute(text("""
                INSERT INTO organization_role_permissions (id, organization_id, role, permission_id, is_enabled, created_at, updated_at)
                VALUES (:id, :organization_id, :role, :permission_id, :is_enabled, :created_at, :updated_at)
            """), {
                'id': new_id,
                'organization_id': new_org_id,
                'role': row['role'],
                'permission_id': new_perm_id,
                'is_enabled': row['is_enabled'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 13. system_role_permissions 表
    conn.execute(text("""
        CREATE TABLE system_role_permissions (
            id VARCHAR(26) PRIMARY KEY,
            role VARCHAR(50) NOT NULL,
            permission_id VARCHAR(26) NOT NULL REFERENCES permissions(id),
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(role, permission_id)
        )
    """))

    for row in tables_data.get('system_role_permissions', []):
        new_id = generate_ulid()
        new_perm_id = id_mapping['permissions'].get(row['permission_id'])
        if new_perm_id:
            conn.execute(text("""
                INSERT INTO system_role_permissions (id, role, permission_id, is_enabled, created_at, updated_at)
                VALUES (:id, :role, :permission_id, :is_enabled, :created_at, :updated_at)
            """), {
                'id': new_id,
                'role': row['role'],
                'permission_id': new_perm_id,
                'is_enabled': row['is_enabled'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 14. utility_readings 表
    conn.execute(text("""
        CREATE TABLE utility_readings (
            id VARCHAR(26) PRIMARY KEY,
            room_id VARCHAR(26) NOT NULL REFERENCES rooms(id),
            period_year INTEGER NOT NULL,
            period_month INTEGER NOT NULL,
            reading_date DATE NOT NULL,
            water_reading NUMERIC(10, 2),
            electricity_reading NUMERIC(10, 2),
            water_previous NUMERIC(10, 2),
            electricity_previous NUMERIC(10, 2),
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(room_id, period_year, period_month)
        )
    """))

    for row in tables_data.get('utility_readings', []):
        new_id = generate_ulid()
        new_room_id = id_mapping['rooms'].get(row['room_id'])
        if new_room_id:
            conn.execute(text("""
                INSERT INTO utility_readings (id, room_id, period_year, period_month, reading_date, water_reading, electricity_reading, water_previous, electricity_previous, notes, created_at, updated_at)
                VALUES (:id, :room_id, :period_year, :period_month, :reading_date, :water_reading, :electricity_reading, :water_previous, :electricity_previous, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'room_id': new_room_id,
                'period_year': row['period_year'],
                'period_month': row['period_month'],
                'reading_date': row['reading_date'],
                'water_reading': row['water_reading'],
                'electricity_reading': row['electricity_reading'],
                'water_previous': row['water_previous'],
                'electricity_previous': row['electricity_previous'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 15. bills 表
    conn.execute(text("""
        CREATE TABLE bills (
            id VARCHAR(26) PRIMARY KEY,
            lease_id VARCHAR(26) NOT NULL REFERENCES leases(id),
            bill_year INTEGER NOT NULL,
            bill_month INTEGER NOT NULL,
            due_date DATE NOT NULL,
            rent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            water_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            electricity_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            other_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(10, 2) NOT NULL,
            paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE(lease_id, bill_year, bill_month)
        )
    """))

    id_mapping['bills'] = {}
    for row in tables_data.get('bills', []):
        new_id = generate_ulid()
        id_mapping['bills'][row['id']] = new_id
        new_lease_id = id_mapping['leases'].get(row['lease_id'])
        if new_lease_id:
            conn.execute(text("""
                INSERT INTO bills (id, lease_id, bill_year, bill_month, due_date, rent_amount, water_amount, electricity_amount, other_amount, total_amount, paid_amount, status, notes, created_at, updated_at)
                VALUES (:id, :lease_id, :bill_year, :bill_month, :due_date, :rent_amount, :water_amount, :electricity_amount, :other_amount, :total_amount, :paid_amount, :status, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'lease_id': new_lease_id,
                'bill_year': row['bill_year'],
                'bill_month': row['bill_month'],
                'due_date': row['due_date'],
                'rent_amount': row['rent_amount'],
                'water_amount': row['water_amount'],
                'electricity_amount': row['electricity_amount'],
                'other_amount': row['other_amount'],
                'total_amount': row['total_amount'],
                'paid_amount': row['paid_amount'],
                'status': row['status'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    # 16. payments 表
    conn.execute(text("""
        CREATE TABLE payments (
            id VARCHAR(26) PRIMARY KEY,
            bill_id VARCHAR(26) NOT NULL REFERENCES bills(id),
            amount NUMERIC(10, 2) NOT NULL,
            payment_date DATE NOT NULL,
            payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
            reference VARCHAR(255),
            notes VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """))

    for row in tables_data.get('payments', []):
        new_id = generate_ulid()
        new_bill_id = id_mapping['bills'].get(row['bill_id'])
        if new_bill_id:
            conn.execute(text("""
                INSERT INTO payments (id, bill_id, amount, payment_date, payment_method, reference, notes, created_at, updated_at)
                VALUES (:id, :bill_id, :amount, :payment_date, :payment_method, :reference, :notes, :created_at, :updated_at)
            """), {
                'id': new_id,
                'bill_id': new_bill_id,
                'amount': row['amount'],
                'payment_date': row['payment_date'],
                'payment_method': row['payment_method'],
                'reference': row['reference'],
                'notes': row['notes'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at'],
            })

    print("ULID迁移完成！")


def downgrade() -> None:
    """
    回滚迁移。

    警告：此操作会丢失所有ULID数据，需要从备份恢复。
    """
    raise NotImplementedError(
        "ULID migration downgrade not supported. "
        "Please restore from database backup."
    )
