from sqlalchemy import String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List, Optional
import enum
from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.lease import Lease
    from app.models.utility_config import UtilityConfig


class RoomStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Apartment(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "apartments"

    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="apartments")
    rooms: Mapped[List["Room"]] = relationship(
        "Room", back_populates="apartment", cascade="all, delete-orphan"
    )
    utility_config: Mapped[Optional["UtilityConfig"]] = relationship(
        "UtilityConfig", back_populates="apartment", uselist=False, cascade="all, delete-orphan"
    )


class Room(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "rooms"

    apartment_id: Mapped[str] = mapped_column(ForeignKey("apartments.id"), nullable=False)
    room_number: Mapped[str] = mapped_column(String(50), nullable=False)
    layout: Mapped[str] = mapped_column(String(50), nullable=True)  # 户型，如 "一室一厅"、"两室一厅"
    status: Mapped[RoomStatus] = mapped_column(
        SQLEnum(RoomStatus),
        default=RoomStatus.AVAILABLE,
        nullable=False,
    )
    monthly_rent: Mapped[float] = mapped_column(nullable=False)
    area: Mapped[float] = mapped_column(nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    apartment: Mapped["Apartment"] = relationship("Apartment", back_populates="rooms")
    leases: Mapped[List["Lease"]] = relationship(
        "Lease", back_populates="room", cascade="all, delete-orphan"
    )
    utility_readings: Mapped[List["UtilityReading"]] = relationship(
        "UtilityReading", back_populates="room", cascade="all, delete-orphan"
    )


# Import here to avoid circular imports
from app.models.lease import Lease
from app.models.utility import UtilityReading
