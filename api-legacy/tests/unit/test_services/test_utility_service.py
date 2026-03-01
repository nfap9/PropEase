"""
水电读数服务单元测试。

测试覆盖：
- 创建读数 (create_reading) - 自动获取上期读数
- 批量创建读数 (batch_create_readings)
- 更新读数 (update_reading)
- 删除读数 (delete_reading)
- 列表查询 (list_readings)
"""
import pytest
from datetime import date

from app.services.utility_service import UtilityService
from app.schemas.utility import UtilityReadingCreate, UtilityReadingUpdate


class TestUtilityService:
    """水电读数服务测试类"""

    @pytest.fixture
    def utility_service(self, db_session):
        """创建水电服务实例"""
        return UtilityService(db_session)

    # ==================== create_reading 测试 ====================

    def test_create_reading_without_previous(self, utility_service, test_organization, test_room):
        """测试：首次录入（无上期读数）"""
        # Arrange
        data = UtilityReadingCreate(
            room_id=test_room.id,
            period_year=2024,
            period_month=1,
            reading_date=date(2024, 1, 15),
            water_reading=100.0,
            electricity_reading=200.0,
        )

        # Act
        reading = utility_service.create_reading(test_organization.id, data)

        # Assert
        assert reading.id is not None
        assert reading.room_id == test_room.id
        assert reading.period_year == 2024
        assert reading.period_month == 1
        assert reading.water_reading == 100.0
        assert reading.electricity_reading == 200.0
        assert reading.water_previous is None  # 首次录入无上期读数
        assert reading.electricity_previous is None

    def test_create_reading_with_previous(self, utility_service, test_organization, test_room, test_utility_reading):
        """测试：后续录入自动获取上期读数"""
        # Arrange - test_utility_reading 是 2024年1月的读数
        data = UtilityReadingCreate(
            room_id=test_room.id,
            period_year=2024,
            period_month=2,
            reading_date=date(2024, 2, 15),
            water_reading=110.0,
            electricity_reading=220.0,
        )

        # Act
        reading = utility_service.create_reading(test_organization.id, data)

        # Assert
        assert reading.water_previous == test_utility_reading.water_reading  # 100.0
        assert reading.electricity_previous == test_utility_reading.electricity_reading  # 200.0

    def test_create_reading_cross_year(self, utility_service, test_organization, test_room, test_utility_reading):
        """测试：跨年读数自动获取上期读数"""
        # Arrange
        data = UtilityReadingCreate(
            room_id=test_room.id,
            period_year=2025,
            period_month=1,
            reading_date=date(2025, 1, 15),
            water_reading=150.0,
            electricity_reading=300.0,
        )

        # Act
        reading = utility_service.create_reading(test_organization.id, data)

        # Assert - 上期是2024年1月
        assert reading.water_previous == test_utility_reading.water_reading
        assert reading.electricity_previous == test_utility_reading.electricity_reading

    # ==================== batch_create_readings 测试 ====================

    def test_batch_create_readings_creates_multiple(
        self, utility_service, test_organization, test_lease, db_session
    ):
        """测试：批量创建多个读数"""
        # Arrange
        room = test_lease.room
        readings_data = [
            {
                "room_id": room.id,
                "water_reading": 100.0,
                "electricity_reading": 200.0,
            },
        ]

        # Act
        created = utility_service.batch_create_readings(
            org_id=test_organization.id,
            period_year=2024,
            period_month=3,
            reading_date=date(2024, 3, 15),
            readings=readings_data,
        )

        # Assert
        assert len(created) == 1
        assert created[0].period_year == 2024
        assert created[0].period_month == 3

    def test_batch_create_readings_skips_invalid_data(
        self, utility_service, test_organization, test_room
    ):
        """测试：批量创建跳过无效数据"""
        # Arrange - 使用缺失必要字段的数据
        readings_data = [
            {
                "room_id": test_room.id,
                "water_reading": 100.0,
                "electricity_reading": 200.0,
            },
            {
                # 缺少 room_id，会导致 Pydantic 验证失败
                "water_reading": 50.0,
            },
        ]

        # Act
        created = utility_service.batch_create_readings(
            org_id=test_organization.id,
            period_year=2024,
            period_month=4,
            reading_date=date(2024, 4, 15),
            readings=readings_data,
        )

        # Assert - 只有第一个读数成功创建
        assert len(created) == 1
        assert created[0].room_id == test_room.id

    # ==================== update_reading 测试 ====================

    def test_update_reading_updates_values(
        self, utility_service, test_organization, test_utility_reading
    ):
        """测试：更新读数成功"""
        # Arrange
        update_data = UtilityReadingUpdate(
            water_reading=105.0,
            electricity_reading=210.0,
        )

        # Act
        updated = utility_service.update_reading(
            test_utility_reading.id, test_organization.id, update_data
        )

        # Assert
        assert updated is not None
        assert updated.water_reading == 105.0
        assert updated.electricity_reading == 210.0

    def test_update_reading_returns_none_for_nonexistent(
        self, utility_service, test_organization
    ):
        """测试：更新不存在的读数返回 None"""
        # Arrange
        update_data = UtilityReadingUpdate(water_reading=100.0)

        # Act
        result = utility_service.update_reading(99999, test_organization.id, update_data)

        # Assert
        assert result is None

    # ==================== delete_reading 测试 ====================

    def test_delete_reading_removes_reading(
        self, utility_service, test_organization, test_utility_reading
    ):
        """测试：删除读数成功"""
        # Act
        result = utility_service.delete_reading(
            test_utility_reading.id, test_organization.id
        )

        # Assert
        assert result is True
        assert utility_service.get_reading(test_utility_reading.id, test_organization.id) is None

    def test_delete_reading_returns_false_for_nonexistent(
        self, utility_service, test_organization
    ):
        """测试：删除不存在的读数返回 False"""
        # Act
        result = utility_service.delete_reading(99999, test_organization.id)

        # Assert
        assert result is False

    def test_delete_reading_denies_other_organization(
        self, utility_service, test_utility_reading, db_session, test_user
    ):
        """测试：组织隔离 - 不能删除其他组织的读数"""
        # Arrange - 创建另一个组织
        from app.models.organization import Organization, OrganizationMember, MemberRole

        other_org = Organization(name="其他组织", slug="other-org")
        db_session.add(other_org)
        db_session.commit()
        db_session.refresh(other_org)

        # Act - 尝试用其他组织 ID 删除
        result = utility_service.delete_reading(test_utility_reading.id, other_org.id)

        # Assert
        assert result is False

    # ==================== list_readings 测试 ====================

    def test_list_readings_filters_by_period(
        self, utility_service, test_organization, test_room, test_utility_reading, db_session
    ):
        """测试：按年月过滤读数"""
        # Arrange - 创建另一个月份的读数
        from app.models.utility import UtilityReading

        another_reading = UtilityReading(
            room_id=test_room.id,
            period_year=2024,
            period_month=2,
            reading_date=date(2024, 2, 15),
            water_reading=110.0,
            electricity_reading=220.0,
        )
        db_session.add(another_reading)
        db_session.commit()

        # Act
        jan_readings = utility_service.list_readings(
            test_organization.id, period_year=2024, period_month=1
        )

        # Assert
        assert len(jan_readings) == 1
        assert jan_readings[0].period_month == 1

    def test_list_readings_filters_by_room(
        self, utility_service, test_organization, test_room, test_utility_reading, db_session
    ):
        """测试：按房间过滤读数"""
        # Arrange - 创建另一个房间的读数
        from app.models.apartment import Room, RoomStatus
        from app.models.utility import UtilityReading

        another_room = Room(
            apartment_id=test_room.apartment_id,
            room_number="102",
            monthly_rent=1500.0,
            status=RoomStatus.AVAILABLE,
        )
        db_session.add(another_room)
        db_session.flush()

        another_reading = UtilityReading(
            room_id=another_room.id,
            period_year=2024,
            period_month=1,
            reading_date=date(2024, 1, 15),
            water_reading=50.0,
            electricity_reading=100.0,
        )
        db_session.add(another_reading)
        db_session.commit()

        # Act
        room_readings = utility_service.list_readings(
            test_organization.id, room_id=test_room.id
        )

        # Assert
        assert len(room_readings) == 1
        assert room_readings[0].room_id == test_room.id

    # ==================== get_reading 测试 ====================

    def test_get_reading_returns_reading(
        self, utility_service, test_organization, test_utility_reading
    ):
        """测试：获取读数成功"""
        # Act
        reading = utility_service.get_reading(
            test_utility_reading.id, test_organization.id
        )

        # Assert
        assert reading is not None
        assert reading.id == test_utility_reading.id

    def test_get_reading_returns_none_for_other_org(
        self, utility_service, test_utility_reading, db_session
    ):
        """测试：组织隔离 - 不能获取其他组织的读数"""
        # Arrange
        from app.models.organization import Organization

        other_org = Organization(name="其他组织", slug="other-org-2")
        db_session.add(other_org)
        db_session.commit()

        # Act
        reading = utility_service.get_reading(test_utility_reading.id, other_org.id)

        # Assert
        assert reading is None
