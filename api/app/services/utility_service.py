"""
Utility service for utility reading management.
"""
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.utility_repository import UtilityRepository
from app.repositories.apartment_repository import RoomRepository
from app.models.utility import UtilityReading
from app.schemas.utility import (
    UtilityReadingCreate,
    UtilityReadingUpdate,
    UtilityExportRoom,
)


class UtilityService(BaseService):
    """Service for utility reading management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.utility_repo = UtilityRepository(db)
        self.room_repo = RoomRepository(db)

    def list_readings(
        self,
        org_id: int,
        room_id: Optional[int] = None,
        period_year: Optional[int] = None,
        period_month: Optional[int] = None,
    ) -> List[UtilityReading]:
        """List utility readings in organization."""
        return self.utility_repo.find_by_organization(org_id, room_id, period_year, period_month)

    def get_reading(self, reading_id: int, org_id: int) -> Optional[UtilityReading]:
        """Get a reading by ID within organization."""
        reading = self.utility_repo.get(reading_id)
        if reading and reading.room.apartment.organization_id == org_id:
            return reading
        return None

    def create_reading(self, org_id: int, data: UtilityReadingCreate) -> UtilityReading:
        """Create a new utility reading."""
        # Get previous reading for the room
        previous = self.utility_repo.find_latest_by_room(data.room_id, data.period_year, data.period_month)

        reading = UtilityReading(
            room_id=data.room_id,
            period_year=data.period_year,
            period_month=data.period_month,
            reading_date=data.reading_date,
            water_reading=data.water_reading,
            water_previous=previous.water_reading if previous else None,
            electricity_reading=data.electricity_reading,
            electricity_previous=previous.electricity_reading if previous else None,
            notes=data.notes,
        )
        return self.utility_repo.create(reading)

    def batch_create_readings(
        self,
        org_id: int,
        period_year: int,
        period_month: int,
        reading_date: date,
        readings: list[dict],
    ) -> List[UtilityReading]:
        """Batch create utility readings."""
        created = []
        for reading_data in readings:
            try:
                data = UtilityReadingCreate(
                    room_id=reading_data["room_id"],
                    period_year=period_year,
                    period_month=period_month,
                    reading_date=reading_date,
                    water_reading=reading_data.get("water_reading"),
                    electricity_reading=reading_data.get("electricity_reading"),
                    notes=reading_data.get("notes"),
                )
                reading = self.create_reading(org_id, data)
                created.append(reading)
            except Exception:
                continue

        return created

    def update_reading(
        self, reading_id: int, org_id: int, data: UtilityReadingUpdate
    ) -> Optional[UtilityReading]:
        """Update a utility reading."""
        reading = self.get_reading(reading_id, org_id)
        if not reading:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return self.utility_repo.update(reading_id, **update_data)

    def delete_reading(self, reading_id: int, org_id: int) -> bool:
        """Delete a utility reading."""
        reading = self.get_reading(reading_id, org_id)
        if not reading:
            return False
        return self.utility_repo.delete(reading_id)

    def export_rooms_for_reading(
        self,
        org_id: int,
        period_year: int,
        period_month: int,
        days_range: Optional[int] = None,
    ) -> List[UtilityExportRoom]:
        """
        导出待录入水电的房间列表。

        Args:
            org_id: 组织ID
            period_year: 账单年份
            period_month: 账单月份
            days_range: 时间范围（天数），None 表示全部

        Returns:
            待录入水电的房间列表
        """
        rooms_data = self.utility_repo.find_rooms_for_export(
            org_id=org_id,
            period_year=period_year,
            period_month=period_month,
            days_range=days_range,
            current_date=date.today(),
        )
        return [UtilityExportRoom(**data) for data in rooms_data]
