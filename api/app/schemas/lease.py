from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.schemas.apartment import RoomWithApartment
from app.schemas.tenant import TenantResponse


class LeaseBase(BaseModel):
    room_id: str
    tenant_id: str
    start_date: date
    end_date: date | None = None
    billing_day: int = 1  # 账单日 (1-28)，默认为1号
    monthly_rent: float
    deposit: float = 0
    water_rate: float = 0
    electricity_rate: float = 0
    notes: str | None = None

    @field_validator("billing_day")
    @classmethod
    def validate_billing_day(cls, v: int) -> int:
        if v < 1 or v > 28:
            raise ValueError("账单日必须在 1-28 之间")
        return v


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    end_date: date | None = None
    billing_day: int | None = None
    monthly_rent: float | None = None
    deposit: float | None = None
    water_rate: float | None = None
    electricity_rate: float | None = None
    is_active: bool | None = None
    notes: str | None = None

    @field_validator("billing_day")
    @classmethod
    def validate_billing_day(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 28):
            raise ValueError("账单日必须在 1-28 之间")
        return v


class LeaseResponse(LeaseBase):
    id: str
    is_active: bool
    created_at: datetime
    room: RoomWithApartment | None = None
    tenant: TenantResponse | None = None

    class Config:
        from_attributes = True
