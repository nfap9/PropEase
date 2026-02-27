from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from ulid import ulid

from app.configs.database import Base
from app.models.types import ULIDType


def generate_ulid() -> str:
    """生成新的ULID字符串。"""
    return ulid()


class ULIDMixin:
    """
    ULID主键混入类。

    使用方式：
        class User(Base, TimestampMixin, ULIDMixin):
            __tablename__ = "users"
            # id 字段自动提供
            name: Mapped[str] = ...
    """
    id: Mapped[str] = mapped_column(
        ULIDType(),
        primary_key=True,
        default=generate_ulid,
        nullable=False,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
