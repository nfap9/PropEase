"""
Apartment service for apartment and room management.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.apartment_repository import ApartmentRepository, RoomRepository
from app.repositories.organization_repository import OrganizationMemberRepository
from app.models.apartment import Apartment, Room, RoomStatus
from app.schemas.apartment import ApartmentCreate, ApartmentUpdate, RoomCreate, RoomUpdate, RoomBatchCreate


class ApartmentService(BaseService):
    """Service for apartment management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.apartment_repo = ApartmentRepository(db)
        self.room_repo = RoomRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    def list_apartments(self, org_id: int) -> List[Apartment]:
        """List all apartments in an organization."""
        return self.apartment_repo.find_by_organization(org_id)

    def list_apartments_with_stats(self, org_id: int) -> List[Dict[str, Any]]:
        """List all apartments with room statistics."""
        apartments = self.apartment_repo.find_by_organization(org_id)
        result = []
        for apartment in apartments:
            rooms = self.room_repo.find_by_apartment(apartment.id)
            total = len(rooms)
            available = sum(1 for r in rooms if r.status == RoomStatus.AVAILABLE)
            occupied = sum(1 for r in rooms if r.status == RoomStatus.OCCUPIED)
            maintenance = sum(1 for r in rooms if r.status == RoomStatus.MAINTENANCE)
            result.append({
                "id": apartment.id,
                "organization_id": apartment.organization_id,
                "name": apartment.name,
                "address": apartment.address,
                "description": apartment.description,
                "created_at": apartment.created_at,
                "room_stats": {
                    "total": total,
                    "available": available,
                    "occupied": occupied,
                    "maintenance": maintenance,
                }
            })
        return result

    def get_apartment(self, apartment_id: int, org_id: int) -> Optional[Apartment]:
        """Get an apartment by ID within an organization."""
        apartment = self.apartment_repo.get(apartment_id)
        if apartment and apartment.organization_id == org_id:
            return apartment
        return None

    def create_apartment(self, org_id: int, data: ApartmentCreate) -> Apartment:
        """Create a new apartment."""
        apartment = Apartment(
            organization_id=org_id,
            name=data.name,
            address=data.address,
            description=data.description,
        )
        return self.apartment_repo.create(apartment)

    def update_apartment(
        self, apartment_id: int, org_id: int, data: ApartmentUpdate
    ) -> Optional[Apartment]:
        """Update an apartment."""
        apartment = self.get_apartment(apartment_id, org_id)
        if not apartment:
            return None
        return self.apartment_repo.update(
            apartment_id,
            name=data.name,
            address=data.address,
            description=data.description,
        )

    def delete_apartment(self, apartment_id: int, org_id: int) -> bool:
        """Delete an apartment."""
        apartment = self.get_apartment(apartment_id, org_id)
        if not apartment:
            return False
        return self.apartment_repo.delete(apartment_id)

    # Room operations
    def list_rooms(self, org_id: int, apartment_id: Optional[int] = None) -> List[Room]:
        """List all rooms in an organization, optionally filtered by apartment."""
        if apartment_id:
            apartment = self.get_apartment(apartment_id, org_id)
            if not apartment:
                return []
            return self.room_repo.find_by_apartment(apartment_id)
        return self.room_repo.find_by_organization(org_id)

    def get_room(self, room_id: int, org_id: int) -> Optional[Room]:
        """Get a room by ID within an organization."""
        room = self.room_repo.get(room_id)
        if room and room.apartment.organization_id == org_id:
            return room
        return None

    def create_room(self, apartment_id: int, org_id: int, data: RoomCreate) -> Optional[Room]:
        """Create a new room in an apartment."""
        apartment = self.get_apartment(apartment_id, org_id)
        if not apartment:
            return None
        room = Room(
            apartment_id=apartment_id,
            room_number=data.room_number,
            monthly_rent=data.monthly_rent,
            status=RoomStatus.AVAILABLE,
            notes=data.notes,
        )
        return self.room_repo.create(room)

    def batch_create_rooms(
        self, apartment_id: int, org_id: int, data: RoomBatchCreate
    ) -> List[Room]:
        """Batch create rooms in an apartment by room number list."""
        apartment = self.get_apartment(apartment_id, org_id)
        if not apartment:
            return []

        rooms = []
        for room_number in data.room_numbers:
            room = Room(
                apartment_id=apartment_id,
                room_number=room_number,
                monthly_rent=data.monthly_rent,
                area=data.area,
                status=RoomStatus.AVAILABLE,
                notes=data.notes,
            )
            created_room = self.room_repo.create(room)
            rooms.append(created_room)
        return rooms

    def update_room(
        self, room_id: int, org_id: int, data: RoomUpdate
    ) -> Optional[Room]:
        """Update a room."""
        room = self.get_room(room_id, org_id)
        if not room:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return self.room_repo.update(room_id, **update_data)

    def delete_room(self, room_id: int, org_id: int) -> bool:
        """Delete a room."""
        room = self.get_room(room_id, org_id)
        if not room:
            return False
        return self.room_repo.delete(room_id)

    def update_room_status(self, room_id: int, org_id: int, status: RoomStatus) -> Optional[Room]:
        """Update room status."""
        room = self.get_room(room_id, org_id)
        if not room:
            return None
        return self.room_repo.update_status(room_id, status)

    def get_room_stats(self, org_id: int) -> dict:
        """Get room statistics for an organization."""
        total = len(self.room_repo.find_by_organization(org_id))
        available = self.room_repo.count_by_status(org_id, RoomStatus.AVAILABLE)
        occupied = self.room_repo.count_by_status(org_id, RoomStatus.OCCUPIED)
        return {
            "total": total,
            "available": available,
            "occupied": occupied,
            "occupancy_rate": round((occupied / total) * 100, 1) if total > 0 else 0,
        }
