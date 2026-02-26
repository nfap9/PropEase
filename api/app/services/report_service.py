"""
Report service for analytics and statistics.
"""
from typing import Optional
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.base import BaseService
from app.models.apartment import Apartment, Room, RoomStatus
from app.models.lease import Lease
from app.models.bill import Bill, BillStatus
from app.models.tenant import Tenant


class ReportService(BaseService):
    """Service for reports and analytics."""

    def __init__(self, db: Session):
        super().__init__(db)

    def get_overview(self, org_id: int) -> dict:
        """Get dashboard overview statistics."""
        # Count apartments
        total_apartments = (
            self.db.query(Apartment)
            .filter(Apartment.organization_id == org_id)
            .count()
        )

        # Count rooms
        total_rooms = (
            self.db.query(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
            .count()
        )

        # Count occupied rooms
        occupied_rooms = (
            self.db.query(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Room.status == RoomStatus.OCCUPIED,
            )
            .count()
        )

        # Available rooms
        available_rooms = total_rooms - occupied_rooms

        # Occupancy rate
        occupancy_rate = round((occupied_rooms / total_rooms) * 100, 1) if total_rooms > 0 else 0

        # Active leases
        active_leases = (
            self.db.query(Lease)
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Lease.is_active == True,
            )
            .count()
        )

        # Total tenants
        total_tenants = (
            self.db.query(Tenant)
            .filter(Tenant.organization_id == org_id)
            .count()
        )

        # Monthly revenue (current month)
        today = date.today()
        monthly_revenue = (
            self.db.query(func.sum(Bill.total_amount))
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Bill.bill_year == today.year,
                Bill.bill_month == today.month,
            )
            .scalar() or Decimal(0)
        )

        # Pending bills
        pending_bills = (
            self.db.query(Bill)
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Bill.status == BillStatus.PENDING,
            )
            .count()
        )

        # Overdue bills
        overdue_bills = (
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

        return {
            "total_apartments": total_apartments,
            "total_rooms": total_rooms,
            "occupied_rooms": occupied_rooms,
            "available_rooms": available_rooms,
            "occupancy_rate": occupancy_rate,
            "active_leases": active_leases,
            "total_tenants": total_tenants,
            "monthly_revenue": float(monthly_revenue),
            "pending_bills": pending_bills,
            "overdue_bills": overdue_bills,
        }

    def get_income_report(
        self,
        org_id: int,
        year: int,
        start_month: Optional[int] = None,
        end_month: Optional[int] = None,
    ) -> dict:
        """Get income report by month."""
        query = (
            self.db.query(
                Bill.bill_month,
                func.sum(Bill.total_amount).label("total"),
                func.sum(Bill.paid_amount).label("paid"),
            )
            .join(Lease)
            .join(Room)
            .join(Apartment)
            .filter(
                Apartment.organization_id == org_id,
                Bill.bill_year == year,
            )
        )

        if start_month:
            query = query.filter(Bill.bill_month >= start_month)
        if end_month:
            query = query.filter(Bill.bill_month <= end_month)

        results = query.group_by(Bill.bill_month).all()

        monthly_data = []
        for row in results:
            monthly_data.append({
                "month": row.bill_month,
                "total": float(row.total or 0),
                "paid": float(row.paid or 0),
                "pending": float((row.total or 0) - (row.paid or 0)),
            })

        total_amount = sum(d["total"] for d in monthly_data)
        paid_amount = sum(d["paid"] for d in monthly_data)

        return {
            "year": year,
            "monthly_data": monthly_data,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "pending_amount": total_amount - paid_amount,
            "collection_rate": round((paid_amount / total_amount) * 100, 1) if total_amount > 0 else 0,
        }

    def get_occupancy_report(self, org_id: int) -> dict:
        """Get occupancy report by apartment."""
        apartments = (
            self.db.query(Apartment)
            .filter(Apartment.organization_id == org_id)
            .all()
        )

        apartment_data = []
        for apt in apartments:
            rooms = self.db.query(Room).filter(Room.apartment_id == apt.id).all()
            total = len(rooms)
            occupied = sum(1 for r in rooms if r.status == RoomStatus.OCCUPIED)
            apartment_data.append({
                "id": apt.id,
                "name": apt.name,
                "total_rooms": total,
                "occupied_rooms": occupied,
                "available_rooms": total - occupied,
                "occupancy_rate": round((occupied / total) * 100, 1) if total > 0 else 0,
            })

        return {
            "apartments": apartment_data,
        }
