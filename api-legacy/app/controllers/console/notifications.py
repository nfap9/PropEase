"""
Notification controller - handles user notifications.
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import NotFoundError
from app.dependencies import get_current_user
from app.models.notification import NotificationType
from app.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter()


class NotificationResponse(BaseModel):
    """Response model for notification."""

    id: str
    type: NotificationType
    title: str
    content: str
    is_read: bool
    extra_data: dict | None
    created_at: str

    class Config:
        from_attributes = True


class UnreadCountResponse(BaseModel):
    """Response model for unread count."""

    unread_count: int


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    """Get notification service instance."""
    return NotificationService(db)


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """List notifications for current user."""
    notifications = service.list_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )
    return [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            content=n.content,
            is_read=n.is_read,
            extra_data=n.extra_data,
            created_at=n.created_at.isoformat(),
        )
        for n in notifications
    ]


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Get count of unread notifications."""
    count = service.get_unread_count(current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Mark a notification as read."""
    if not service.mark_as_read(notification_id, current_user.id):
        raise NotFoundError("Notification")
    return {"message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_as_read(
    org_id: str | None = Query(None, description="Only mark notifications for this organization"),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    """Mark all notifications as read."""
    count = service.mark_all_as_read(current_user.id, org_id)
    return {"message": f"Marked {count} notifications as read"}
