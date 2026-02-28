"""
Pydantic schemas for UtilityConfig API.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field


class UtilityConfigBase(BaseModel):
    """Base schema for utility config."""

    water_price_per_unit: float | None = Field(
        default=None,
        ge=0,
        description="水费单价（元/吨）",
    )
    electricity_price_per_unit: float | None = Field(
        default=None,
        ge=0,
        description="电费单价（元/度）",
    )
    internet_fee: float | None = Field(
        default=None,
        ge=0,
        description="网费（月/元）",
    )
    management_fee: float | None = Field(
        default=None,
        ge=0,
        description="管理费（月/元）",
    )
    service_fee: float | None = Field(
        default=None,
        ge=0,
        description="服务费（月/元）",
    )
    effective_from: date = Field(
        ...,
        description="生效日期",
    )
    notes: str | None = Field(
        default=None,
        max_length=500,
        description="备注",
    )


class UtilityConfigCreate(UtilityConfigBase):
    """Schema for creating utility config."""

    pass


class UtilityConfigUpdate(BaseModel):
    """Schema for updating utility config."""

    water_price_per_unit: float | None = Field(
        default=None,
        ge=0,
        description="水费单价（元/吨）",
    )
    electricity_price_per_unit: float | None = Field(
        default=None,
        ge=0,
        description="电费单价（元/度）",
    )
    internet_fee: float | None = Field(
        default=None,
        ge=0,
        description="网费（月/元）",
    )
    management_fee: float | None = Field(
        default=None,
        ge=0,
        description="管理费（月/元）",
    )
    service_fee: float | None = Field(
        default=None,
        ge=0,
        description="服务费（月/元）",
    )
    effective_from: date | None = Field(
        default=None,
        description="生效日期",
    )
    notes: str | None = Field(
        default=None,
        max_length=500,
        description="备注",
    )


class UtilityConfigResponse(UtilityConfigBase):
    """Schema for utility config response."""

    id: str
    apartment_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
