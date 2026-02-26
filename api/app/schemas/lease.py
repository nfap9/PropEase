from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class LeaseBase(BaseModel):
    room_id: int
    tenant_id: int
    start_date: date
    end_date: Optional[date] = None
    monthly_rent: float
    deposit: float = 0
    water_rate: float = 0
    electricity_rate: float = 0
    notes: Optional[str] = None


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    end_date: Optional[date] = None
    monthly_rent: Optional[float] = None
    deposit: Optional[float] = None
    water_rate: Optional[float] = None
    electricity_rate: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class LeaseResponse(LeaseBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
