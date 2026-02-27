"""
Bill service for bill generation and payment management.
"""
from typing import List, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.bill_repository import BillRepository, PaymentRepository
from app.repositories.lease_repository import LeaseRepository
from app.repositories.organization_repository import OrganizationRepository, OrganizationMemberRepository
from app.repositories.utility_repository import UtilityRepository
from app.models.bill import Bill, Payment, BillStatus, PaymentMethod
from app.models.lease import Lease
from app.models.utility import UtilityReading
from app.schemas.bill import BillCreate, PaymentCreate, GenerateBillsRequest


class BillService(BaseService):
    """Service for bill management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.bill_repo = BillRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.lease_repo = LeaseRepository(db)
        self.member_repo = OrganizationMemberRepository(db)
        self.org_repo = OrganizationRepository(db)
        self.utility_repo = UtilityRepository(db)

    def list_bills(
        self,
        org_id: str,
        lease_id: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        status: Optional[BillStatus] = None,
    ) -> List[Bill]:
        """List bills with filters."""
        return self.bill_repo.find_by_organization(org_id, lease_id, year, month, status)

    def get_bill(self, bill_id: str, org_id: str) -> Optional[Bill]:
        """Get a bill by ID within an organization."""
        bills = self.bill_repo.find_by_organization(org_id)
        return next((b for b in bills if b.id == bill_id), None)

    def create_bill(self, org_id: str, data: BillCreate) -> Bill:
        """Create a new bill manually."""
        total_amount = (
            data.rent_amount
            + data.water_amount
            + data.electricity_amount
            + (data.other_amount or 0)
        )
        bill = Bill(
            lease_id=data.lease_id,
            bill_year=data.bill_year,
            bill_month=data.bill_month,
            due_date=data.due_date,
            rent_amount=data.rent_amount,
            water_amount=data.water_amount,
            electricity_amount=data.electricity_amount,
            other_amount=data.other_amount or Decimal(0),
            total_amount=total_amount,
            notes=data.notes,
            status=BillStatus.PENDING,
        )
        return self.bill_repo.create(bill)

    def update_bill(self, bill_id: str, org_id: str, data: "BillUpdate") -> Bill:
        """
        Update a bill.

        Args:
            bill_id: Bill ID
            org_id: Organization ID
            data: Update data

        Returns:
            Updated bill

        Raises:
            ValueError: Bill not found
        """
        from app.schemas.bill import BillUpdate

        bill = self.get_bill(bill_id, org_id)
        if not bill:
            raise ValueError("Bill not found")

        update_data = data.model_dump(exclude_unset=True)

        # Recalculate total if amounts changed
        rent_amount = update_data.get("rent_amount", bill.rent_amount)
        water_amount = update_data.get("water_amount", bill.water_amount)
        electricity_amount = update_data.get("electricity_amount", bill.electricity_amount)
        other_amount = update_data.get("other_amount", bill.other_amount)

        # Convert to float to ensure consistent types
        total_amount = float(rent_amount) + float(water_amount) + float(electricity_amount) + float(other_amount or 0)
        update_data["total_amount"] = total_amount

        return self.bill_repo.update(bill_id, **update_data)

    def generate_bills(
        self, org_id: str, data: GenerateBillsRequest
    ) -> dict:
        """
        Generate bills for active leases.

        Args:
            org_id: Organization ID
            data: Bill generation request

        Returns:
            Dict with created and skipped lease IDs
        """
        # Get active leases
        leases = self.lease_repo.find_active_by_organization(org_id)
        if data.lease_ids:
            leases = [l for l in leases if l.id in data.lease_ids]

        created = []
        skipped = []

        for lease in leases:
            # Check if bill already exists
            if self.bill_repo.exists_for_period(
                lease.id, data.bill_year, data.bill_month
            ):
                skipped.append(lease.id)
                continue

            # Get utility reading for this period
            reading = self._get_utility_reading(
                lease.room_id, data.bill_year, data.bill_month
            )

            # Calculate amounts
            rent_amount = lease.monthly_rent
            water_amount = self._calculate_water_cost(lease, reading)
            electricity_amount = self._calculate_electricity_cost(lease, reading)
            total_amount = rent_amount + water_amount + electricity_amount

            # Create bill
            bill = Bill(
                lease_id=lease.id,
                bill_year=data.bill_year,
                bill_month=data.bill_month,
                due_date=data.due_date,
                rent_amount=rent_amount,
                water_amount=water_amount,
                electricity_amount=electricity_amount,
                total_amount=total_amount,
                status=BillStatus.PENDING,
            )
            self.bill_repo.db.add(bill)
            created.append(lease.id)

        self.bill_repo.db.commit()
        return {"created": len(created), "skipped": len(skipped)}

    def _get_utility_reading(
        self, room_id: str, year: int, month: int
    ) -> Optional[UtilityReading]:
        """Get utility reading for a room and period."""
        return self.utility_repo.find_by_room_and_period(room_id, year, month)

    def _calculate_water_cost(
        self, lease: Lease, reading: Optional[UtilityReading]
    ) -> Decimal:
        """Calculate water cost from reading."""
        if (
            not reading
            or not lease.water_rate
            or not reading.water_reading
            or not reading.water_previous
        ):
            return Decimal(0)
        usage = reading.water_reading - reading.water_previous
        return Decimal(str(usage)) * Decimal(str(lease.water_rate))

    def _calculate_electricity_cost(
        self, lease: Lease, reading: Optional[UtilityReading]
    ) -> Decimal:
        """Calculate electricity cost from reading."""
        if (
            not reading
            or not lease.electricity_rate
            or not reading.electricity_reading
            or not reading.electricity_previous
        ):
            return Decimal(0)
        usage = reading.electricity_reading - reading.electricity_previous
        return Decimal(str(usage)) * Decimal(str(lease.electricity_rate))

    def record_payment(self, bill_id: str, data: PaymentCreate) -> Payment:
        """
        Record a payment for a bill.

        Args:
            bill_id: Bill ID
            data: Payment data

        Returns:
            Created payment
        """
        bill = self.bill_repo.get(bill_id)
        if not bill:
            raise ValueError("Bill not found")

        # Create payment
        payment = Payment(
            bill_id=bill_id,
            amount=data.amount,
            payment_date=data.payment_date,
            payment_method=data.payment_method,
            reference=data.reference,
            notes=data.notes,
        )
        self.payment_repo.db.add(payment)

        # Update bill status
        bill.paid_amount = bill.paid_amount + Decimal(str(data.amount))
        if bill.paid_amount >= bill.total_amount:
            bill.status = BillStatus.PAID
        elif bill.paid_amount > 0:
            bill.status = BillStatus.PARTIAL

        self.payment_repo.db.commit()
        self.payment_repo.db.refresh(payment)
        return payment

    def get_bill_payments(self, bill_id: str) -> List[Payment]:
        """Get all payments for a bill."""
        return self.payment_repo.find_by_bill(bill_id)

    def delete_bill(self, bill_id: str, org_id: str) -> bool:
        """Delete a bill if it has no payments."""
        bill = self.get_bill(bill_id, org_id)
        if not bill:
            raise ValueError("Bill not found")
        if bill.paid_amount > 0:
            raise ValueError("Cannot delete bill with payments")
        return self.bill_repo.delete(bill_id)

    def prepare_bill_export_data(self, bill: Bill) -> dict:
        """Prepare bill data for PDF/Excel export."""
        return {
            "id": bill.id,
            "bill_year": bill.bill_year,
            "bill_month": bill.bill_month,
            "due_date": bill.due_date,
            "rent_amount": bill.rent_amount,
            "water_amount": bill.water_amount,
            "electricity_amount": bill.electricity_amount,
            "other_amount": bill.other_amount,
            "total_amount": bill.total_amount,
            "paid_amount": bill.paid_amount,
            "status": bill.status.value if bill.status else "PENDING",
            "notes": bill.notes,
            "apartment_name": (
                bill.lease.room.apartment.name
                if bill.lease and bill.lease.room
                else "-"
            ),
            "room_number": (
                bill.lease.room.room_number if bill.lease and bill.lease.room else "-"
            ),
            "tenant_name": (
                bill.lease.tenant.name if bill.lease and bill.lease.tenant else "-"
            ),
        }

    def get_organization_name(self, org_id: str) -> str:
        """Get organization name by ID."""
        org = self.org_repo.get(org_id)
        return org.name if org else "Apartment Ultra"
