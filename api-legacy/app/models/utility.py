from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.apartment import Room


class UtilityReading(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "utility_readings"

    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=False)
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
