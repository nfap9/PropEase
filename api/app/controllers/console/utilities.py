"""
Utility controller - handles utility reading management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.utility_service import UtilityService
from app.schemas.utility import (
    UtilityReadingCreate,
    UtilityReadingUpdate,
    UtilityReadingResponse,
    BatchUtilityReadingCreate,
    UtilityExportRoom,
)
from app.controllers.common.errors import NotFoundError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_utility_service(db: Session = Depends(get_db)) -> UtilityService:
    """Get utility service instance."""
    return UtilityService(db)


@router.get("", response_model=List[UtilityReadingResponse])
def list_readings(
    org_id: str = Query(...),
    room_id: str = Query(None),
    period_year: int = Query(None, description="筛选年份"),
    period_month: int = Query(None, description="筛选月份"),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """List utility readings."""
    get_org_membership(org_id, current_user, db)
    return utility_service.list_readings(org_id, room_id, period_year, period_month)


@router.post("", response_model=UtilityReadingResponse, status_code=status.HTTP_201_CREATED)
def create_reading(
    data: UtilityReadingCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Create a new utility reading."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    return utility_service.create_reading(org_id, data)


@router.post("/batch", response_model=List[UtilityReadingResponse])
def batch_create_readings(
    data: BatchUtilityReadingCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Batch create utility readings."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    return utility_service.batch_create_readings(
        org_id=org_id,
        period_year=data.period_year,
        period_month=data.period_month,
        reading_date=data.reading_date,
        readings=data.readings,
    )


@router.get("/export", response_model=List[UtilityExportRoom])
def export_rooms(
    org_id: str = Query(...),
    period_year: int = Query(...),
    period_month: int = Query(...),
    days_range: Optional[int] = Query(None, description="时间范围（天数），不填则返回全部"),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """
    导出待录入水电的房间列表。

    Args:
        org_id: 组织ID
        period_year: 账单年份
        period_month: 账单月份
        days_range: 时间范围（天数），不填则返回全部待录入房间
    """
    get_org_membership(org_id, current_user, db)
    return utility_service.export_rooms_for_reading(
        org_id=org_id,
        period_year=period_year,
        period_month=period_month,
        days_range=days_range,
    )


@router.get("/{reading_id}", response_model=UtilityReadingResponse)
def get_reading(
    reading_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Get utility reading by ID."""
    get_org_membership(org_id, current_user, db)
    reading = utility_service.get_reading(reading_id, org_id)
    if not reading:
        raise NotFoundError("Utility reading")
    return reading


@router.put("/{reading_id}", response_model=UtilityReadingResponse)
def update_reading(
    reading_id: str,
    data: UtilityReadingUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Update utility reading."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    reading = utility_service.update_reading(reading_id, org_id, data)
    if not reading:
        raise NotFoundError("Utility reading")
    return reading


@router.delete("/{reading_id}")
def delete_reading(
    reading_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Delete utility reading."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    if not utility_service.delete_reading(reading_id, org_id):
        raise NotFoundError("Utility reading")
    return {"message": "Utility reading deleted successfully"}
