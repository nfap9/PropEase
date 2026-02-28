"""
Bill repository for data access operations.
"""
from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.bill import Bill, Payment, BillStatus
from app.models.lease import Lease
from app.models.apartment import Room, Apartment


class BillRepository(BaseRepository[Bill]):
    """Repository for Bill model."""

    def __init__(self, db: Session):
        super().__init__(db, Bill)

    def find_by_organization(
        self,
        org_id: str,
        lease_id: str = None,
        year: int = None,
        month: int = None,
        status: BillStatus = None,
    ) -> List[Bill]:
        """Find all bills in an organization with filters."""
        query = (
            self.db.query(Bill)
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
        )
        if lease_id:
            query = query.filter(Bill.lease_id == lease_id)
        if year:
            query = query.filter(Bill.bill_year == year)
        if month:
            query = query.filter(Bill.bill_month == month)
        if status:
            query = query.filter(Bill.status == status)
        return query.all()

    def find_by_lease(self, lease_id: str) -> List[Bill]:
        """Find all bills for a lease."""
        return self.db.query(Bill).filter(Bill.lease_id == lease_id).all()

    def exists_for_period(
        self, lease_id: str, year: int, month: int
    ) -> bool:
        """Check if a bill already exists for a lease period."""
        return (
            self.db.query(Bill)
            .filter(
                Bill.lease_id == lease_id,
                Bill.bill_year == year,
                Bill.bill_month == month,
            )
            .first()
            is not None
        )

    def count_by_status(self, org_id: str, status: BillStatus) -> int:
        """Count bills by status in an organization."""
        return (
            self.db.query(Bill)
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id, Bill.status == status)
            .count()
        )

    def count_overdue(self, org_id: str) -> int:
        """Count overdue bills in an organization."""
        today = date.today()
        return (
            self.db.query(Bill)
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Bill.status != BillStatus.PAID,
                Bill.due_date < today,
            )
            .count()
        )

    def find_overdue(self, as_of_date: date) -> List[Bill]:
        """
        Find all overdue bills across all organizations.

        Args:
            as_of_date: The date to check overdue status against

        Returns:
            List of overdue bills
        """
        from sqlalchemy.orm import joinedload

        return (
            self.db.query(Bill)
            .options(
                joinedload(Bill.lease).joinedload(Lease.tenant),
                joinedload(Bill.lease).joinedload(Lease.room).joinedload(Room.apartment),
            )
            .filter(
                Bill.status != BillStatus.PAID,
                Bill.due_date < as_of_date,
            )
            .all()
        )


class PaymentRepository(BaseRepository[Payment]):
    """Repository for Payment model."""

    def __init__(self, db: Session):
        super().__init__(db, Payment)

    def find_by_bill(self, bill_id: str) -> List[Payment]:
        """Find all payments for a bill."""
        return self.db.query(Payment).filter(Payment.bill_id == bill_id).all()
