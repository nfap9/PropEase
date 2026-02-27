from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime

from app.schemas.apartment import RoomWithApartment
from app.schemas.tenant import TenantResponse


class LeaseBase(BaseModel):
    room_id: str
    tenant_id: str
    start_date: date
    end_date: Optional[date] = None
    billing_day: int = 1  # 账单日 (1-28)，默认为1号
    monthly_rent: float
    deposit: float = 0
    water_rate: float = 0
    electricity_rate: float = 0
    notes: Optional[str] = None

    @field_validator('billing_day')
    @classmethod
    def validate_billing_day(cls, v: int) -> int:
        if v < 1 or v > 28:
            raise ValueError('账单日必须在 1-28 之间')
        return v


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    end_date: Optional[date] = None
    billing_day: Optional[int] = None
    monthly_rent: Optional[float] = None
    deposit: Optional[float] = None
    water_rate: Optional[float] = None
    electricity_rate: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

    @field_validator('billing_day')
    @classmethod
    def validate_billing_day(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 28):
            raise ValueError('账单日必须在 1-28 之间')
        return v


class LeaseResponse(LeaseBase):
    id: str
    is_active: bool
    created_at: datetime
    room: Optional[RoomWithApartment] = None
    tenant: Optional[TenantResponse] = None

    class Config:
        from_attributes = True
