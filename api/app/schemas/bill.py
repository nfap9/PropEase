from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.bill import BillStatus, PaymentMethod


class BillBase(BaseModel):
    lease_id: str
    bill_year: int
    bill_month: int
    due_date: date
    rent_amount: float = 0
    water_amount: float = 0
    electricity_amount: float = 0
    other_amount: float = 0
    notes: Optional[str] = None


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    due_date: Optional[date] = None
    rent_amount: Optional[float] = None
    water_amount: Optional[float] = None
    electricity_amount: Optional[float] = None
    other_amount: Optional[float] = None
    notes: Optional[str] = None


class BillResponse(BillBase):
    id: str
    total_amount: float
    paid_amount: float
    status: BillStatus
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    amount: float
    payment_date: date
    payment_method: PaymentMethod = PaymentMethod.CASH
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: str
    bill_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateBillsRequest(BaseModel):
    bill_year: int
    bill_month: int
    due_date: date
    lease_ids: Optional[list[str]] = None
