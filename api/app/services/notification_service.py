"""
Notification service for managing user notifications.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.organization import MemberRole
from app.repositories.bill_repository import BillRepository
from app.repositories.lease_repository import LeaseRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.organization_repository import OrganizationMemberRepository
from app.services.base import BaseService


class NotificationService(BaseService):
    """Service for notification management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.notification_repo = NotificationRepository(db)
        self.member_repo = OrganizationMemberRepository(db)
        self.lease_repo = LeaseRepository(db)
        self.bill_repo = BillRepository(db)

    def list_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Notification]:
        """List notifications for a user."""
        return self.notification_repo.find_by_user(user_id, unread_only, limit, offset)

    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications."""
        return self.notification_repo.count_unread(user_id)

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark a notification as read."""
        return self.notification_repo.mark_as_read(notification_id, user_id)

    def mark_all_as_read(self, user_id: str, org_id: str | None = None) -> int:
        """Mark all notifications as read."""
        return self.notification_repo.mark_all_as_read(user_id, org_id)

    def create_notification(
        self,
        user_id: str,
        org_id: str,
        notification_type: NotificationType,
        title: str,
        content: str,
        extra_data: dict | None = None,
    ) -> Notification:
        """Create a new notification."""
        notification = Notification(
            user_id=user_id,
            organization_id=org_id,
            type=notification_type,
            title=title,
            content=content,
            extra_data=extra_data or {},
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def notify_lease_expiring(
        self,
        lease_id: str,
        org_id: str,
        tenant_name: str,
        room_number: str,
        end_date: date,
        days_remaining: int,
    ) -> None:
        """Send lease expiring notification to organization owners/admins."""
        # Get organization admins and owners
        members = self.member_repo.find_organization_members(org_id)
        recipients = [m for m in members if m.role in [MemberRole.OWNER, MemberRole.ADMIN]]

        title = f"租约即将到期 - {tenant_name}"
        content = f"租客 {tenant_name}（房间 {room_number}）的租约将在 {days_remaining} 天后到期（{end_date}）。请及时处理续约或退房事宜。"

        for recipient in recipients:
            # Check if already notified recently
            if self.notification_repo.exists_for_entity(
                user_id=recipient.user_id,
                notification_type=NotificationType.LEASE_EXPIRING,
                entity_type="lease",
                entity_id=lease_id,
                days=3,  # Don't re-notify within 3 days
            ):
                continue

            self.create_notification(
                user_id=recipient.user_id,
                org_id=org_id,
                notification_type=NotificationType.LEASE_EXPIRING,
                title=title,
                content=content,
                extra_data={
                    "lease_id": lease_id,
                    "tenant_name": tenant_name,
                    "room_number": room_number,
                    "end_date": str(end_date),
                    "days_remaining": days_remaining,
                },
            )

    def notify_bill_overdue(
        self,
        bill_id: str,
        org_id: str,
        tenant_name: str,
        room_number: str,
        amount: float,
        due_date: date,
        days_overdue: int,
    ) -> None:
        """Send bill overdue notification."""
        members = self.member_repo.find_organization_members(org_id)
        recipients = [m for m in members if m.role in [MemberRole.OWNER, MemberRole.ADMIN]]

        title = f"账单逾期提醒 - {tenant_name}"
        content = f"租客 {tenant_name}（房间 {room_number}）的账单已逾期 {days_overdue} 天。金额: ¥{amount:.2f}，截止日期: {due_date}。"

        for recipient in recipients:
            if self.notification_repo.exists_for_entity(
                user_id=recipient.user_id,
                notification_type=NotificationType.BILL_OVERDUE,
                entity_type="bill",
                entity_id=bill_id,
                days=3,
            ):
                continue

            self.create_notification(
                user_id=recipient.user_id,
                org_id=org_id,
                notification_type=NotificationType.BILL_OVERDUE,
                title=title,
                content=content,
                extra_data={
                    "bill_id": bill_id,
                    "tenant_name": tenant_name,
                    "room_number": room_number,
                    "amount": amount,
                    "due_date": str(due_date),
                    "days_overdue": days_overdue,
                },
            )

    def notify_payment_received(
        self,
        bill_id: str,
        org_id: str,
        tenant_name: str,
        amount: float,
    ) -> None:
        """Send payment received notification."""
        members = self.member_repo.find_organization_members(org_id)
        recipients = [m for m in members if m.role in [MemberRole.OWNER, MemberRole.ADMIN]]

        title = f"收款通知 - {tenant_name}"
        content = f"租客 {tenant_name} 已支付 ¥{amount:.2f}。"

        for recipient in recipients:
            self.create_notification(
                user_id=recipient.user_id,
                org_id=org_id,
                notification_type=NotificationType.PAYMENT_RECEIVED,
                title=title,
                content=content,
                extra_data={
                    "bill_id": bill_id,
                    "tenant_name": tenant_name,
                    "amount": amount,
                },
            )

    def check_and_notify_expiring_leases(self) -> dict:
        """
        Check for expiring leases and send notifications.

        This is called by the scheduler job.

        Returns:
            Statistics about notifications sent
        """
        today = date.today()
        stats = {"lease_expiring_7": 0, "lease_expiring_3": 0, "lease_expiring_1": 0}

        # Check for leases expiring in 7, 3, and 1 days
        for days in [7, 3, 1]:
            target_date = today + timedelta(days=days)
            leases = self.lease_repo.find_expiring_on(target_date)

            for lease in leases:
                try:
                    self.notify_lease_expiring(
                        lease_id=lease.id,
                        org_id=lease.room.apartment.organization_id,
                        tenant_name=lease.tenant.name,
                        room_number=lease.room.room_number,
                        end_date=lease.end_date,
                        days_remaining=days,
                    )
                    stats[f"lease_expiring_{days}"] += 1
                except Exception:
                    pass  # Log error but continue

        return stats

    def check_and_notify_overdue_bills(self) -> dict:
        """
        Check for overdue bills and send notifications.

        This is called by the scheduler job.

        Returns:
            Statistics about notifications sent
        """
        today = date.today()
        stats = {"bills_overdue": 0}

        # Find all overdue bills
        overdue_bills = self.bill_repo.find_overdue(today)

        for bill in overdue_bills:
            try:
                days_overdue = (today - bill.due_date).days
                self.notify_bill_overdue(
                    bill_id=bill.id,
                    org_id=bill.lease.room.apartment.organization_id,
                    tenant_name=bill.lease.tenant.name,
                    room_number=bill.lease.room.room_number,
                    amount=float(bill.total_amount),
                    due_date=bill.due_date,
                    days_overdue=days_overdue,
                )
                stats["bills_overdue"] += 1
            except Exception:
                pass

        return stats
