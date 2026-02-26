"""
租约仓储单元测试。

测试覆盖：
- 根据组织查找租约
- 根据房间查找活跃租约
- 租约日期重叠检测
"""
import pytest
from datetime import date, timedelta

from app.repositories.lease_repository import LeaseRepository
from app.models.lease import Lease


class TestLeaseRepository:
    """租约仓储测试类"""

    @pytest.fixture
    def lease_repo(self, db_session):
        """创建租约仓储实例"""
        return LeaseRepository(db_session)

    def test_find_by_organization_returns_leases(
        self, db_session, lease_repo, test_room, test_tenant, test_organization
    ):
        """测试：根据组织ID查找租约"""
        # Arrange - 创建租约
        lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        db_session.add(lease)
        db_session.commit()

        # Act
        leases = lease_repo.find_by_organization(test_organization.id)

        # Assert
        assert len(leases) == 1
        assert leases[0].id == lease.id

    def test_find_by_organization_returns_empty_for_no_leases(
        self, lease_repo, test_organization
    ):
        """测试：组织没有租约时返回空列表"""
        # Act
        leases = lease_repo.find_by_organization(test_organization.id)

        # Assert
        assert leases == []

    def test_find_active_by_organization_returns_only_active(
        self, db_session, lease_repo, test_room, test_tenant, test_organization
    ):
        """测试：只返回活跃租约"""
        # Arrange - 创建活跃和非活跃租约
        active_lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        inactive_lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today() - timedelta(days=730),
            end_date=date.today() - timedelta(days=365),
            monthly_rent=1800.0,
            deposit=3600.0,
            is_active=False,
        )
        db_session.add_all([active_lease, inactive_lease])
        db_session.commit()

        # Act
        leases = lease_repo.find_active_by_organization(test_organization.id)

        # Assert
        assert len(leases) == 1
        assert leases[0].is_active is True

    def test_find_active_by_room_returns_active_lease(
        self, db_session, lease_repo, test_room, test_tenant
    ):
        """测试：根据房间查找活跃租约"""
        # Arrange
        lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        db_session.add(lease)
        db_session.commit()

        # Act
        result = lease_repo.find_active_by_room(test_room.id)

        # Assert
        assert result is not None
        assert result.id == lease.id
        assert result.is_active is True

    def test_find_active_by_room_returns_none_for_inactive(
        self, db_session, lease_repo, test_room, test_tenant
    ):
        """测试：房间没有活跃租约时返回 None"""
        # Arrange
        lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today() - timedelta(days=365),
            end_date=date.today() - timedelta(days=1),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=False,
        )
        db_session.add(lease)
        db_session.commit()

        # Act
        result = lease_repo.find_active_by_room(test_room.id)

        # Assert
        assert result is None

    def test_has_overlapping_lease_detects_conflict(
        self, db_session, lease_repo, test_room, test_tenant
    ):
        """测试：检测日期重叠 - 存在重叠"""
        # Arrange - 创建现有租约
        existing_lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        db_session.add(existing_lease)
        db_session.commit()

        # Act - 检查重叠日期（在现有租约中间）
        has_overlap = lease_repo.has_overlapping_lease(
            test_room.id,
            date.today() + timedelta(days=180),
            date.today() + timedelta(days=545),
        )

        # Assert
        assert has_overlap is True

    def test_has_overlapping_lease_no_conflict(
        self, db_session, lease_repo, test_room, test_tenant
    ):
        """测试：检测日期重叠 - 无重叠"""
        # Arrange - 创建现有租约
        existing_lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        db_session.add(existing_lease)
        db_session.commit()

        # Act - 检查不重叠的日期（在现有租约结束后）
        has_overlap = lease_repo.has_overlapping_lease(
            test_room.id,
            date.today() + timedelta(days=400),
            date.today() + timedelta(days=765),
        )

        # Assert
        assert has_overlap is False

    def test_has_overlapping_lease_excludes_self(
        self, db_session, lease_repo, test_room, test_tenant
    ):
        """测试：更新租约时排除自身"""
        # Arrange
        lease = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        db_session.add(lease)
        db_session.commit()

        # Act - 检查相同日期但排除自身
        has_overlap = lease_repo.has_overlapping_lease(
            test_room.id,
            date.today(),
            date.today() + timedelta(days=365),
            exclude_id=lease.id,
        )

        # Assert - 排除自身后不应有重叠
        assert has_overlap is False

    def test_count_active_returns_correct_count(
        self, db_session, lease_repo, test_room, test_tenant, test_organization
    ):
        """测试：统计活跃租约数量"""
        # Arrange - 创建多个租约
        active_lease1 = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            monthly_rent=2000.0,
            deposit=4000.0,
            is_active=True,
        )
        active_lease2 = Lease(
            room_id=test_room.id,
            tenant_id=test_tenant.id,
            start_date=date.today() + timedelta(days=400),
            end_date=date.today() + timedelta(days=765),
            monthly_rent=2100.0,
            deposit=4200.0,
            is_active=True,
        )
        db_session.add_all([active_lease1, active_lease2])
        db_session.commit()

        # Act
        count = lease_repo.count_active(test_organization.id)

        # Assert
        assert count == 2
