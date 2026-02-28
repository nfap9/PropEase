from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.lease import Lease
    from app.models.organization import Organization


class Tenant(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "tenants"

    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    id_card: Mapped[str] = mapped_column(String(50), nullable=True)
    emergency_contact: Mapped[str] = mapped_column(String(255), nullable=True)
    emergency_phone: Mapped[str] = mapped_column(String(50), nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="tenants")
    leases: Mapped[list["Lease"]] = relationship("Lease", back_populates="tenant", cascade="all, delete-orphan")
