from sqlalchemy import String, ForeignKey, Integer, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from datetime import date
from app.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.apartment import Room


class UtilityReading(Base, TimestampMixin):
    __tablename__ = "utility_readings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"), nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    reading_date: Mapped[date] = mapped_column(Date, nullable=False)
    water_reading: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    electricity_reading: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    water_previous: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    electricity_previous: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="utility_readings")
