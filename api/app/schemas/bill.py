from datetime import date, datetime

from pydantic import BaseModel

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
    notes: str | None = None


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    due_date: date | None = None
    rent_amount: float | None = None
    water_amount: float | None = None
    electricity_amount: float | None = None
    other_amount: float | None = None
    notes: str | None = None


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
    reference: str | None = None
    notes: str | None = None


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
    lease_ids: list[str] | None = None
