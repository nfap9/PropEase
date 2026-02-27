"""
Utility reading repository for data access operations.
"""
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.repositories.base import BaseRepository
from app.models.utility import UtilityReading
from app.models.apartment import Room, Apartment
from app.models.lease import Lease
from app.models.tenant import Tenant


class UtilityRepository(BaseRepository[UtilityReading]):
    """Repository for UtilityReading model."""

    def __init__(self, db: Session):
        super().__init__(db, UtilityReading)

    def find_by_organization(
        self,
        org_id: int,
        room_id: Optional[int] = None,
        period_year: Optional[int] = None,
        period_month: Optional[int] = None,
    ) -> List[UtilityReading]:
        """Find all readings in an organization."""
        query = (
            self.db.query(UtilityReading)
            .options(joinedload(UtilityReading.room).joinedload(Room.apartment))
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
        )
        if room_id:
            query = query.filter(UtilityReading.room_id == room_id)
        if period_year:
            query = query.filter(UtilityReading.period_year == period_year)
        if period_month:
            query = query.filter(UtilityReading.period_month == period_month)
        return query.order_by(
            UtilityReading.period_year.desc(),
            UtilityReading.period_month.desc(),
            UtilityReading.reading_date.desc(),
        ).all()

    def find_latest_by_room(
        self, room_id: int, before_year: int, before_month: int
    ) -> Optional[UtilityReading]:
        """Find latest reading for a room before a given period."""
        return (
            self.db.query(UtilityReading)
            .filter(
                UtilityReading.room_id == room_id,
                (UtilityReading.period_year < before_year)
                | (
                    (UtilityReading.period_year == before_year)
                    & (UtilityReading.period_month < before_month)
                ),
            )
            .order_by(UtilityReading.period_year.desc(), UtilityReading.period_month.desc())
            .first()
        )

    def find_by_room_and_period(
        self, room_id: int, year: int, month: int
    ) -> Optional[UtilityReading]:
        """Find utility reading for a specific room and period."""
        return (
            self.db.query(UtilityReading)
            .filter(
                UtilityReading.room_id == room_id,
                UtilityReading.period_year == year,
                UtilityReading.period_month == month,
            )
            .first()
        )

    def find_rooms_for_export(
        self,
        org_id: int,
        period_year: int,
        period_month: int,
        days_range: Optional[int] = None,
        current_date: Optional[date] = None,
    ) -> List[dict]:
        """
        查询应出账单的房间列表（用于导出水电模板）。

        Args:
            org_id: 组织ID
            period_year: 账单年份
            period_month: 账单月份
            days_range: 时间范围（天数），None 表示全部
            current_date: 当前日期，用于计算时间范围

        Returns:
            待录入水电的房间列表
        """
        if current_date is None:
            current_date = date.today()

        # 查询活跃租约
        query = (
            self.db.query(Lease)
            .options(
                joinedload(Lease.room).joinedload(Room.apartment),
                joinedload(Lease.tenant),
            )
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Lease.is_active == True,
            )
        )

        # 如果指定了时间范围，筛选账单日在范围内的租约
        if days_range is not None:
            current_day = current_date.day
            days_in_current_month = (
                date(period_year, period_month + 1, 1) - date(period_year, period_month, 1)
            ).days if period_month < 12 else 31

            # 计算时间范围内的账单日列表
            billing_days = []
            for i in range(days_range):
                target_day = current_day + i
                # 处理跨月情况
                if target_day > days_in_current_month:
                    target_day = target_day - days_in_current_month
                billing_days.append(target_day)

            query = query.filter(Lease.billing_day.in_(billing_days))

        leases = query.all()

        # 构建返回结果
        result = []
        for lease in leases:
            # 检查是否已录入本月水电
            existing_reading = self.find_by_room_and_period(
                lease.room_id, period_year, period_month
            )
            if existing_reading:
                continue  # 跳过已录入的

            # 获取上期读数
            latest_reading = self.find_latest_by_room(
                lease.room_id, period_year, period_month
            )

            result.append({
                "room_id": lease.room_id,
                "apartment_name": lease.room.apartment.name if lease.room.apartment else "",
                "room_number": lease.room.room_number,
                "tenant_name": lease.tenant.name if lease.tenant else "",
                "billing_day": lease.billing_day,
                "water_previous": latest_reading.water_reading if latest_reading else None,
                "electricity_previous": latest_reading.electricity_reading if latest_reading else None,
            })

        # 按账单日排序
        result.sort(key=lambda x: x["billing_day"])
        return result
