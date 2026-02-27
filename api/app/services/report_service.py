"""
Report service for analytics and statistics.
"""
from datetime import date
from decimal import Decimal

from sqlalchemy import Integer, func
from sqlalchemy.orm import Session

from app.models.apartment import Apartment, Room, RoomStatus
from app.models.bill import Bill, BillStatus
from app.models.lease import Lease
from app.models.tenant import Tenant
from app.services.base import BaseService


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
                Lease.is_active.is_(True),
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
        start_month: int | None = None,
        end_month: int | None = None,
    ) -> list:
        """Get income report by month.

        Returns a list of monthly income reports with breakdown by category.
        """
        query = (
            self.db.query(
                Bill.bill_month,
                func.sum(Bill.total_amount).label("total_amount"),
                func.sum(Bill.paid_amount).label("collected_amount"),
                func.sum(Bill.rent_amount).label("total_rent"),
                func.sum(Bill.water_amount).label("total_water"),
                func.sum(Bill.electricity_amount).label("total_electricity"),
                func.sum(Bill.other_amount).label("total_other"),
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
            total_amount = float(row.total_amount or 0)
            collected_amount = float(row.collected_amount or 0)
            monthly_data.append({
                "period": f"{row.bill_month}月",
                "total_amount": total_amount,
                "collected_amount": collected_amount,
                "total_rent": float(row.total_rent or 0),
                "total_water": float(row.total_water or 0),
                "total_electricity": float(row.total_electricity or 0),
                "total_other": float(row.total_other or 0),
                "collection_rate": round((collected_amount / total_amount) * 100, 1) if total_amount > 0 else 0,
            })

        return monthly_data

    def get_occupancy_report(self, org_id: int, year: int) -> list:
        """Get occupancy report by month.

        Calculate monthly occupancy rate based on active leases.
        """
        # Get total rooms count
        total_rooms = (
            self.db.query(Room)
            .join(Apartment)
            .filter(Apartment.organization_id == org_id)
            .count()
        )

        if total_rooms == 0:
            return []

        monthly_data = []
        for month in range(1, 13):
            # A room is occupied in a month if there's an active lease
            # that covers that month
            month_start = date(year, month, 1)
            if month == 12:
                month_end = date(year + 1, 1, 1)
            else:
                month_end = date(year, month + 1, 1)

            # Active lease: start_date <= month_end AND (end_date IS NULL OR end_date >= month_start)
            occupied_rooms = (
                self.db.query(func.count(func.distinct(Room.id)))
                .join(Lease)
                .join(Apartment)
                .filter(
                    Apartment.organization_id == org_id,
                    Lease.start_date < month_end,
                    func.coalesce(Lease.end_date, date(2999, 12, 31)) >= month_start,
                )
                .scalar() or 0
            )

            occupancy_rate = round((occupied_rooms / total_rooms) * 100, 1) if total_rooms > 0 else 0

            monthly_data.append({
                "period": f"{month}月",
                "total_rooms": total_rooms,
                "occupied_rooms": occupied_rooms,
                "vacant_rooms": total_rooms - occupied_rooms,
                "occupancy_rate": occupancy_rate,
            })

        return monthly_data
