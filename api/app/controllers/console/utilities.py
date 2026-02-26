"""
Utility controller - handles utility reading management.
"""
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.utility_service import UtilityService
from app.schemas.utility import (
    UtilityReadingCreate,
    UtilityReadingUpdate,
    UtilityReadingResponse,
    BatchUtilityReadingCreate,
)
from app.controllers.common.errors import NotFoundError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_utility_service(db: Session = Depends(get_db)) -> UtilityService:
    """Get utility service instance."""
    return UtilityService(db)


@router.get("", response_model=List[UtilityReadingResponse])
def list_readings(
    org_id: int = Query(...),
    room_id: int = Query(None),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """List utility readings."""
    get_org_membership(org_id, current_user, db)
    return utility_service.list_readings(org_id, room_id)


@router.post("", response_model=UtilityReadingResponse, status_code=status.HTTP_201_CREATED)
def create_reading(
    data: UtilityReadingCreate,
    org_id: int = Query(...),
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
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    utility_service: UtilityService = Depends(get_utility_service),
    db: Session = Depends(get_db),
):
    """Batch create utility readings."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    return utility_service.batch_create_readings(org_id, data.readings)


@router.get("/{reading_id}", response_model=UtilityReadingResponse)
def get_reading(
    reading_id: int,
    org_id: int = Query(...),
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
    reading_id: int,
    data: UtilityReadingUpdate,
    org_id: int = Query(...),
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
    reading_id: int,
    org_id: int = Query(...),
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
