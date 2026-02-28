"""
Subscription repository for data access operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.subscription import SubscriptionPlan, OrganizationSubscription, SubscriptionStatus


class SubscriptionPlanRepository(BaseRepository[SubscriptionPlan]):
    """Repository for SubscriptionPlan model."""

    def __init__(self, db: Session):
        super().__init__(db, SubscriptionPlan)

    def find_by_code(self, code: str) -> Optional[SubscriptionPlan]:
        """Find plan by code."""
        return (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.code == code)
            .first()
        )

    def find_active_plans(self) -> List[SubscriptionPlan]:
        """Find all active plans ordered by sort_order."""
        return (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.is_active == True)
            .order_by(SubscriptionPlan.sort_order)
            .all()
        )

    def get_default_plan(self) -> Optional[SubscriptionPlan]:
        """Get the default free plan."""
        return self.find_by_code("free")


class OrganizationSubscriptionRepository(BaseRepository[OrganizationSubscription]):
    """Repository for OrganizationSubscription model."""

    def __init__(self, db: Session):
        super().__init__(db, OrganizationSubscription)

    def find_by_organization(self, org_id: str) -> Optional[OrganizationSubscription]:
        """Find subscription by organization ID."""
        return (
            self.db.query(OrganizationSubscription)
            .filter(OrganizationSubscription.organization_id == org_id)
            .first()
        )

    def find_active_by_organization(self, org_id: str) -> Optional[OrganizationSubscription]:
        """Find active subscription by organization ID."""
        return (
            self.db.query(OrganizationSubscription)
            .filter(
                OrganizationSubscription.organization_id == org_id,
                OrganizationSubscription.status == SubscriptionStatus.ACTIVE,
            )
            .first()
        )

    def find_expiring_subscriptions(self, days: int = 7) -> List[OrganizationSubscription]:
        """
        Find subscriptions expiring within specified days.

        Args:
            days: Number of days to look ahead

        Returns:
            List of expiring subscriptions
        """
        from datetime import date, timedelta

        today = date.today()
        end_date = today + timedelta(days=days)

        return (
            self.db.query(OrganizationSubscription)
            .filter(
                OrganizationSubscription.status == SubscriptionStatus.ACTIVE,
                OrganizationSubscription.end_date != None,
                OrganizationSubscription.end_date <= end_date,
                OrganizationSubscription.end_date > today,
            )
            .all()
        )

    def create_or_update(
        self,
        org_id: str,
        plan_id: str,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        billing_cycle: str = "monthly",
        start_date=None,
        end_date=None,
        auto_renew: bool = True,
    ) -> OrganizationSubscription:
        """
        Create or update subscription for an organization.
        """
        from datetime import date

        subscription = self.find_by_organization(org_id)
        if subscription:
            subscription.plan_id = plan_id
            subscription.status = status
            subscription.billing_cycle = billing_cycle
            if start_date:
                subscription.start_date = start_date
            if end_date:
                subscription.end_date = end_date
            subscription.auto_renew = auto_renew
            self.db.commit()
            self.db.refresh(subscription)
            return subscription
        else:
            new_subscription = OrganizationSubscription(
                organization_id=org_id,
                plan_id=plan_id,
                status=status,
                billing_cycle=billing_cycle,
                start_date=start_date or date.today(),
                end_date=end_date,
                auto_renew=auto_renew,
            )
            return self.create(new_subscription)

    def activate_subscription(self, org_id: str) -> Optional[OrganizationSubscription]:
        """Activate subscription for an organization."""
        subscription = self.find_by_organization(org_id)
        if subscription:
            subscription.status = SubscriptionStatus.ACTIVE
            self.db.commit()
            self.db.refresh(subscription)
        return subscription

    def cancel_subscription(self, org_id: str) -> Optional[OrganizationSubscription]:
        """Cancel subscription for an organization."""
        subscription = self.find_by_organization(org_id)
        if subscription:
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.auto_renew = False
            self.db.commit()
            self.db.refresh(subscription)
        return subscription
