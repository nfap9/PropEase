"""
Subscription controller - handles subscription management.
"""
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.subscription_service import SubscriptionService
from app.schemas.subscription import (
    SubscriptionPlanResponse,
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
    OrganizationSubscriptionResponse,
    SubscribeRequest,
    ChangePlanRequest,
    CancelSubscriptionRequest,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_subscription_service(db: Session = Depends(get_db)) -> SubscriptionService:
    """Get subscription service instance."""
    return SubscriptionService(db)


# ==================== Public Plan Endpoints ====================

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def list_plans(
    active_only: bool = Query(True, description="只返回激活的套餐"),
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """List all subscription plans."""
    return subscription_service.list_plans(active_only=active_only)


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def get_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    """Get subscription plan by ID."""
    plan = subscription_service.get_plan(plan_id)
    if not plan:
        raise NotFoundError("Subscription plan")
    return plan


# ==================== Organization Subscription ====================

@router.get("/organizations/{org_id}/subscription", response_model=OrganizationSubscriptionResponse)
def get_organization_subscription(
    org_id: str,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Get subscription for an organization."""
    get_org_membership(org_id, current_user, db)
    subscription = subscription_service.get_organization_subscription(org_id)
    if not subscription:
        raise NotFoundError("Subscription")
    return subscription


@router.get("/organizations/{org_id}/subscription/status")
def get_subscription_status(
    org_id: str,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Get subscription status for an organization."""
    get_org_membership(org_id, current_user, db)
    return subscription_service.check_subscription_status(org_id)


@router.post(
    "/organizations/{org_id}/subscription",
    response_model=OrganizationSubscriptionResponse,
    status_code=status.HTTP_201_CREATED
)
def subscribe(
    org_id: str,
    data: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Subscribe an organization to a plan."""
    require_role([MemberRole.OWNER])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        subscription = subscription_service.subscribe(org_id, data)
        return subscription
    except ValueError as e:
        raise BadRequestError(str(e))


@router.put(
    "/organizations/{org_id}/subscription",
    response_model=OrganizationSubscriptionResponse
)
def change_plan(
    org_id: str,
    data: ChangePlanRequest,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Change subscription plan."""
    require_role([MemberRole.OWNER])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        subscription = subscription_service.change_plan(org_id, data)
        return subscription
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/organizations/{org_id}/subscription/cancel")
def cancel_subscription(
    org_id: str,
    data: CancelSubscriptionRequest = None,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Cancel subscription."""
    require_role([MemberRole.OWNER])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        reason = data.reason if data else None
        subscription = subscription_service.cancel_subscription(org_id, reason)
        return {"message": "订阅已取消", "subscription": subscription}
    except ValueError as e:
        raise BadRequestError(str(e))


# ==================== Admin Plan Management ====================
# These endpoints are for system admins to manage plans

@router.post(
    "/admin/plans",
    response_model=SubscriptionPlanResponse,
    status_code=status.HTTP_201_CREATED
)
def create_plan(
    data: SubscriptionPlanCreate,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Create a new subscription plan (admin only)."""
    # TODO: Add admin role check
    plan = subscription_service.create_plan(data)
    return plan


@router.put("/admin/plans/{plan_id}", response_model=SubscriptionPlanResponse)
def update_plan(
    plan_id: str,
    data: SubscriptionPlanUpdate,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Update a subscription plan (admin only)."""
    # TODO: Add admin role check
    plan = subscription_service.update_plan(plan_id, data)
    if not plan:
        raise NotFoundError("Subscription plan")
    return plan


@router.delete("/admin/plans/{plan_id}")
def delete_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    subscription_service: SubscriptionService = Depends(get_subscription_service),
    db: Session = Depends(get_db),
):
    """Delete a subscription plan (admin only)."""
    # TODO: Add admin role check
    if not subscription_service.delete_plan(plan_id):
        raise NotFoundError("Subscription plan")
    return {"message": "Plan deleted successfully"}
