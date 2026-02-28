"""
UtilityConfig model for apartment utility pricing configuration.
"""
from sqlalchemy import String, ForeignKey, Numeric, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional
from datetime import date

from app.configs.database import Base
from app.models.base import TimestampMixin, ULIDMixin

if TYPE_CHECKING:
    from app.models.apartment import Apartment


class UtilityConfig(Base, TimestampMixin, ULIDMixin):
    """
    公寓公用费用配置。

    用于配置公寓维度的水电单价、网费、管理费、服务费等公用费用。
    这些配置将在生成账单时作为默认值使用。
    """
    __tablename__ = "utility_configs"

    apartment_id: Mapped[str] = mapped_column(
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # 每个公寓只有一个有效配置
    )
    # 水费单价（元/吨）
    water_price_per_unit: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    # 电费单价（元/度）
    electricity_price_per_unit: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    # 网费（月/元）
    internet_fee: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    # 管理费（月/元）
    management_fee: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    # 服务费（月/元）
    service_fee: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )
    # 生效日期
    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    # 备注
    notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    apartment: Mapped["Apartment"] = relationship(
        "Apartment",
        back_populates="utility_config",
    )
