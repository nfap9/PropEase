"""
Apartment and Room repository for data access operations.
"""


from sqlalchemy.orm import Session

from app.models.apartment import Apartment, Room, RoomStatus
from app.repositories.base import BaseRepository


class ApartmentRepository(BaseRepository[Apartment]):
    """Repository for Apartment model."""

    def __init__(self, db: Session):
        super().__init__(db, Apartment)

    def find_by_organization(self, org_id: str) -> list[Apartment]:
        """Find all apartments in an organization."""
        return self.db.query(Apartment).filter(Apartment.organization_id == org_id).all()


class RoomRepository(BaseRepository[Room]):
    """Repository for Room model."""

    def __init__(self, db: Session):
        super().__init__(db, Room)

    def find_by_apartment(self, apartment_id: str) -> list[Room]:
        """Find all rooms in an apartment."""
        return self.db.query(Room).filter(Room.apartment_id == apartment_id).all()

    def find_by_organization(self, org_id: str) -> list[Room]:
        """Find all rooms in an organization."""
        return self.db.query(Room).join(Apartment).filter(Apartment.organization_id == org_id).all()

    def find_by_status(self, org_id: str, status: RoomStatus) -> list[Room]:
        """Find rooms by status in an organization."""
        return (
            self.db.query(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Room.status == status,
            )
            .all()
        )

    def count_by_status(self, org_id: str, status: RoomStatus) -> int:
        """Count rooms by status in an organization."""
        return (
            self.db.query(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Room.status == status,
            )
            .count()
        )

    def update_status(self, room_id: str, status: RoomStatus) -> Room | None:
        """Update room status."""
        return self.update(room_id, status=status)
