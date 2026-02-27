"""
Create initial admin user for development.
Usage: uv run python scripts/seed_admin.py
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.configs.database import SessionLocal
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, MemberRole
from app.utils.security import get_password_hash

# Default admin credentials
DEFAULT_ADMIN = {
    "phone": "13800000001",
    "password": "Admin123456",
    "full_name": "管理员",
}

DEFAULT_ORG = {
    "name": "Default Organization",
    "slug": "default-org",
}


def seed_admin():
    """Create initial admin user and organization."""
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_user = db.query(User).filter(User.phone == DEFAULT_ADMIN["phone"]).first()
        if existing_user:
            print(f"✅ 管理员用户已存在: {DEFAULT_ADMIN['phone']}")
            print(f"   密码: {DEFAULT_ADMIN['password']}")
            return

        # Create organization
        org = Organization(
            name=DEFAULT_ORG["name"],
            slug=DEFAULT_ORG["slug"],
        )
        db.add(org)
        db.flush()

        # Create admin user
        admin = User(
            phone=DEFAULT_ADMIN["phone"],
            password_hash=get_password_hash(DEFAULT_ADMIN["password"]),
            full_name=DEFAULT_ADMIN["full_name"],
            is_active=True,
        )
        db.add(admin)
        db.flush()

        # Add admin to organization as owner
        membership = OrganizationMember(
            organization_id=org.id,
            user_id=admin.id,
            role=MemberRole.OWNER,
        )
        db.add(membership)

        db.commit()
        print("✅ 初始管理员用户创建成功!")
        print(f"   手机号: {DEFAULT_ADMIN['phone']}")
        print(f"   密码: {DEFAULT_ADMIN['password']}")
        print(f"   组织: {DEFAULT_ORG['name']}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin user: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
