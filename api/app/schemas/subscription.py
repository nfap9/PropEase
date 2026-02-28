"""
Pydantic schemas for subscription API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# ==================== Subscription Plan ====================

class SubscriptionPlanBase(BaseModel):
    """Base schema for subscription plan."""
    name: str = Field(..., max_length=100, description="套餐名称")
    code: str = Field(..., max_length=50, description="套餐代码")
    description: Optional[str] = Field(None, max_length=500, description="套餐描述")
    price_monthly: float = Field(..., ge=0, description="月费")
    price_yearly: float = Field(..., ge=0, description="年费")
    max_apartments: int = Field(..., ge=-1, description="最大公寓数，-1表示无限制")
    max_rooms: int = Field(..., ge=-1, description="最大房间数，-1表示无限制")
    max_members: int = Field(..., ge=-1, description="最大成员数，-1表示无限制")
    features: Optional[dict] = Field(None, description="其他特性配置")


class SubscriptionPlanCreate(SubscriptionPlanBase):
    """Schema for creating subscription plan."""
    sort_order: int = Field(default=0, description="排序")


class SubscriptionPlanUpdate(BaseModel):
    """Schema for updating subscription plan."""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    max_apartments: Optional[int] = Field(None, ge=-1)
    max_rooms: Optional[int] = Field(None, ge=-1)
    max_members: Optional[int] = Field(None, ge=-1)
    features: Optional[dict] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class SubscriptionPlanResponse(SubscriptionPlanBase):
    """Schema for subscription plan response."""
    id: str
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Organization Subscription ====================

class OrganizationSubscriptionBase(BaseModel):
    """Base schema for organization subscription."""
    plan_id: str = Field(..., description="套餐ID")
    billing_cycle: str = Field(default="monthly", description="计费周期: monthly/yearly")


class OrganizationSubscriptionCreate(OrganizationSubscriptionBase):
    """Schema for creating organization subscription."""
    auto_renew: bool = Field(default=True, description="是否自动续费")


class OrganizationSubscriptionUpdate(BaseModel):
    """Schema for updating organization subscription."""
    plan_id: Optional[str] = None
    billing_cycle: Optional[str] = None
    auto_renew: Optional[bool] = None


class OrganizationSubscriptionResponse(BaseModel):
    """Schema for organization subscription response."""
    id: str
    organization_id: str
    plan_id: str
    status: str
    billing_cycle: str
    start_date: date
    end_date: Optional[date]
    auto_renew: bool
    trial_ends_at: Optional[date]
    created_at: datetime
    updated_at: datetime
    plan: Optional[SubscriptionPlanResponse] = None

    class Config:
        from_attributes = True


# ==================== Subscribe Request ====================

class SubscribeRequest(BaseModel):
    """Schema for subscribe request."""
    plan_id: str = Field(..., description="套餐ID")
    billing_cycle: str = Field(default="monthly", description="计费周期: monthly/yearly")
    auto_renew: bool = Field(default=True, description="是否自动续费")


class ChangePlanRequest(BaseModel):
    """Schema for change plan request."""
    plan_id: str = Field(..., description="新套餐ID")
    billing_cycle: Optional[str] = Field(None, description="计费周期，不填保持原样")


class CancelSubscriptionRequest(BaseModel):
    """Schema for cancel subscription request."""
    reason: Optional[str] = Field(None, max_length=500, description="取消原因")
