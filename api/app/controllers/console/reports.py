"""
Report controller - handles analytics and reports.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.report_service import ReportService
from app.controllers.common.deps import get_org_membership

router = APIRouter()


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    """Get report service instance."""
    return ReportService(db)


@router.get("/overview")
def get_overview(
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    db: Session = Depends(get_db),
):
    """Get dashboard overview statistics."""
    get_org_membership(org_id, current_user, db)
    return report_service.get_overview(org_id)


@router.get("/income")
def get_income_report(
    org_id: int = Query(...),
    year: int = Query(...),
    start_month: Optional[int] = Query(None),
    end_month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    db: Session = Depends(get_db),
):
    """Get income report."""
    get_org_membership(org_id, current_user, db)
    return report_service.get_income_report(org_id, year, start_month, end_month)


@router.get("/occupancy")
def get_occupancy_report(
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
    db: Session = Depends(get_db),
):
    """Get occupancy report."""
    get_org_membership(org_id, current_user, db)
    return report_service.get_occupancy_report(org_id)
