"""
Seed script for development.
Usage:
  uv run python scripts/seed_demo.py           # 默认：仅添加一个系统管理员（含默认组织）
  uv run python scripts/seed_demo.py --full   # 完整演示数据：公寓、房间、租客、租约、账单等
"""
import argparse
import random
import sys
from datetime import date, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.configs.database import SessionLocal
from app.models.apartment import Apartment, Room, RoomStatus
from app.models.tenant import Tenant
from app.models.lease import Lease
from app.models.utility import UtilityReading
from app.models.bill import Bill, BillStatus, Payment, PaymentMethod
from app.models.organization import Organization, OrganizationMember, MemberRole
from app.models.user import User
from app.utils.security import get_password_hash


# Configuration
DEMO_CONFIG = {
    "admin_phone": "13800000001",
    "admin_password": "Admin123456",
    "admin_name": "管理员",
    "org_name": "阳光公寓管理公司",
    "org_slug": "sunshine-apartments",
    "num_apartments": 3,
    "rooms_per_apartment": 10,
    "num_tenants": 20,
    "active_lease_ratio": 0.6,  # 60% of tenants have active leases
}

# Sample data
APARTMENT_TEMPLATES = [
    {"name": "阳光花园A栋", "address": "北京市朝阳区阳光花园路1号", "description": "高档公寓，交通便利"},
    {"name": "阳光花园B栋", "address": "北京市朝阳区阳光花园路3号", "description": "新建公寓，设施完善"},
    {"name": "蓝海公寓", "address": "北京市海淀区中关村大街88号", "description": "科技园区核心位置"},
]

LAYOUTS = ["单间", "一室一厅", "两室一厅", "三室一厅"]
TENANT_FIRST_NAMES = ["张", "王", "李", "刘", "陈", "杨", "黄", "赵", "周", "吴"]
TENANT_LAST_NAMES = ["伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "洋", "艳"]


def random_phone():
    """Generate a random Chinese phone number."""
    prefixes = ["138", "139", "150", "151", "186", "187", "188"]
    return random.choice(prefixes) + "".join([str(random.randint(0, 9)) for _ in range(8)])


def random_id_card():
    """Generate a random Chinese ID card number (simplified)."""
    return "110101" + "".join([str(random.randint(0, 9)) for _ in range(12)])


def generate_room_number(floor: int, room: int) -> str:
    """Generate room number like '101', '202', etc."""
    return f"{floor}{room:02d}"


# 默认种子：仅一个系统管理员时使用的组织
DEFAULT_ORG_CONFIG = {
    "name": "默认组织",
    "slug": "default-org",
}


def seed_admin_only():
    """仅添加一个系统管理员及其默认组织。"""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.phone == DEMO_CONFIG["admin_phone"]).first()
        if existing:
            print("✅ 系统管理员已存在")
            print(f"   手机号: {DEMO_CONFIG['admin_phone']}")
            print(f"   密码: {DEMO_CONFIG['admin_password']}")
            return

        org = Organization(
            name=DEFAULT_ORG_CONFIG["name"],
            slug=DEFAULT_ORG_CONFIG["slug"],
        )
        db.add(org)
        db.flush()

        admin = User(
            phone=DEMO_CONFIG["admin_phone"],
            password_hash=get_password_hash(DEMO_CONFIG["admin_password"]),
            full_name=DEMO_CONFIG["admin_name"],
            is_active=True,
        )
        db.add(admin)
        db.flush()

        db.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=admin.id,
                role=MemberRole.OWNER,
            )
        )
        db.commit()
        print("✅ 已添加一个系统管理员")
        print(f"   手机号: {DEMO_CONFIG['admin_phone']}")
        print(f"   密码: {DEMO_CONFIG['admin_password']}")
        print(f"   组织: {DEFAULT_ORG_CONFIG['name']}")
    except Exception as e:
        db.rollback()
        print(f"❌ 添加失败: {e}")
        raise
    finally:
        db.close()


