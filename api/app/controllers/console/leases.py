"""
Lease controller - handles lease management.
"""
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.lease_service import LeaseService
from app.schemas.lease import LeaseCreate, LeaseUpdate, LeaseResponse
from app.controllers.common.errors import NotFoundError, BadRequestError
from app.controllers.common.deps import get_org_membership, require_role

router = APIRouter()


def get_lease_service(db: Session = Depends(get_db)) -> LeaseService:
    """Get lease service instance."""
    return LeaseService(db)


@router.get("", response_model=List[LeaseResponse])
def list_leases(
    org_id: str = Query(...),
    active_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """List all leases in organization."""
    get_org_membership(org_id, current_user, db)
    return lease_service.list_leases(org_id, active_only)


@router.post("", response_model=LeaseResponse, status_code=status.HTTP_201_CREATED)
def create_lease(
    data: LeaseCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """Create a new lease."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        return lease_service.create_lease(org_id, data)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.get("/{lease_id}", response_model=LeaseResponse)
def get_lease(
    lease_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """Get lease by ID."""
    get_org_membership(org_id, current_user, db)
    lease = lease_service.get_lease(lease_id, org_id)
    if not lease:
        raise NotFoundError("Lease")
    return lease


@router.put("/{lease_id}", response_model=LeaseResponse)
def update_lease(
    lease_id: str,
    data: LeaseUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """Update lease."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        lease = lease_service.update_lease(lease_id, org_id, data)
        if not lease:
            raise NotFoundError("Lease")
        return lease
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/{lease_id}/terminate")
def terminate_lease(
    lease_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """Terminate a lease."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(
        get_org_membership(org_id, current_user, db)
    )
    lease = lease_service.terminate_lease(lease_id, org_id)
    if not lease:
        raise NotFoundError("Lease")
    return {"message": "Lease terminated successfully", "lease": lease}


@router.delete("/{lease_id}")
def delete_lease(
    lease_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    lease_service: LeaseService = Depends(get_lease_service),
    db: Session = Depends(get_db),
):
    """Delete lease (only terminated leases can be deleted)."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN])(
        get_org_membership(org_id, current_user, db)
    )
    try:
        if not lease_service.delete_lease(lease_id, org_id):
            raise NotFoundError("Lease")
        return {"message": "Lease deleted successfully"}
    except ValueError as e:
        raise BadRequestError(str(e))
