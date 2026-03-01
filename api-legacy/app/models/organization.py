import enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.subscription import OrganizationSubscription
    from app.models.user import User


class MemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Organization(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default="free", nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    is_personal: Mapped[bool] = mapped_column(default=False, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)

    # Relationships
    members: Mapped[list["OrganizationMember"]] = relationship(
        "OrganizationMember", back_populates="organization", cascade="all, delete-orphan"
    )
    apartments: Mapped[list["Apartment"]] = relationship(
        "Apartment", back_populates="organization", cascade="all, delete-orphan"
    )
    tenants: Mapped[list["Tenant"]] = relationship(
        "Tenant", back_populates="organization", cascade="all, delete-orphan"
    )
    subscription: Mapped[Optional["OrganizationSubscription"]] = relationship(
        "OrganizationSubscription", back_populates="organization", uselist=False, cascade="all, delete-orphan"
    )


class OrganizationMember(Base, TimestampMixin, ULIDMixin):
    __tablename__ = "organization_members"

    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[MemberRole] = mapped_column(
        SQLEnum(MemberRole),
        default=MemberRole.MEMBER,
        nullable=False,
    )
    # 自定义角色ID（可选，用于自定义权限）
    custom_role_id: Mapped[str | None] = mapped_column(
        ForeignKey("custom_roles.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="organization_memberships")
    custom_role: Mapped[Optional["CustomRole"]] = relationship("CustomRole")


# Import here to avoid circular imports
from app.models.apartment import Apartment
from app.models.tenant import Tenant