def seed_demo():
    """Generate comprehensive demo data."""
    db = SessionLocal()

    try:
        # Check if demo data already exists
        existing_org = db.query(Organization).filter(
            Organization.slug == DEMO_CONFIG["org_slug"]
        ).first()

        if existing_org:
            print("⚠️  完整演示数据已存在")
            print(f"   组织: {existing_org.name}")
            print("   可先执行 reset_db.py 再重试")
            return

        print("🌱 正在生成完整演示数据...")

        # ========================================
        # 1. Create Organization
        # ========================================
        org = Organization(
            name=DEMO_CONFIG["org_name"],
            slug=DEMO_CONFIG["org_slug"],
        )
        db.add(org)
        db.flush()
        print(f"   ✅ 组织: {org.name}")

        # ========================================
        # 2. Admin User（已存在则复用并加入本组织）
        # ========================================
        admin = db.query(User).filter(User.phone == DEMO_CONFIG["admin_phone"]).first()
        if not admin:
            admin = User(
                phone=DEMO_CONFIG["admin_phone"],
                password_hash=get_password_hash(DEMO_CONFIG["admin_password"]),
                full_name=DEMO_CONFIG["admin_name"],
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print(f"   ✅ 管理员: {admin.phone}")
        else:
            print(f"   ✅ 复用已有管理员: {admin.phone}")

        membership = OrganizationMember(
            organization_id=org.id,
            user_id=admin.id,
            role=MemberRole.OWNER,
        )
        db.add(membership)

        # ========================================
        # 3. Create Apartments and Rooms
        # ========================================
        apartments = []
        rooms = []

        for i in range(DEMO_CONFIG["num_apartments"]):
            template = APARTMENT_TEMPLATES[i % len(APARTMENT_TEMPLATES)]
            apartment = Apartment(
                organization_id=org.id,
                name=template["name"],
                address=template["address"],
                description=template["description"],
            )
            db.add(apartment)
            db.flush()
            apartments.append(apartment)

            # Create rooms for this apartment
            floors = random.randint(3, 6)
            rooms_per_floor = DEMO_CONFIG["rooms_per_apartment"] // floors

            for floor in range(1, floors + 1):
                for room_num in range(1, rooms_per_floor + 1):
                    layout = random.choice(LAYOUTS)
                    # Base rent based on layout
                    base_rent = {
                        "单间": 1500,
                        "一室一厅": 2500,
                        "两室一厅": 3500,
                        "三室一厅": 4500,
                    }[layout]

                    room = Room(
                        apartment_id=apartment.id,
                        room_number=generate_room_number(floor, room_num),
                        layout=layout,
                        status=RoomStatus.AVAILABLE,
                        monthly_rent=float(base_rent + random.randint(-200, 500)),
                        area=float(random.randint(25, 120)),
                    )
                    db.add(room)
                    rooms.append(room)

        db.flush()
        print(f"   ✅ 已创建 {len(apartments)} 个公寓、{len(rooms)} 个房间")

        # ========================================
        # 4. Create Tenants
        # ========================================
        tenants = []

        for i in range(DEMO_CONFIG["num_tenants"]):
            name = random.choice(TENANT_FIRST_NAMES) + random.choice(TENANT_LAST_NAMES)
            tenant = Tenant(
                organization_id=org.id,
                name=name,
                phone=random_phone(),
                id_card=random_id_card(),
            )
            db.add(tenant)
            tenants.append(tenant)

        db.flush()
        print(f"   ✅ 已创建 {len(tenants)} 个租客")

        # ========================================
        # 5. Create Leases
        # ========================================
        leases = []
        occupied_rooms = random.sample(rooms, int(len(rooms) * DEMO_CONFIG["active_lease_ratio"]))
        today = date.today()

        for i, room in enumerate(occupied_rooms):
            if i >= len(tenants):
                break

            tenant = tenants[i]

            # Random lease dates
            start_date = today - timedelta(days=random.randint(30, 365))
            end_date = start_date + timedelta(days=365)  # 1 year lease

            lease = Lease(
                room_id=room.id,
                tenant_id=tenant.id,
                start_date=start_date,
                end_date=end_date,
                monthly_rent=room.monthly_rent,
                deposit=room.monthly_rent * 2,  # 2 months deposit
                water_rate=5.0,  # 5 yuan per ton
                electricity_rate=0.6,  # 0.6 yuan per kWh
                is_active=True,
            )
            db.add(lease)
            leases.append(lease)

            # Update room status
            room.status = RoomStatus.OCCUPIED

        db.flush()
        print(f"   ✅ 已创建 {len(leases)} 个活跃租约")

        # ========================================
        # 6. Create Utility Readings
        # ========================================
        readings_count = 0

        for lease in leases:
            # Create readings for the past 3 months
            water_base = random.randint(100, 500)
            elec_base = random.randint(500, 2000)

            for month_offset in range(3):
                reading_date = today.replace(day=1) - timedelta(days=month_offset * 30)
                water_usage = random.randint(5, 20)
                elec_usage = random.randint(50, 200)

                reading = UtilityReading(
                    room_id=lease.room_id,
                    period_year=reading_date.year,
                    period_month=reading_date.month,
                    reading_date=reading_date,
                    water_reading=float(water_base + water_usage * (3 - month_offset)),
                    electricity_reading=float(elec_base + elec_usage * (3 - month_offset)),
                    water_previous=float(water_base + water_usage * (2 - month_offset)) if month_offset < 2 else None,
                    electricity_previous=float(elec_base + elec_usage * (2 - month_offset)) if month_offset < 2 else None,
                )
                db.add(reading)
                readings_count += 1

        db.flush()
        print(f"   ✅ 已创建 {readings_count} 条水电读数")

        # ========================================
        # 7. Create Bills
        # ========================================
        bills = []
        bill_count = 0

        for lease in leases:
            # Create bills for the past 3 months
            for month_offset in range(3):
                bill_date = today.replace(day=1) - timedelta(days=month_offset * 30)
                due_date = bill_date + timedelta(days=10)

                rent = float(lease.monthly_rent)
                water = random.randint(20, 100)
                electricity = random.randint(50, 300)
                total = rent + water + electricity

                # Randomly determine bill status
                if month_offset == 0:  # Current month
                    status = BillStatus.PENDING
                    paid_amount = 0.0
                elif random.random() > 0.2:  # 80% paid
                    status = BillStatus.PAID
                    paid_amount = total
                else:
                    status = random.choice([BillStatus.PENDING, BillStatus.PARTIAL])
                    paid_amount = total * random.uniform(0.3, 0.7) if status == BillStatus.PARTIAL else 0.0

                bill = Bill(
                    lease_id=lease.id,
                    bill_year=bill_date.year,
                    bill_month=bill_date.month,
                    due_date=due_date,
                    rent_amount=rent,
                    water_amount=float(water),
                    electricity_amount=float(electricity),
                    other_amount=0.0,
                    total_amount=float(total),
                    paid_amount=float(paid_amount),
                    status=status,
                )
                db.add(bill)
                bills.append(bill)
                bill_count += 1

        db.flush()
        print(f"   ✅ 已创建 {bill_count} 条账单")

        # ========================================
        # 8. Create Payments for Paid Bills
        # ========================================
        payment_count = 0

        for bill in bills:
            if bill.status == BillStatus.PAID:
                payment = Payment(
                    bill_id=bill.id,
                    amount=bill.total_amount,
                    payment_date=bill.due_date - timedelta(days=random.randint(1, 5)),
                    payment_method=random.choice(list(PaymentMethod)),
                )
                db.add(payment)
                payment_count += 1
            elif bill.status == BillStatus.PARTIAL:
                payment = Payment(
                    bill_id=bill.id,
                    amount=bill.paid_amount,
                    payment_date=bill.due_date - timedelta(days=random.randint(1, 5)),
                    payment_method=random.choice(list(PaymentMethod)),
                )
                db.add(payment)
                payment_count += 1

        db.flush()
        print(f"   ✅ 已创建 {payment_count} 条支付记录")

        # Commit all changes
        db.commit()

        # ========================================
        # Summary
        # ========================================
        print("\n" + "=" * 50)
        print("✅ Demo data seeded successfully!")
        print("=" * 50)
        print(f"\n📋 登录信息:")
        print(f"   手机号: {DEMO_CONFIG['admin_phone']}")
        print(f"   密码: {DEMO_CONFIG['admin_password']}")
        print(f"\n📊 数据统计:")
        print(f"   公寓: {len(apartments)}")
        print(f"   房间: {len(rooms)} (已出租: {len(leases)})")
        print(f"   租客: {len(tenants)}")
        print(f"   租约: {len(leases)}")
        print(f"   账单: {bill_count}")
        print(f"   支付记录: {payment_count}")

    except Exception as e:
        db.rollback()
        print(f"❌ 完整演示数据写入失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="种子数据脚本")
    parser.add_argument(
        "--full",
        action="store_true",
        help="生成完整演示数据（公寓、房间、租客、租约、账单等）；默认仅添加一个系统管理员",
    )
    args = parser.parse_args()
    if args.full:
        seed_demo()
    else:
        seed_admin_only()
