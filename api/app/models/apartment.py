from sqlalchemy import String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
import enum
from app.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.lease import Lease


class RoomStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Apartment(Base, TimestampMixin):
    __tablename__ = "apartments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="apartments")
    rooms: Mapped[List["Room"]] = relationship(
        "Room", back_populates="apartment", cascade="all, delete-orphan"
    )


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    apartment_id: Mapped[int] = mapped_column(ForeignKey("apartments.id"), nullable=False)
    room_number: Mapped[str] = mapped_column(String(50), nullable=False)
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
