"""
Notification repository for data access operations.
"""


from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository for Notification model."""

    def __init__(self, db: Session):
        super().__init__(db, Notification)

    def find_by_user(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        """Find notifications for a user."""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    def count_unread(self, user_id: str) -> int:
        """Count unread notifications for a user."""
        return (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .count()
        )

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        notification = (
            self.db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if notification:
            notification.is_read = True
            self.db.commit()
            return True
        return False

    def mark_all_as_read(self, user_id: str, org_id: str | None = None) -> int:
        """Mark all notifications as read for a user."""
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        if org_id:
            query = query.filter(Notification.organization_id == org_id)

        count = query.count()
        query.update({"is_read": True})
        self.db.commit()
        return count

    def find_by_type_and_metadata(
        self,
        user_id: str,
        notification_type: NotificationType,
        metadata_key: str,
        metadata_value: str,
    ) -> Notification | None:
        """Find a notification by type and metadata value."""
        return (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.type == notification_type,
                Notification.metadata[metadata_key].as_string() == metadata_value,
            )
            .first()
        )

    def exists_for_entity(
        self,
        user_id: str,
        notification_type: NotificationType,
        entity_type: str,
        entity_id: str,
        days: int = 7,
    ) -> bool:
        """
        Check if a notification already exists for an entity within recent days.

        This prevents duplicate notifications for the same event.
        """
        from datetime import datetime, timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)
        return (
            self.db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.type == notification_type,
                Notification.created_at >= cutoff,
            )
            .first()
            is not None
        )
