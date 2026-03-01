"""
pytest 配置文件，提供测试夹具和共享设置。

此模块包含：
- 数据库测试夹具
- 客户端测试夹具
- 测试数据工厂
"""
import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.configs.database import Base
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, MemberRole
from app.models.apartment import Apartment, Room, RoomStatus
from app.models.tenant import Tenant
from app.models.lease import Lease
from app.models.utility import UtilityReading
from app.models.bill import Bill, BillStatus, Payment, PaymentMethod


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db_session):
    """创建测试用户"""
    user = User(
        phone="13800138000",
        password_hash="$2b$12$test_hash",
        full_name="测试用户",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_organization(db_session, test_user):
    """创建测试组织"""
    org = Organization(name="测试组织", slug="test-org")
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)

    member = OrganizationMember(
        organization_id=org.id,
        user_id=test_user.id,
        role=MemberRole.OWNER,
    )
    db_session.add(member)
    db_session.commit()

    return org


@pytest.fixture
def test_apartment(db_session, test_organization):
    """创建测试公寓"""
    apartment = Apartment(
        organization_id=test_organization.id,
        name="测试公寓",
        address="测试地址",
    )
    db_session.add(apartment)
    db_session.commit()
    db_session.refresh(apartment)
    return apartment


@pytest.fixture
def test_room(db_session, test_apartment):
    """创建测试房间"""
    room = Room(
        apartment_id=test_apartment.id,
        room_number="101",
        monthly_rent=2000.0,
        status=RoomStatus.AVAILABLE,
    )
    db_session.add(room)
    db_session.commit()
    db_session.refresh(room)
    return room


@pytest.fixture
def test_tenant(db_session, test_organization):
    """创建测试租客"""
    tenant = Tenant(
        organization_id=test_organization.id,
        name="张三",
        phone="13800138000",
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture
def test_lease(db_session, test_room, test_tenant):
    """创建测试租约"""
    lease = Lease(
        room_id=test_room.id,
        tenant_id=test_tenant.id,
        start_date=date(2024, 1, 1),
        end_date=date(2024, 12, 31),
        billing_day=1,
        monthly_rent=2000.0,
        deposit=2000.0,
        water_rate=5.0,
        electricity_rate=1.0,
        is_active=True,
    )
    db_session.add(lease)

    # 更新房间状态为已入住
    test_room.status = RoomStatus.OCCUPIED

    db_session.commit()
    db_session.refresh(lease)
    return lease


@pytest.fixture
def test_utility_reading(db_session, test_room):
    """创建测试水电读数"""
    reading = UtilityReading(
        room_id=test_room.id,
        period_year=2024,
        period_month=1,
        reading_date=date(2024, 1, 15),
        water_reading=100.0,
        electricity_reading=200.0,
        water_previous=90.0,
        electricity_previous=180.0,
    )
    db_session.add(reading)
    db_session.commit()
    db_session.refresh(reading)
    return reading


@pytest.fixture
def test_bill(db_session, test_lease):
    """创建测试账单"""
    bill = Bill(
        lease_id=test_lease.id,
        bill_year=2024,
        bill_month=1,
        due_date=date(2024, 1, 10),
        rent_amount=2000.0,
        water_amount=50.0,
        electricity_amount=20.0,
        other_amount=0.0,
        total_amount=2070.0,
        paid_amount=0.0,
        status=BillStatus.PENDING,
    )
    db_session.add(bill)
    db_session.commit()
    db_session.refresh(bill)
    return bill


@pytest.fixture
def test_payment(db_session, test_bill):
    """创建测试支付记录"""
    payment = Payment(
        bill_id=test_bill.id,
        amount=1000.0,
        payment_date=date(2024, 1, 5),
        payment_method=PaymentMethod.WECHAT,
    )
    db_session.add(payment)

    # 更新账单的已支付金额
    test_bill.paid_amount = 1000.0
    test_bill.status = BillStatus.PARTIAL

    db_session.commit()
    db_session.refresh(payment)
    return payment
