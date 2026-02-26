"""
Organization controller - handles organization management.
"""
from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.organization_service import OrganizationService
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    MemberResponse,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership

router = APIRouter()


def get_org_service(db: Session = Depends(get_db)) -> OrganizationService:
    """Get organization service instance."""
    return OrganizationService(db)


@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """List all organizations for current user."""
    return org_service.list_organizations(current_user.id)


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Create a new organization."""
    return org_service.create_organization(current_user.id, data)


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Get organization by ID."""
    org = org_service.get_organization(org_id, current_user.id)
    if not org:
        raise NotFoundError("Organization")
    return org


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Update organization."""
    org = org_service.update_organization(org_id, current_user.id, data)
    if not org:
        raise ForbiddenError("Insufficient permissions")
    return org


@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Delete organization."""
    if not org_service.delete_organization(org_id, current_user.id):
        raise ForbiddenError("Only owner can delete organization")
    return {"message": "Organization deleted successfully"}


@router.get("/{org_id}/members", response_model=List[MemberResponse])
def list_members(
    org_id: int,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """List organization members."""
    get_org_membership(org_id, current_user, db)
    return org_service.list_members(org_id, current_user.id)


@router.post("/{org_id}/members", response_model=MemberResponse)
def add_member(
    org_id: int,
    email: str = Query(...),
    role: MemberRole = Query(MemberRole.MEMBER),
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """Add a member to organization."""
    get_org_membership(org_id, current_user, db)
    membership = org_service.add_member(org_id, current_user.id, email, role)
    if not membership:
        raise BadRequestError("Could not add member")
    return membership


@router.put("/{org_id}/members/{user_id}", response_model=MemberResponse)
def update_member_role(
    org_id: int,
    user_id: int,
    role: MemberRole = Query(...),
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """Update member role."""
    get_org_membership(org_id, current_user, db)
    membership = org_service.update_member_role(org_id, current_user.id, user_id, role)
    if not membership:
        raise ForbiddenError("Only owner can update roles")
    return membership


@router.delete("/{org_id}/members/{user_id}")
def remove_member(
    org_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """Remove member from organization."""
    get_org_membership(org_id, current_user, db)
    if not org_service.remove_member(org_id, current_user.id, user_id):
        raise ForbiddenError("Only owner can remove members")
    return {"message": "Member removed successfully"}
