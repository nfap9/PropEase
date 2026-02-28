"""
运营侧订阅管理：套餐 CRUD、订阅列表、续期/取消。
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, status

from app.configs.database import get_db
from app.dependencies import get_current_admin_user
from app.schemas.admin import AdminSubscriptionRenew
from app.schemas.subscription import (
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
    SubscriptionPlanResponse,
    OrganizationSubscriptionResponse,
)
from app.services.admin_subscription_service import AdminSubscriptionService
from app.controllers.common.errors import NotFoundError, BadRequestError, ConflictError
from sqlalchemy.orm import Session

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_admin_sub_service(db: Session = Depends(get_db)) -> AdminSubscriptionService:
    return AdminSubscriptionService(db)


# ==================== 套餐 ====================


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def list_plans(
    active_only: bool = False,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """套餐列表（运营侧可看全部）。"""
    plans = service.list_plans(active_only=active_only)
    return [SubscriptionPlanResponse.model_validate(p) for p in plans]


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def get_plan(
    plan_id: str,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """套餐详情。"""
    plan = service.get_plan(plan_id)
    if not plan:
        raise NotFoundError("套餐")
    return SubscriptionPlanResponse.model_validate(plan)


@router.post(
    "/plans",
    response_model=SubscriptionPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_plan(
    data: SubscriptionPlanCreate,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """创建套餐。"""
    try:
        plan = service.create_plan(data)
        return SubscriptionPlanResponse.model_validate(plan)
    except ValueError as e:
        if "已存在" in str(e):
            raise ConflictError(str(e)) from e
        raise BadRequestError(str(e)) from e


@router.put("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_plan(
    plan_id: str,
    data: SubscriptionPlanUpdate,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """更新套餐。"""
    plan = service.update_plan(plan_id, data)
    if not plan:
        raise NotFoundError("套餐")
    return SubscriptionPlanResponse.model_validate(plan)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: str,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """删除套餐。"""
    if not service.delete_plan(plan_id):
        raise NotFoundError("套餐")


# ==================== 订阅 ====================


@router.get("/subscriptions", response_model=List[OrganizationSubscriptionResponse])
def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    organization_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """订阅列表（平台级）。"""
    subs = service.list_subscriptions(
        skip=skip,
        limit=limit,
        organization_id=organization_id,
        status=status_filter,
    )
    return [OrganizationSubscriptionResponse.model_validate(s) for s in subs]


@router.get("/subscriptions/{subscription_id}", response_model=OrganizationSubscriptionResponse)
def get_subscription(
    subscription_id: str,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """订阅详情。"""
    sub = service.get_subscription(subscription_id)
    if not sub:
        raise NotFoundError("订阅")
    return OrganizationSubscriptionResponse.model_validate(sub)


@router.post(
    "/subscriptions/{subscription_id}/renew",
    response_model=OrganizationSubscriptionResponse,
)
def renew_subscription(
    subscription_id: str,
    data: AdminSubscriptionRenew,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """手动续期（延长 end_date）。"""
    sub = service.renew_subscription(subscription_id, data.extend_days)
    if not sub:
        raise NotFoundError("订阅")
    return OrganizationSubscriptionResponse.model_validate(sub)


@router.post(
    "/subscriptions/{subscription_id}/cancel",
    response_model=OrganizationSubscriptionResponse,
)
def cancel_subscription(
    subscription_id: str,
    service: AdminSubscriptionService = Depends(get_admin_sub_service),
):
    """取消订阅。"""
    sub = service.cancel_subscription(subscription_id)
    if not sub:
        raise NotFoundError("订阅")
    return OrganizationSubscriptionResponse.model_validate(sub)
