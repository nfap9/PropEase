"""
Automatic bill generation job.

This job runs monthly to generate bills for all active leases.
It uses utility configurations and readings to calculate bill amounts.
"""

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.configs.database import SessionLocal
from app.configs.logging import get_logger
from app.models.bill import Bill, BillStatus
from app.models.lease import Lease
from app.repositories.bill_repository import BillRepository
from app.repositories.lease_repository import LeaseRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.utility_config_repository import UtilityConfigRepository
from app.repositories.utility_repository import UtilityRepository

logger = get_logger(__name__)


def generate_monthly_bills() -> dict:
    """
    Generate bills for all active leases for the current billing period.

    This job:
    1. Finds all organizations with active subscriptions
    2. For each organization, finds all active leases
    3. Checks if a bill already exists for the current period
    4. If not, creates a new bill with calculated amounts

    Returns:
        Dict with statistics about generated bills
    """
    logger.info("Starting monthly bill generation job")

    db = SessionLocal()
    stats = {
        "organizations_processed": 0,
        "bills_created": 0,
        "bills_skipped": 0,
        "errors": 0,
    }

    try:
        # Determine billing period (previous month)
        today = date.today()
        # Generate bills for the previous month
        if today.month == 1:
            bill_year = today.year - 1
            bill_month = 12
        else:
            bill_year = today.year
            bill_month = today.month - 1

        # Default due date: 15th of current month
        due_date = date(today.year, today.month, 15)

        bill_repo = BillRepository(db)
        lease_repo = LeaseRepository(db)
        org_repo = OrganizationRepository(db)
        utility_repo = UtilityRepository(db)
        config_repo = UtilityConfigRepository(db)

        # Get all organizations (use high limit for batch processing)
        orgs = org_repo.get_all(limit=10000)

        for org in orgs:
            try:
                stats["organizations_processed"] += 1

                # Get active leases for this organization
                active_leases = lease_repo.find_active_by_organization(org.id)

                for lease in active_leases:
                    try:
                        # Check if bill already exists for this period
                        if bill_repo.exists_for_period(lease.id, bill_year, bill_month):
                            stats["bills_skipped"] += 1
                            continue

                        # Create bill for this lease
                        bill = _create_bill_for_lease(
                            db=db,
                            lease=lease,
                            bill_year=bill_year,
                            bill_month=bill_month,
                            due_date=due_date,
                            bill_repo=bill_repo,
                            utility_repo=utility_repo,
                            config_repo=config_repo,
                        )

                        if bill:
                            stats["bills_created"] += 1
                            logger.info(f"Created bill for lease {lease.id}, period {bill_year}-{bill_month:02d}")
                        else:
                            stats["bills_skipped"] += 1

                    except Exception as e:
                        stats["errors"] += 1
                        logger.error(f"Error creating bill for lease {lease.id}: {e}")
                        continue

            except Exception as e:
                logger.error(f"Error processing organization {org.id}: {e}")
                continue

        db.commit()
        logger.info(f"Bill generation completed: {stats}")

    except Exception as e:
        db.rollback()
        logger.error(f"Bill generation job failed: {e}")
        stats["errors"] += 1
    finally:
        db.close()

    return stats


def _create_bill_for_lease(
    db: Session,
    lease: Lease,
    bill_year: int,
    bill_month: int,
    due_date: date,
    bill_repo: BillRepository,
    utility_repo: UtilityRepository,
    config_repo: UtilityConfigRepository,
) -> Bill | None:
    """
    Create a bill for a specific lease.

    Args:
        db: Database session
        lease: The lease to create a bill for
        bill_year: Billing year
        bill_month: Billing month
        due_date: Bill due date
        bill_repo: Bill repository
        utility_repo: Utility reading repository
        config_repo: Utility config repository

    Returns:
        Created bill or None if creation was skipped
    """
    # Get utility reading for this period
    reading = utility_repo.find_by_room_and_period(lease.room_id, bill_year, bill_month)

    # Get utility config for the apartment
    config = config_repo.find_by_apartment(lease.room.apartment_id)

    # Calculate rent amount (convert to Decimal for consistent calculations)
    rent_amount = Decimal(str(lease.monthly_rent))

    # Calculate water amount
    water_amount = _calculate_water_cost(lease, reading, config)

    # Calculate electricity amount
    electricity_amount = _calculate_electricity_cost(lease, reading, config)

    # Calculate additional fees from config
    other_amount = Decimal(0)
    if config:
        if config.internet_fee:
            other_amount += Decimal(str(config.internet_fee))
        if config.management_fee:
            other_amount += Decimal(str(config.management_fee))
        if config.service_fee:
            other_amount += Decimal(str(config.service_fee))

    # Calculate total
    total_amount = rent_amount + water_amount + electricity_amount + other_amount

    # Create the bill
    bill = Bill(
        lease_id=lease.id,
        bill_year=bill_year,
        bill_month=bill_month,
        due_date=due_date,
        rent_amount=rent_amount,
        water_amount=water_amount,
        electricity_amount=electricity_amount,
        other_amount=other_amount,
        total_amount=total_amount,
        status=BillStatus.PENDING,
    )

    db.add(bill)
    return bill


