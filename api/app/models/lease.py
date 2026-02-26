from sqlalchemy import String, ForeignKey, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
from datetime import date
from app.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.apartment import Room
    from app.models.tenant import Tenant


class Lease(Base, TimestampMixin):
    __tablename__ = "leases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    monthly_rent: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deposit: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    water_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=0, nullable=False)
    electricity_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="leases")
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="leases")
    bills: Mapped[List["Bill"]] = relationship(
        "Bill", back_populates="lease", cascade="all, delete-orphan"
    )


# Import here to avoid circular imports
from app.models.bill import Bill
