"""
APScheduler configuration for scheduled tasks.

This module provides a centralized scheduler for background tasks
such as automatic bill generation.
"""

from typing import Optional

from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.configs.logging import get_logger

logger = get_logger(__name__)

# Global scheduler instance
_scheduler: BackgroundScheduler | None = None


def get_scheduler() -> BackgroundScheduler:
    """Get or create the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler(
            jobstores={"default": MemoryJobStore()},
            timezone="Asia/Shanghai",
        )
    return _scheduler


def start_scheduler() -> None:
    """Start the scheduler if not already running."""
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler started successfully")


def shutdown_scheduler(wait: bool = True) -> None:
    """Shutdown the scheduler gracefully."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=wait)
        logger.info("Scheduler shut down successfully")
        _scheduler = None


def schedule_bill_generation() -> None:
    """
    Schedule the automatic bill generation job.

    Runs daily at 00:05 to check for bills that need to be generated
    for the current billing period.
    """
    scheduler = get_scheduler()

    # Import here to avoid circular imports
    from app.scheduler.jobs.bill_generation import generate_monthly_bills

    # Schedule bill generation: runs at 00:05 on the 1st of every month
    scheduler.add_job(
        generate_monthly_bills,
        trigger=CronTrigger(day=1, hour=0, minute=5),
        id="monthly_bill_generation",
        name="Monthly Bill Generation",
        replace_existing=True,
        misfire_grace_time=3600,  # Allow 1 hour grace period for misfires
    )
    logger.info("Scheduled monthly bill generation job (runs on 1st of each month at 00:05)")


def schedule_all_jobs() -> None:
    """Schedule all background jobs."""
    schedule_bill_generation()
    schedule_notification_checks()
    # Add more job scheduling here as needed
    logger.info("All scheduled jobs configured")


def schedule_notification_checks() -> None:
    """
    Schedule notification check jobs.

    - Check for expiring leases daily at 08:00
    - Check for overdue bills daily at 08:05
    """
    scheduler = get_scheduler()

    # Import here to avoid circular imports
    from app.scheduler.jobs.notification_checks import (
        check_expiring_leases,
        check_overdue_bills,
    )

    # Check for expiring leases daily at 08:00
    scheduler.add_job(
        check_expiring_leases,
        trigger=CronTrigger(hour=8, minute=0),
        id="check_expiring_leases",
        name="Check Expiring Leases",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    logger.info("Scheduled expiring leases check job (runs daily at 08:00)")

    # Check for overdue bills daily at 08:05
    scheduler.add_job(
        check_overdue_bills,
        trigger=CronTrigger(hour=8, minute=5),
        id="check_overdue_bills",
        name="Check Overdue Bills",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    logger.info("Scheduled overdue bills check job (runs daily at 08:05)")
