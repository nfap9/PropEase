"""
Lease service for lease management.
"""

from sqlalchemy.orm import Session

from app.models.apartment import RoomStatus
from app.models.lease import Lease
from app.repositories.apartment_repository import RoomRepository
from app.repositories.lease_repository import LeaseRepository
from app.schemas.lease import LeaseCreate, LeaseUpdate
from app.services.base import BaseService


class LeaseService(BaseService):
    """Service for lease management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.lease_repo = LeaseRepository(db)
        self.room_repo = RoomRepository(db)

    def list_leases(self, org_id: str, active_only: bool = False) -> list[Lease]:
        """List all leases in an organization."""
        if active_only:
            return self.lease_repo.find_active_by_organization(org_id)
        return self.lease_repo.find_by_organization(org_id)

    def get_lease(self, lease_id: str, org_id: str) -> Lease | None:
        """Get a lease by ID within an organization."""
        lease = self.lease_repo.get(lease_id)
        if lease and lease.room.apartment.organization_id == org_id:
            return lease
        return None

    def create_lease(self, org_id: str, data: LeaseCreate) -> Lease:
        """
        Create a new lease.

        Validates:
        - Room exists and belongs to organization
        - Room is available
        - No overlapping leases exist

        Args:
            org_id: Organization ID
            data: Lease creation data

        Returns:
            Created lease

        Raises:
            ValueError: If validation fails
        """
        # Get room and verify it belongs to organization
        room = self.room_repo.get(data.room_id)
        if not room or room.apartment.organization_id != org_id:
            raise ValueError("Room not found")

        # Check if room is available
        if room.status != RoomStatus.AVAILABLE:
            raise ValueError("Room is not available")

        # Check for overlapping leases
        if self.lease_repo.has_overlapping_lease(data.room_id, data.start_date, data.end_date):
            raise ValueError("Room has an overlapping lease for this period")

        # Create lease
        lease = Lease(
            room_id=data.room_id,
            tenant_id=data.tenant_id,
            start_date=data.start_date,
            end_date=data.end_date,
            billing_day=data.billing_day,
            monthly_rent=data.monthly_rent,
            deposit=data.deposit,
            water_rate=data.water_rate,
            electricity_rate=data.electricity_rate,
            notes=data.notes,
            is_active=True,
        )
        lease = self.lease_repo.create(lease)

        # Update room status to occupied
        self.room_repo.update_status(data.room_id, RoomStatus.OCCUPIED)

        return lease

    def update_lease(self, lease_id: str, org_id: str, data: LeaseUpdate) -> Lease | None:
        """Update a lease."""
        lease = self.get_lease(lease_id, org_id)
        if not lease:
            return None

        # Check for overlapping leases if dates changed
        if data.end_date is not None:
            start = lease.start_date
            end = data.end_date or lease.end_date
            if self.lease_repo.has_overlapping_lease(lease.room_id, start, end, exclude_id=lease_id):
                raise ValueError("Room has an overlapping lease for this period")

        update_data = data.model_dump(exclude_unset=True)
        return self.lease_repo.update(lease_id, **update_data)

    def terminate_lease(self, lease_id: str, org_id: str) -> Lease | None:
        """Terminate a lease and release the room."""
        lease = self.get_lease(lease_id, org_id)
        if not lease:
            return None

        # Mark lease as inactive
        lease = self.lease_repo.update(lease_id, is_active=False)

        # Update room status to available
        self.room_repo.update_status(lease.room_id, RoomStatus.AVAILABLE)

        return lease

    def delete_lease(self, lease_id: str, org_id: str) -> bool:
        """Delete a lease (only if terminated)."""
        lease = self.get_lease(lease_id, org_id)
        if not lease:
            return False
        if lease.is_active:
            raise ValueError("Cannot delete active lease. Terminate it first.")
        return self.lease_repo.delete(lease_id)

    def get_lease_stats(self, org_id: str) -> dict:
        """Get lease statistics for an organization."""
        active = self.lease_repo.count_active(org_id)
        all_leases = len(self.lease_repo.find_by_organization(org_id))
        return {
            "active": active,
            "total": all_leases,
        }
