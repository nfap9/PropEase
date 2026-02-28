"""
Lease repository for data access operations.
"""
from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import true

from app.repositories.base import BaseRepository
from app.models.lease import Lease
from app.models.apartment import Room, Apartment


class LeaseRepository(BaseRepository[Lease]):
    """Repository for Lease model."""

    def __init__(self, db: Session):
        super().__init__(db, Lease)

    def find_by_organization(self, org_id: str) -> List[Lease]:
        """Find all leases in an organization."""
        return (
            self.db.query(Lease)
            .options(
                joinedload(Lease.room).joinedload(Room.apartment),
                joinedload(Lease.tenant),
            )
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
            .all()
        )

    def find_active_by_organization(self, org_id: str) -> List[Lease]:
        """Find all active leases in an organization."""
        return (
            self.db.query(Lease)
            .options(
                joinedload(Lease.room).joinedload(Room.apartment),
                joinedload(Lease.tenant),
            )
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id, Lease.is_active == true())
            .all()
        )

    def find_by_room(self, room_id: str) -> List[Lease]:
        """Find all leases for a room."""
        return self.db.query(Lease).filter(Lease.room_id == room_id).all()

    def find_active_by_room(self, room_id: str) -> Optional[Lease]:
        """Find active lease for a room."""
        return (
            self.db.query(Lease)
            .filter(Lease.room_id == room_id, Lease.is_active == true())
            .first()
        )

    def find_by_tenant(self, tenant_id: str) -> List[Lease]:
        """Find all leases for a tenant."""
        return self.db.query(Lease).filter(Lease.tenant_id == tenant_id).all()

    def has_overlapping_lease(
        self, room_id: str, start_date: date, end_date: date, exclude_id: str = None
    ) -> bool:
        """Check if there's an overlapping lease for the room."""
        query = self.db.query(Lease).filter(
            Lease.room_id == room_id,
            Lease.is_active == true(),
        )
        # Handle None end_date (open-ended lease)
        if end_date is None:
            # New lease is open-ended, overlaps if existing lease starts before new lease ends
            # Since new lease has no end, it overlaps with any active lease
            query = query.filter(Lease.end_date >= start_date)
        else:
            query = query.filter(
                Lease.start_date <= end_date,
                Lease.end_date >= start_date,
            )
        if exclude_id:
            query = query.filter(Lease.id != exclude_id)
        return query.first() is not None

    def count_active(self, org_id: str) -> int:
        """Count active leases in an organization."""
        return (
            self.db.query(Lease)
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id, Lease.is_active == true())
            .count()
        )

    def find_expiring_on(self, target_date: date) -> List[Lease]:
        """
        Find all active leases expiring on a specific date.

        Args:
            target_date: The date to check for expiring leases

        Returns:
            List of leases expiring on that date
        """
        return (
            self.db.query(Lease)
            .options(
                joinedload(Lease.room).joinedload(Room.apartment),
                joinedload(Lease.tenant),
            )
            .filter(
                Lease.is_active == true(),
                Lease.end_date == target_date,
            )
            .all()
        )
