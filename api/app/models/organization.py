from sqlalchemy import String, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, List
import enum
from app.configs.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    members: Mapped[List["OrganizationMember"]] = relationship(
        "OrganizationMember", back_populates="organization", cascade="all, delete-orphan"
    )
    apartments: Mapped[List["Apartment"]] = relationship(
        "Apartment", back_populates="organization", cascade="all, delete-orphan"
    )
    tenants: Mapped[List["Tenant"]] = relationship(
        "Tenant", back_populates="organization", cascade="all, delete-orphan"
    )


class OrganizationMember(Base, TimestampMixin):
    __tablename__ = "organization_members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[MemberRole] = mapped_column(
        SQLEnum(MemberRole),
        default=MemberRole.MEMBER,
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="organization_memberships")


# Import here to avoid circular imports
from app.models.apartment import Apartment
from app.models.tenant import Tenant
