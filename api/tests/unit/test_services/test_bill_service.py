"""
账单服务单元测试。

测试覆盖：
- 账单生成 (generate_bills)
- 支付记录 (record_payment)
- 账单更新 (update_bill)
- 账单创建 (create_bill)
- 账单删除 (delete_bill)
- 水电费用计算 (_calculate_water_cost, _calculate_electricity_cost)
"""
import pytest
from datetime import date
from decimal import Decimal

from app.services.bill_service import BillService
from app.models.bill import Bill, BillStatus, Payment, PaymentMethod
from app.schemas.bill import BillCreate, BillUpdate, PaymentCreate, GenerateBillsRequest


class TestBillService:
    """账单服务测试类"""

    @pytest.fixture
    def bill_service(self, db_session):
        """创建账单服务实例"""
        return BillService(db_session)

    # ==================== generate_bills 测试 ====================

    def test_generate_bills_creates_bills_for_active_leases(
        self, bill_service, test_organization, test_lease, test_utility_reading
    ):
        """测试：为活跃租约生成账单"""
        # Arrange
        request = GenerateBillsRequest(
            bill_year=2024,
            bill_month=1,
            due_date=date(2024, 1, 10),
        )

        # Act
        result = bill_service.generate_bills(test_organization.id, request)

        # Assert
        assert result["created"] == 1
        assert result["skipped"] == 0

        # 验证账单已创建
        bills = bill_service.list_bills(test_organization.id)
        assert len(bills) == 1
        bill = bills[0]
        assert bill.lease_id == test_lease.id
        assert bill.bill_year == 2024
        assert bill.bill_month == 1
        assert bill.rent_amount == Decimal("2000.0")
        assert bill.status == BillStatus.PENDING

    def test_generate_bills_skips_existing_bills(
        self, bill_service, test_organization, test_lease, test_bill
    ):
        """测试：跳过已存在的账单"""
        # Arrange - test_bill 已存在 2024年1月
        request = GenerateBillsRequest(
            bill_year=2024,
            bill_month=1,
            due_date=date(2024, 1, 10),
        )

        # Act
        result = bill_service.generate_bills(test_organization.id, request)

        # Assert
        assert result["created"] == 0
        assert result["skipped"] == 1

    def test_generate_bills_filters_by_lease_ids(
        self, bill_service, test_organization, test_lease, db_session
    ):
        """测试：按租约 ID 过滤生成账单"""
        # Arrange - 创建另一个租约
        from app.models.apartment import Room, RoomStatus
        from app.models.tenant import Tenant
        from app.models.lease import Lease

        another_room = Room(
            apartment_id=test_lease.room.apartment_id,
            room_number="102",
            monthly_rent=1500.0,
            status=RoomStatus.OCCUPIED,
        )
        db_session.add(another_room)
        db_session.flush()

        another_tenant = Tenant(
            organization_id=test_organization.id,
            name="李四",
            phone="13900139000",
        )
        db_session.add(another_tenant)
        db_session.flush()

        another_lease = Lease(
            room_id=another_room.id,
            tenant_id=another_tenant.id,
            start_date=date(2024, 1, 1),
            billing_day=1,
            monthly_rent=1500.0,
            water_rate=4.0,
            electricity_rate=0.8,
            is_active=True,
        )
        db_session.add(another_lease)
        db_session.commit()

        request = GenerateBillsRequest(
            bill_year=2024,
            bill_month=2,
            due_date=date(2024, 2, 10),
            lease_ids=[test_lease.id],  # 只为第一个租约生成
        )

        # Act
        result = bill_service.generate_bills(test_organization.id, request)

        # Assert
        assert result["created"] == 1
        bills = bill_service.list_bills(test_organization.id)
        assert len(bills) == 1
        assert bills[0].lease_id == test_lease.id

    def test_generate_bills_calculates_utility_costs(
        self, bill_service, test_organization, test_lease, test_utility_reading
    ):
        """测试：账单生成时正确计算水电费用"""
        # Arrange
        # test_utility_reading: water=100, prev=90, usage=10
        # test_lease: water_rate=5.0, expected_water_cost=50
        # electricity=200, prev=180, usage=20
        # test_lease: electricity_rate=1.0, expected_electricity_cost=20
        request = GenerateBillsRequest(
            bill_year=2024,
            bill_month=1,
            due_date=date(2024, 1, 10),
        )

        # Act
        result = bill_service.generate_bills(test_organization.id, request)

        # Assert
        bills = bill_service.list_bills(test_organization.id)
        bill = bills[0]
        assert bill.water_amount == Decimal("50.0")  # 10 * 5.0
        assert bill.electricity_amount == Decimal("20.0")  # 20 * 1.0
        assert bill.total_amount == Decimal("2070.0")  # 2000 + 50 + 20

    def test_generate_bills_zero_utility_cost_without_reading(
        self, bill_service, test_organization, test_lease
    ):
        """测试：无水电读数时费用为 0"""
        # Arrange
        request = GenerateBillsRequest(
            bill_year=2024,
            bill_month=2,  # 没有2月的水电读数
            due_date=date(2024, 2, 10),
        )

        # Act
        result = bill_service.generate_bills(test_organization.id, request)

        # Assert
        bills = bill_service.list_bills(test_organization.id)
        bill = bills[0]
        assert bill.water_amount == Decimal("0")
        assert bill.electricity_amount == Decimal("0")
        assert bill.total_amount == Decimal("2000.0")  # 仅租金

    # ==================== record_payment 测试 ====================

    def test_record_payment_creates_payment(self, bill_service, test_bill):
        """测试：成功记录支付"""
        # Arrange
        payment_data = PaymentCreate(
            amount=Decimal("1000.0"),
            payment_date=date(2024, 1, 5),
            payment_method=PaymentMethod.WECHAT,
        )

        # Act
        payment = bill_service.record_payment(test_bill.id, payment_data)

        # Assert
        assert payment.id is not None
        assert payment.amount == Decimal("1000.0")
        assert payment.payment_method == PaymentMethod.WECHAT

    def test_record_payment_updates_bill_status_to_partial(
        self, bill_service, test_bill
    ):
        """测试：部分支付后状态变为 PARTIAL"""
        # Arrange
        payment_data = PaymentCreate(
            amount=Decimal("1000.0"),  # 部分支付
            payment_date=date(2024, 1, 5),
            payment_method=PaymentMethod.WECHAT,
        )

        # Act
        bill_service.record_payment(test_bill.id, payment_data)

        # Assert
        bill_service.bill_repo.db.refresh(test_bill)
        assert test_bill.paid_amount == Decimal("1000.0")
        assert test_bill.status == BillStatus.PARTIAL

    def test_record_payment_updates_bill_status_to_paid(
        self, bill_service, test_bill
    ):
        """测试：全额支付后状态变为 PAID"""
        # Arrange
        payment_data = PaymentCreate(
            amount=Decimal("2070.0"),  # 全额支付
            payment_date=date(2024, 1, 5),
            payment_method=PaymentMethod.WECHAT,
        )

        # Act
        bill_service.record_payment(test_bill.id, payment_data)

        # Assert
        bill_service.bill_repo.db.refresh(test_bill)
        assert test_bill.paid_amount == Decimal("2070.0")
        assert test_bill.status == BillStatus.PAID

    def test_record_payment_rejects_nonexistent_bill(self, bill_service):
        """测试：拒绝为不存在的账单记录支付"""
        # Arrange
        payment_data = PaymentCreate(
            amount=Decimal("100.0"),
            payment_date=date(2024, 1, 5),
            payment_method=PaymentMethod.CASH,
        )

        # Act & Assert
        with pytest.raises(ValueError, match="Bill not found"):
            bill_service.record_payment(99999, payment_data)

    # ==================== update_bill 测试 ====================

    def test_update_bill_updates_amounts(self, bill_service, test_bill, test_organization):
        """测试：更新账单金额"""
        # Arrange - 使用 float 而非 Decimal，因为 schema 定义为 float
        update_data = BillUpdate(
            rent_amount=2200.0,
            water_amount=60.0,
        )

        # Act
        updated_bill = bill_service.update_bill(
            test_bill.id, test_organization.id, update_data
        )

        # Assert
        assert updated_bill.rent_amount == 2200.0
        assert updated_bill.water_amount == 60.0
        # 总金额应该重新计算 (2200 + 60 + 20 + 0 = 2280)
        assert updated_bill.total_amount == 2280.0

    def test_update_bill_raises_for_nonexistent(self, bill_service, test_organization):
        """测试：更新不存在的账单抛出异常"""
        # Arrange
        update_data = BillUpdate(rent_amount=Decimal("2000.0"))

        # Act & Assert
        with pytest.raises(ValueError, match="Bill not found"):
            bill_service.update_bill(99999, test_organization.id, update_data)

    # ==================== create_bill 测试 ====================

    def test_create_bill_creates_manual_bill(
        self, bill_service, test_organization, test_lease
    ):
        """测试：手动创建账单"""
        # Arrange
        bill_data = BillCreate(
            lease_id=test_lease.id,
            bill_year=2024,
            bill_month=3,
            due_date=date(2024, 3, 10),
            rent_amount=Decimal("2000.0"),
            water_amount=Decimal("40.0"),
            electricity_amount=Decimal("30.0"),
            other_amount=Decimal("10.0"),
        )

        # Act
        bill = bill_service.create_bill(test_organization.id, bill_data)

        # Assert
        assert bill.id is not None
        assert bill.lease_id == test_lease.id
        assert bill.bill_year == 2024
        assert bill.bill_month == 3
        assert bill.total_amount == Decimal("2080.0")  # 2000 + 40 + 30 + 10
        assert bill.status == BillStatus.PENDING

    def test_create_bill_calculates_total_correctly(
        self, bill_service, test_organization, test_lease
    ):
        """测试：创建账单时正确计算总金额"""
        # Arrange - schema 中 other_amount 默认为 0
        bill_data = BillCreate(
            lease_id=test_lease.id,
            bill_year=2024,
            bill_month=4,
            due_date=date(2024, 4, 10),
            rent_amount=1500.0,
            water_amount=25.0,
            electricity_amount=15.0,
            other_amount=0.0,  # 使用 0 而非 None
        )

        # Act
        bill = bill_service.create_bill(test_organization.id, bill_data)

        # Assert
        assert bill.total_amount == 1540.0  # 1500 + 25 + 15 + 0

    # ==================== delete_bill 测试 ====================

    def test_delete_bill_removes_unpaid_bill(
        self, bill_service, test_bill, test_organization
    ):
        """测试：删除无支付的账单"""
        # Act
        result = bill_service.delete_bill(test_bill.id, test_organization.id)

        # Assert
        assert result is True
        assert bill_service.get_bill(test_bill.id, test_organization.id) is None

    def test_delete_bill_rejects_bill_with_payments(
        self, bill_service, test_bill, test_payment, test_organization
    ):
        """测试：拒绝删除有支付记录的账单"""
        # Act & Assert
        with pytest.raises(ValueError, match="Cannot delete bill with payments"):
            bill_service.delete_bill(test_bill.id, test_organization.id)

    def test_delete_bill_raises_for_nonexistent(self, bill_service, test_organization):
        """测试：删除不存在的账单抛出异常"""
        # Act & Assert
        with pytest.raises(ValueError, match="Bill not found"):
            bill_service.delete_bill(99999, test_organization.id)

    # ==================== 水电费用计算测试 ====================

    def test_calculate_water_cost_with_reading(self, bill_service, test_lease, test_utility_reading):
        """测试：有读数时计算水费"""
        # Arrange - usage = 100 - 90 = 10, rate = 5.0
        # Act
        cost = bill_service._calculate_water_cost(test_lease, test_utility_reading)

        # Assert
        assert cost == Decimal("50.0")

    def test_calculate_water_cost_without_reading(self, bill_service, test_lease):
        """测试：无读数时水费为 0"""
        # Act
        cost = bill_service._calculate_water_cost(test_lease, None)

        # Assert
        assert cost == Decimal("0")

    def test_calculate_water_cost_without_rate(self, bill_service, test_lease, test_utility_reading, db_session):
        """测试：无费率时水费为 0"""
        # Arrange
        test_lease.water_rate = 0
        db_session.commit()

        # Act
        cost = bill_service._calculate_water_cost(test_lease, test_utility_reading)

        # Assert
        assert cost == Decimal("0")

    def test_calculate_electricity_cost_with_reading(self, bill_service, test_lease, test_utility_reading):
        """测试：有读数时计算电费"""
        # Arrange - usage = 200 - 180 = 20, rate = 1.0
        # Act
        cost = bill_service._calculate_electricity_cost(test_lease, test_utility_reading)

        # Assert
        assert cost == Decimal("20.0")

    def test_calculate_electricity_cost_without_reading(self, bill_service, test_lease):
        """测试：无读数时电费为 0"""
        # Act
        cost = bill_service._calculate_electricity_cost(test_lease, None)

        # Assert
        assert cost == Decimal("0")

    # ==================== list_bills 测试 ====================

    def test_list_bills_filters_by_status(
        self, bill_service, test_organization, test_bill, test_lease, db_session
    ):
        """测试：按状态过滤账单"""
        # Arrange - 创建一个已支付的账单
        paid_bill = Bill(
            lease_id=test_lease.id,
            bill_year=2024,
            bill_month=2,
            due_date=date(2024, 2, 10),
            rent_amount=Decimal("2000.0"),
            total_amount=Decimal("2000.0"),
            paid_amount=Decimal("2000.0"),
            status=BillStatus.PAID,
        )
        db_session.add(paid_bill)
        db_session.commit()

        # Act
        pending_bills = bill_service.list_bills(
            test_organization.id, status=BillStatus.PENDING
        )
        paid_bills = bill_service.list_bills(
            test_organization.id, status=BillStatus.PAID
        )

        # Assert
        assert len(pending_bills) == 1
        assert pending_bills[0].id == test_bill.id
        assert len(paid_bills) == 1
        assert paid_bills[0].id == paid_bill.id

    def test_list_bills_filters_by_year_month(
        self, bill_service, test_organization, test_bill, test_lease, db_session
    ):
        """测试：按年月过滤账单"""
        # Arrange - 创建另一个月份的账单
        feb_bill = Bill(
            lease_id=test_lease.id,
            bill_year=2024,
            bill_month=2,
            due_date=date(2024, 2, 10),
            rent_amount=Decimal("2000.0"),
            total_amount=Decimal("2000.0"),
            status=BillStatus.PENDING,
        )
        db_session.add(feb_bill)
        db_session.commit()

        # Act
        jan_bills = bill_service.list_bills(
            test_organization.id, year=2024, month=1
        )

        # Assert
        assert len(jan_bills) == 1
        assert jan_bills[0].bill_month == 1

    # ==================== get_bill_payments 测试 ====================

    def test_get_bill_payments_returns_payments(
        self, bill_service, test_bill, test_payment
    ):
        """测试：获取账单的支付记录"""
        # Act
        payments = bill_service.get_bill_payments(test_bill.id)

        # Assert
        assert len(payments) == 1
        assert payments[0].id == test_payment.id
        assert payments[0].amount == Decimal("1000.0")

    def test_get_bill_payments_returns_empty_for_no_payments(
        self, bill_service, test_bill
    ):
        """测试：无支付记录时返回空列表"""
        # Act
        payments = bill_service.get_bill_payments(test_bill.id)

        # Assert
        assert payments == []
