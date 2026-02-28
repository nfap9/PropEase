"""
运营侧订阅管理：套餐 CRUD、订阅列表、手动续期/取消。
"""
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.subscription import (
    OrganizationSubscription,
    SubscriptionPlan,
    SubscriptionStatus,
)
from app.repositories.subscription_repository import (
    OrganizationSubscriptionRepository,
    SubscriptionPlanRepository,
)
from app.schemas.subscription import (
    SubscriptionPlanCreate,
    SubscriptionPlanUpdate,
)


class AdminSubscriptionService:
    def __init__(self, db: Session):
        self.db = db
        self.plan_repo = SubscriptionPlanRepository(db)
        self.sub_repo = OrganizationSubscriptionRepository(db)

    # ==================== 套餐 ====================

    def list_plans(self, active_only: bool = False) -> list[SubscriptionPlan]:
        if active_only:
            return self.plan_repo.find_active_plans()
        return self.plan_repo.get_all(limit=100)

    def get_plan(self, plan_id: str) -> SubscriptionPlan | None:
        return self.plan_repo.get(plan_id)

    def create_plan(self, data: SubscriptionPlanCreate) -> SubscriptionPlan:
        if self.plan_repo.find_by_code(data.code):
            raise ValueError("套餐代码已存在")
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

    def update_plan(
        self, plan_id: str, data: SubscriptionPlanUpdate
    ) -> SubscriptionPlan | None:
        kwargs = data.model_dump(exclude_unset=True)
        return self.plan_repo.update(plan_id, **kwargs)

    def delete_plan(self, plan_id: str) -> bool:
        return self.plan_repo.delete(plan_id)

    # ==================== 订阅 ====================

    def list_subscriptions(
        self,
        skip: int = 0,
        limit: int = 100,
        organization_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> list[OrganizationSubscription]:
        query = self.db.query(OrganizationSubscription).options(
            joinedload(OrganizationSubscription.plan)
        )
        if organization_id:
            query = query.filter(
                OrganizationSubscription.organization_id == organization_id
            )
        if status:
            query = query.filter(OrganizationSubscription.status == status)
        return query.offset(skip).limit(limit).all()

    def get_subscription(
        self, subscription_id: str
    ) -> OrganizationSubscription | None:
        return (
            self.db.query(OrganizationSubscription)
            .options(joinedload(OrganizationSubscription.plan))
            .filter(OrganizationSubscription.id == subscription_id)
            .first()
        )

    def renew_subscription(
        self, subscription_id: str, extend_days: int
    ) -> OrganizationSubscription | None:
        sub = self.sub_repo.get(subscription_id)
        if not sub:
            return None
        current_end = sub.end_date or date.today()
        new_end = current_end + timedelta(days=extend_days)
        sub.end_date = new_end
        if sub.status == SubscriptionStatus.EXPIRED:
            sub.status = SubscriptionStatus.ACTIVE
        self.db.commit()
        self.db.refresh(sub)
        return sub

    def cancel_subscription(
        self, subscription_id: str
    ) -> OrganizationSubscription | None:
        sub = self.sub_repo.get(subscription_id)
        if not sub:
            return None
        sub.status = SubscriptionStatus.CANCELLED
        sub.auto_renew = False
        self.db.commit()
        self.db.refresh(sub)
        return sub