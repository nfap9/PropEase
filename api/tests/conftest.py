"""
pytest 配置文件，提供测试夹具和共享设置。

此模块包含：
- 数据库测试夹具
- 客户端测试夹具
- 测试数据工厂
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.configs.database import Base
from app.models.user import User
from app.models.organization import Organization, OrganizationMember, MemberRole
from app.models.apartment import Apartment, Room, RoomStatus
from app.models.tenant import Tenant
from app.models.lease import Lease


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
        email="test@example.com",
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
