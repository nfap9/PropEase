from sqlalchemy import String, ForeignKey, Integer, Numeric, Date, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
from datetime import date
import enum
from app.configs.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.lease import Lease


class BillStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"


class Bill(Base, TimestampMixin):
    __tablename__ = "bills"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lease_id: Mapped[int] = mapped_column(ForeignKey("leases.id"), nullable=False)
    bill_year: Mapped[int] = mapped_column(Integer, nullable=False)
    bill_month: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    rent_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    water_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    electricity_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    other_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    status: Mapped[BillStatus] = mapped_column(
        SQLEnum(BillStatus),
        default=BillStatus.PENDING,
        nullable=False,
    )
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    lease: Mapped["Lease"] = relationship("Lease", back_populates="bills")
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="bill", cascade="all, delete-orphan"
    )


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    WECHAT = "wechat"
    ALIPAY = "alipay"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bill_id: Mapped[int] = mapped_column(ForeignKey("bills.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod),
        default=PaymentMethod.CASH,
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    bill: Mapped["Bill"] = relationship("Bill", back_populates="payments")
