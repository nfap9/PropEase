from pydantic import BaseModel
from typing import Optional
from datetime import date


class DashboardOverview(BaseModel):
    total_apartments: int
    total_rooms: int
    occupied_rooms: int
    available_rooms: int
    total_tenants: int
    active_leases: int
    occupancy_rate: float
    monthly_revenue: float
    pending_bills: int
    overdue_bills: int


class IncomeReport(BaseModel):
    period: str
    total_rent: float
    total_water: float
    total_electricity: float
    total_other: float
    total_amount: float
    collected_amount: float
    collection_rate: float


class OccupancyReport(BaseModel):
    period: str
    total_rooms: int
    occupied_rooms: int
    vacant_rooms: int
    occupancy_rate: float


class ReportQuery(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    apartment_id: Optional[int] = None
