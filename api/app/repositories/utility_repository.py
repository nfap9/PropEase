"""
Utility reading repository for data access operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.utility import UtilityReading
from app.models.apartment import Room, Apartment


class UtilityRepository(BaseRepository[UtilityReading]):
    """Repository for UtilityReading model."""

    def __init__(self, db: Session):
        super().__init__(db, UtilityReading)

    def find_by_organization(
        self, org_id: int, room_id: Optional[int] = None
    ) -> List[UtilityReading]:
        """Find all readings in an organization."""
        query = (
            self.db.query(UtilityReading)
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
        )
        if room_id:
            query = query.filter(UtilityReading.room_id == room_id)
        return query.all()

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