def _calculate_water_cost(
    lease: Lease,
    reading,
    config,
) -> Decimal:
    """
    Calculate water cost for a lease.

    Priority:
    1. Use reading with lease rate
    2. Use reading with config rate
    3. Return 0 if no reading or rate available
    """
    if not reading or not reading.water_reading or not reading.water_previous:
        return Decimal(0)

    usage = reading.water_reading - reading.water_previous
    if usage <= 0:
        return Decimal(0)

    # Use lease rate first, then config rate
    rate = lease.water_rate
    if rate is None and config and config.water_price_per_unit:
        rate = config.water_price_per_unit

    if rate is None:
        return Decimal(0)

    return Decimal(str(usage)) * Decimal(str(rate))


def _calculate_electricity_cost(
    lease: Lease,
    reading,
    config,
) -> Decimal:
    """
    Calculate electricity cost for a lease.

    Priority:
    1. Use reading with lease rate
    2. Use reading with config rate
    3. Return 0 if no reading or rate available
    """
    if not reading or not reading.electricity_reading or not reading.electricity_previous:
        return Decimal(0)

    usage = reading.electricity_reading - reading.electricity_previous
    if usage <= 0:
        return Decimal(0)

    # Use lease rate first, then config rate
    rate = lease.electricity_rate
    if rate is None and config and config.electricity_price_per_unit:
        rate = config.electricity_price_per_unit

    if rate is None:
        return Decimal(0)

    return Decimal(str(usage)) * Decimal(str(rate))


def generate_bills_for_organization(
    org_id: str,
    bill_year: int,
    bill_month: int,
    due_date: date | None = None,
) -> dict:
    """
    Manually trigger bill generation for a specific organization.

    This is useful for testing or manual operations.

    Args:
        org_id: Organization ID
        bill_year: Billing year
        bill_month: Billing month
        due_date: Optional due date (defaults to 15th of billing month)

    Returns:
        Dict with generation statistics
    """
    if due_date is None:
        due_date = date(bill_year, bill_month, 15)

    db = SessionLocal()
    stats = {
        "bills_created": 0,
        "bills_skipped": 0,
        "errors": 0,
    }

    try:
        bill_repo = BillRepository(db)
        lease_repo = LeaseRepository(db)
        utility_repo = UtilityRepository(db)
        config_repo = UtilityConfigRepository(db)

        active_leases = lease_repo.find_active_by_organization(org_id)

        for lease in active_leases:
            try:
                if bill_repo.exists_for_period(lease.id, bill_year, bill_month):
                    stats["bills_skipped"] += 1
                    continue

                bill = _create_bill_for_lease(
                    db=db,
                    lease=lease,
                    bill_year=bill_year,
                    bill_month=bill_month,
                    due_date=due_date,
                    bill_repo=bill_repo,
                    utility_repo=utility_repo,
                    config_repo=config_repo,
                )

                if bill:
                    stats["bills_created"] += 1
                else:
                    stats["bills_skipped"] += 1

            except Exception as e:
                stats["errors"] += 1
                logger.error(f"Error creating bill for lease {lease.id}: {e}")

        db.commit()

    except Exception as e:
        db.rollback()
        logger.error(f"Manual bill generation failed for org {org_id}: {e}")
        stats["errors"] += 1
    finally:
        db.close()

    return stats
