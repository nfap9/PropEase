"""
Subscription order repository for payment order data access.
"""

from sqlalchemy.orm import Session

from app.models.subscription import SubscriptionOrder, SubscriptionOrderStatus
from app.repositories.base import BaseRepository


class SubscriptionOrderRepository(BaseRepository[SubscriptionOrder]):
    """Repository for SubscriptionOrder model."""

    def __init__(self, db: Session):
        super().__init__(db, SubscriptionOrder)

    def find_by_order_no(self, order_no: str) -> SubscriptionOrder | None:
        """Find order by merchant order number (out_trade_no)."""
        return self.db.query(SubscriptionOrder).filter(SubscriptionOrder.order_no == order_no).first()

    def find_by_organization(
        self,
        organization_id: str,
        status: SubscriptionOrderStatus | None = None,
        limit: int = 50,
    ) -> list[SubscriptionOrder]:
        """Find orders by organization ID, optionally filtered by status."""
        query = self.db.query(SubscriptionOrder).filter(SubscriptionOrder.organization_id == organization_id)
        if status is not None:
            query = query.filter(SubscriptionOrder.status == status)
        return query.order_by(SubscriptionOrder.created_at.desc()).limit(limit).all()
