"""
Apartment controller - handles apartment and room management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.apartment import RoomStatus
from app.models.organization import MemberRole, Organization
from app.services.apartment_service import ApartmentService
from app.services.utility_config_service import UtilityConfigService
from app.services.plan_limit_service import PlanLimitService
from app.schemas.apartment import (
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentResponse,
    ApartmentWithStatsResponse,
    RoomCreate,
    RoomUpdate,
    RoomResponse,
    RoomBatchCreate,
)
from app.schemas.utility_config import (
    UtilityConfigCreate,
    UtilityConfigUpdate,
    UtilityConfigResponse,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_apartment_service(db: Session = Depends(get_db)) -> ApartmentService:
    """Get apartment service instance."""
    return ApartmentService(db)


def get_utility_config_service(db: Session = Depends(get_db)) -> UtilityConfigService:
    """Get utility config service instance."""
    return UtilityConfigService(db)


def get_plan_limit_service(db: Session = Depends(get_db)) -> PlanLimitService:
    """Get plan limit service instance."""
    return PlanLimitService(db)


# ==================== Apartments ====================

@router.get("", response_model=List[ApartmentWithStatsResponse])
def list_apartments(
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """List all apartments in organization with room statistics."""
    get_org_membership(org_id, current_user, db)
    return apartment_service.list_apartments_with_stats(org_id)


@router.post("", response_model=ApartmentResponse, status_code=status.HTTP_201_CREATED)
def create_apartment(
    data: ApartmentCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    plan_limit_service: PlanLimitService = Depends(get_plan_limit_service),
    db: Session = Depends(get_db),
):
    """Create a new apartment."""
    membership = require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    # Check plan limits
    org = membership.organization
    plan = org.plan if org else "free"
    error = plan_limit_service.check_apartment_limit(org_id, plan)
    if error:
        raise BadRequestError(error)
    return apartment_service.create_apartment(org_id, data)


@router.get("/{apartment_id}", response_model=ApartmentResponse)
def get_apartment(
    apartment_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Get apartment by ID."""
    get_org_membership(org_id, current_user, db)
    apartment = apartment_service.get_apartment(apartment_id, org_id)
    if not apartment:
        raise NotFoundError("Apartment")
    return apartment


@router.put("/{apartment_id}", response_model=ApartmentResponse)
def update_apartment(
    apartment_id: str,
    data: ApartmentUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Update apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    apartment = apartment_service.update_apartment(apartment_id, org_id, data)
    if not apartment:
        raise NotFoundError("Apartment")
    return apartment


@router.delete("/{apartment_id}")
def delete_apartment(
    apartment_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Delete apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    if not apartment_service.delete_apartment(apartment_id, org_id):
        raise NotFoundError("Apartment")
    return {"message": "Apartment deleted successfully"}


# ==================== Rooms ====================

@router.get("/{apartment_id}/rooms", response_model=List[RoomResponse])
def list_rooms(
    apartment_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """List all rooms in an apartment."""
    get_org_membership(org_id, current_user, db)
    return apartment_service.list_rooms(org_id, apartment_id)


@router.post("/{apartment_id}/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    apartment_id: str,
    data: RoomCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    plan_limit_service: PlanLimitService = Depends(get_plan_limit_service),
    db: Session = Depends(get_db),
):
    """Create a new room in apartment."""
    membership = require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    # Check plan limits
    org = membership.organization
    plan = org.plan if org else "free"
    error = plan_limit_service.check_room_limit(org_id, plan, 1)
    if error:
        raise BadRequestError(error)
    room = apartment_service.create_room(apartment_id, org_id, data)
    if not room:
        raise NotFoundError("Apartment")
    return room


@router.post("/{apartment_id}/rooms/batch", response_model=List[RoomResponse], status_code=status.HTTP_201_CREATED)
def batch_create_rooms(
    apartment_id: str,
    data: RoomBatchCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    plan_limit_service: PlanLimitService = Depends(get_plan_limit_service),
    db: Session = Depends(get_db),
):
    """Batch create rooms in apartment by floor."""
    membership = require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    # Check plan limits
    org = membership.organization
    plan = org.plan if org else "free"
    room_count = len(data.room_numbers)
    error = plan_limit_service.check_room_limit(org_id, plan, room_count)
    if error:
        raise BadRequestError(error)
    rooms = apartment_service.batch_create_rooms(apartment_id, org_id, data)
    if not rooms:
        raise NotFoundError("Apartment")
    return rooms


@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Get room by ID."""
    get_org_membership(org_id, current_user, db)
    room = apartment_service.get_room(room_id, org_id)
    if not room:
        raise NotFoundError("Room")
    return room


@router.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: str,
    data: RoomUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Update room."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    room = apartment_service.update_room(room_id, org_id, data)
    if not room:
        raise NotFoundError("Room")
    return room


@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Delete room."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    if not apartment_service.delete_room(room_id, org_id):
        raise NotFoundError("Room")
    return {"message": "Room deleted successfully"}


# ==================== Utility Config ====================

@router.get("/{apartment_id}/utility-config", response_model=UtilityConfigResponse)
def get_utility_config(
    apartment_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_config_service: UtilityConfigService = Depends(get_utility_config_service),
    db: Session = Depends(get_db),
):
    """Get utility pricing config for an apartment."""
    get_org_membership(org_id, current_user, db)
    config = utility_config_service.get_config(apartment_id, org_id)
    if not config:
        raise NotFoundError("Utility config")
    return config


@router.post("/{apartment_id}/utility-config", response_model=UtilityConfigResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_utility_config(
    apartment_id: str,
    data: UtilityConfigCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_config_service: UtilityConfigService = Depends(get_utility_config_service),
    db: Session = Depends(get_db),
):
    """Create or update utility pricing config for an apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    config = utility_config_service.create_or_update_config(apartment_id, org_id, data)
    if not config:
        raise NotFoundError("Apartment")
    return config


@router.put("/{apartment_id}/utility-config", response_model=UtilityConfigResponse)
def update_utility_config(
    apartment_id: str,
    data: UtilityConfigUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_config_service: UtilityConfigService = Depends(get_utility_config_service),
    db: Session = Depends(get_db),
):
    """Update utility pricing config for an apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    config = utility_config_service.update_config(apartment_id, org_id, data)
    if not config:
        raise NotFoundError("Utility config")
    return config


@router.delete("/{apartment_id}/utility-config")
def delete_utility_config(
    apartment_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    utility_config_service: UtilityConfigService = Depends(get_utility_config_service),
    db: Session = Depends(get_db),
):
    """Delete utility pricing config for an apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    if not utility_config_service.delete_config(apartment_id, org_id):
        raise NotFoundError("Utility config")
    return {"message": "Utility config deleted successfully"}
