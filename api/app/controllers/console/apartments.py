"""
Apartment controller - handles apartment and room management.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.apartment import RoomStatus
from app.models.organization import MemberRole
from app.services.apartment_service import ApartmentService
from app.schemas.apartment import (
    ApartmentCreate,
    ApartmentUpdate,
    ApartmentResponse,
    RoomCreate,
    RoomUpdate,
    RoomResponse,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_apartment_service(db: Session = Depends(get_db)) -> ApartmentService:
    """Get apartment service instance."""
    return ApartmentService(db)


# ==================== Apartments ====================

@router.get("", response_model=List[ApartmentResponse])
def list_apartments(
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """List all apartments in organization."""
    get_org_membership(org_id, current_user, db)
    return apartment_service.list_apartments(org_id)


@router.post("", response_model=ApartmentResponse, status_code=status.HTTP_201_CREATED)
def create_apartment(
    data: ApartmentCreate,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Create a new apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    return apartment_service.create_apartment(org_id, data)


@router.get("/{apartment_id}", response_model=ApartmentResponse)
def get_apartment(
    apartment_id: int,
    org_id: int = Query(...),
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
    apartment_id: int,
    data: ApartmentUpdate,
    org_id: int = Query(...),
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
    apartment_id: int,
    org_id: int = Query(...),
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
    apartment_id: int,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """List all rooms in an apartment."""
    get_org_membership(org_id, current_user, db)
    return apartment_service.list_rooms(org_id, apartment_id)


@router.post("/{apartment_id}/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    apartment_id: int,
    data: RoomCreate,
    org_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    apartment_service: ApartmentService = Depends(get_apartment_service),
    db: Session = Depends(get_db),
):
    """Create a new room in apartment."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    room = apartment_service.create_room(apartment_id, org_id, data)
    if not room:
        raise NotFoundError("Apartment")
    return room


@router.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    org_id: int = Query(...),
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
    room_id: int,
    data: RoomUpdate,
    org_id: int = Query(...),
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
    room_id: int,
    org_id: int = Query(...),
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
