"""
运营分析：平台级统计。
"""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.apartment import Apartment, Room
from app.models.organization import Organization
from app.models.subscription import OrganizationSubscription, SubscriptionStatus
from app.models.user import User


class AdminStatsService:
    def __init__(self, db: Session):
        self.db = db

    def get_platform_stats(self) -> dict:
        """平台级统计：组织数、用户数、公寓数、房间数、活跃订阅数等。"""
        org_count = self.db.query(func.count(Organization.id)).scalar() or 0
        user_count = self.db.query(func.count(User.id)).scalar() or 0
        apartment_count = self.db.query(func.count(Apartment.id)).scalar() or 0
        room_count = self.db.query(func.count(Room.id)).scalar() or 0
        active_sub_count = (
            self.db.query(func.count(OrganizationSubscription.id))
            .filter(OrganizationSubscription.status == SubscriptionStatus.ACTIVE)
            .scalar()
            or 0
        )
        return {
            "organizations_count": org_count,
            "users_count": user_count,
            "apartments_count": apartment_count,
            "rooms_count": room_count,
            "active_subscriptions_count": active_sub_count,
        }
