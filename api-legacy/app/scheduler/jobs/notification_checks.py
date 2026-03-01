"""
Notification check jobs.

These jobs run daily to check for expiring leases, overdue bills,
and other notification-worthy events.
"""

from app.configs.database import SessionLocal
from app.configs.logging import get_logger
from app.services.notification_service import NotificationService

logger = get_logger(__name__)


def check_expiring_leases() -> dict:
    """
    Check for expiring leases and send notifications.

    Runs daily at 08:00.

    Returns:
        Dict with statistics about notifications sent
    """
    logger.info("Starting expiring leases check job")

    db = SessionLocal()
    try:
        service = NotificationService(db)
        stats = service.check_and_notify_expiring_leases()
        logger.info(f"Expiring leases check completed: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Expiring leases check job failed: {e}")
        return {"error": str(e)}
    finally:
        db.close()


def check_overdue_bills() -> dict:
    """
    Check for overdue bills and send notifications.

    Runs daily at 08:05.

    Returns:
        Dict with statistics about notifications sent
    """
    logger.info("Starting overdue bills check job")

    db = SessionLocal()
    try:
        service = NotificationService(db)
        stats = service.check_and_notify_overdue_bills()
        logger.info(f"Overdue bills check completed: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Overdue bills check job failed: {e}")
        return {"error": str(e)}
    finally:
        db.close()
