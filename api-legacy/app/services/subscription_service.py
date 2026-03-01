"""
Subscription service for plan and subscription management.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.subscription import BillingCycle, OrganizationSubscription, SubscriptionPlan, SubscriptionStatus
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.subscription_repository import (
    OrganizationSubscriptionRepository,
    SubscriptionPlanRepository,
)
from app.schemas.subscription import (
    ChangePlanRequest,
    SubscribeRequest,
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
)
from app.services.base import BaseService


class SubscriptionService(BaseService):
    """Service for subscription management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.plan_repo = SubscriptionPlanRepository(db)
        self.subscription_repo = OrganizationSubscriptionRepository(db)
        self.org_repo = OrganizationRepository(db)

    # ==================== Plan Operations ====================

    def list_plans(self, active_only: bool = True) -> list[SubscriptionPlan]:
        """
        List all subscription plans.

        Args:
            active_only: If True, only return active plans

        Returns:
            List of subscription plans
        """
        if active_only:
            return self.plan_repo.find_active_plans()
        return self.plan_repo.get_all(limit=100)

    def get_plan(self, plan_id: str) -> SubscriptionPlan | None:
        """Get plan by ID."""
        return self.plan_repo.get(plan_id)

    def get_plan_by_code(self, code: str) -> SubscriptionPlan | None:
        """Get plan by code."""
        return self.plan_repo.find_by_code(code)

    def create_plan(self, data: SubscriptionPlanCreate) -> SubscriptionPlan:
        """Create a new subscription plan."""
        plan = SubscriptionPlan(
            name=data.name,
            code=data.code,
            description=data.description,
            price_monthly=data.price_monthly,
            price_yearly=data.price_yearly,
            max_apartments=data.max_apartments,
            max_rooms=data.max_rooms,
            max_members=data.max_members,
            features=data.features,
            sort_order=0,
        )

    def create_plan(self, data: SubscriptionPlanCreate) -> SubscriptionPlan:
        """Create a new subscription plan."""
        plan = SubscriptionPlan(
            name=data.name,
            code=data.code,
            description=data.description,
            price_monthly=data.price_monthly,
            price_yearly=data.price_yearly,
            max_apartments=data.max_apartments,
            max_rooms=data.max_rooms,
            max_members=data.max_members,
            features=data.features,
            sort_order=data.sort_order,
        )
        return self.plan_repo.create(plan)

    def update_plan(self, plan_id: str, data: SubscriptionPlanUpdate) -> SubscriptionPlan | None:
        """Update a subscription plan."""
        update_data = data.model_dump(exclude_unset=True)
        return self.plan_repo.update(plan_id, **update_data)

    def delete_plan(self, plan_id: str) -> bool:
        """Delete a subscription plan."""
        return self.plan_repo.delete(plan_id)

    # ==================== Subscription Operations ====================

    def get_organization_subscription(self, org_id: str) -> OrganizationSubscription | None:
        """
        Get subscription for an organization.

        Args:
            org_id: Organization ID

        Returns:
            OrganizationSubscription if exists, None otherwise
        """
        return self.subscription_repo.find_by_organization(org_id)

    def get_organization_plan(self, org_id: str) -> SubscriptionPlan:
        """
        Get the effective plan for an organization.

        If organization has an active subscription, returns the subscribed plan.
        Otherwise, returns the default free plan.

        Args:
            org_id: Organization ID

        Returns:
            The effective SubscriptionPlan
        """
        subscription = self.subscription_repo.find_active_by_organization(org_id)
        if subscription:
            return subscription.plan

        # Return free plan as default
        free_plan = self.plan_repo.get_default_plan()
        if not free_plan:
            # Create default free plan if not exists
            free_plan = SubscriptionPlan(
                name="Free",
                code="free",
                price_monthly=0,
                price_yearly=0,
                max_apartments=1,
                max_rooms=100,
                max_members=1,
            )

        # Check for active subscription
        subscription = self.subscription_repo.find_active_by_organization(org_id)
        if subscription:
            return subscription.plan

        # Check for organization's plan field
        org = self.org_repo.get(org_id)
        if org and org.plan:
            plan = self.plan_repo.find_by_code(org.plan)
            if plan:
                return plan

        # Return free plan as default
        free_plan = self.plan_repo.find_by_code("free")
        if free_plan:
            return free_plan

        # Fallback to default free plan values
        return SubscriptionPlan(
            id="default-free",
            name="Free",
            code="free",
            description="Default free plan",
            price_monthly=0,
            price_yearly=0,
            max_apartments=1,
            max_rooms=100,
            max_members=1,
            is_active=True,
            sort_order=0,
        )

    def subscribe(
        self,
        org_id: str,
        data: SubscribeRequest,
    ) -> OrganizationSubscription:
        """
        Subscribe an organization to a plan.

        Args:
            org_id: Organization ID
            data: Subscribe request data

        Returns:
            Created/updated subscription

        Raises:
            ValueError: If plan not found
        """
        plan = self.plan_repo.get(data.plan_id)
        if not plan:
            raise ValueError("订阅套餐不存在")

        # Calculate end date based on billing cycle
        start_date = date.today()
        if data.billing_cycle == BillingCycle.YEARLY.value:
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)

        # Create or update subscription
        subscription = self.subscription_repo.create_or_update(
            org_id=org_id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=data.billing_cycle,
            start_date=start_date,
            end_date=end_date,
            auto_renew=data.auto_renew,
        )

        # Update organization's plan field
        org = self.org_repo.get(org_id)
        if org:
            self.org_repo.update(org_id, plan=plan.code)

        return subscription

    def change_plan(
        self,
        org_id: str,
        data: ChangePlanRequest,
    ) -> OrganizationSubscription:
        """
        Change subscription plan.

        Args:
            org_id: Organization ID
            data: Change plan request data

        Returns:
            Updated subscription

        Raises:
            ValueError: If no active subscription or plan not found
        """
        plan = self.plan_repo.get(data.plan_id)
        if not plan:
            raise ValueError("订阅套餐不存在")

        subscription = self.subscription_repo.find_by_organization(org_id)
        if not subscription:
            raise ValueError("组织没有订阅")

        # Calculate new end date if billing cycle changed
        billing_cycle = data.billing_cycle or subscription.billing_cycle
        if billing_cycle != subscription.billing_cycle:
            start_date = date.today()
            if billing_cycle == BillingCycle.YEARLY.value:
                end_date = start_date + timedelta(days=365)
            else:
                end_date = start_date + timedelta(days=30)
        else:
            start_date = subscription.start_date
            end_date = subscription.end_date

        # Update subscription
        updated = self.subscription_repo.create_or_update(
            org_id=org_id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            billing_cycle=billing_cycle,
            start_date=start_date,
            end_date=end_date,
            auto_renew=subscription.auto_renew,
        )

        # Update organization's plan field
        org = self.org_repo.get(org_id)
        if org:
            self.org_repo.update(org_id, plan=plan.code)

        return updated

    def cancel_subscription(self, org_id: str, reason: str | None = None) -> OrganizationSubscription:
        """
        Cancel subscription.

        Args:
            org_id: Organization ID
            reason: Cancellation reason (optional)

        Returns:
            Cancelled subscription

        Raises:
            ValueError: If no active subscription
        """
        subscription = self.subscription_repo.find_by_organization(org_id)
        if not subscription:
            raise ValueError("组织没有订阅")

        # Cancel subscription
        cancelled = self.subscription_repo.cancel_subscription(org_id)

        # Downgrade to free plan
        free_plan = self.plan_repo.find_by_code("free")
        if free_plan:
            org = self.org_repo.get(org_id)
            if org:
                self.org_repo.update(org_id, plan="free")

        return cancelled

    def check_subscription_status(self, org_id: str) -> dict:
        """
        Check subscription status for an organization.

        Args:
            org_id: Organization ID

        Returns:
            Dict with subscription status info
        """
        subscription = self.subscription_repo.find_by_organization(org_id)
        plan = self.get_organization_plan(org_id)

        result = {
            "has_subscription": subscription is not None,
            "plan": plan,
            "status": subscription.status if subscription else "none",
            "is_active": subscription and subscription.status == SubscriptionStatus.ACTIVE,
            "end_date": subscription.end_date if subscription else None,
            "auto_renew": subscription.auto_renew if subscription else False,
            "days_remaining": None,
        }

        if subscription and subscription.end_date:
            days = (subscription.end_date - date.today()).days
            result["days_remaining"] = max(0, days)

        return result
