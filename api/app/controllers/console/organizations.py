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
from app.services.plan_limit_service import PlanLimitService
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    MemberResponse,
    OrganizationUsageResponse,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership

router = APIRouter()


def get_org_service(db: Session = Depends(get_db)) -> OrganizationService:
    """Get organization service instance."""
    return OrganizationService(db)


def get_plan_limit_service(db: Session = Depends(get_db)) -> PlanLimitService:
    """Get plan limit service instance."""
    return PlanLimitService(db)


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
    org_id: str,
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
    org_id: str,
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
    org_id: str,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Delete organization."""
    if not org_service.delete_organization(org_id, current_user.id):
        raise ForbiddenError("Only owner can delete organization")
    return {"message": "Organization deleted successfully"}


@router.get("/{org_id}/members", response_model=List[MemberResponse])
def list_members(
    org_id: str,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """List organization members."""
    get_org_membership(org_id, current_user, db)
    members = org_service.list_members(org_id, current_user.id)
    # 转换为响应格式，提取用户信息
    return [
        MemberResponse(
            id=m.id,
            organization_id=m.organization_id,
            user_id=m.user_id,
            role=m.role,
            created_at=m.created_at,
            user_phone=m.user.phone if m.user else None,
            user_full_name=m.user.full_name if m.user else "未知用户",
        )
        for m in members
    ]


def _member_to_response(m):
    """Helper to convert OrganizationMember to MemberResponse."""
    return MemberResponse(
        id=m.id,
        organization_id=m.organization_id,
        user_id=m.user_id,
        role=m.role,
        created_at=m.created_at,
        user_phone=m.user.phone if m.user else None,
        user_full_name=m.user.full_name if m.user else "未知用户",
    )


@router.post("/{org_id}/members", response_model=MemberResponse)
def add_member(
    org_id: str,
    phone: str = Query(...),
    role: MemberRole = Query(MemberRole.MEMBER),
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """Add a member to organization."""
    get_org_membership(org_id, current_user, db)
    membership = org_service.add_member(org_id, current_user.id, phone, role)
    if not membership:
        raise BadRequestError("Could not add member")
    return _member_to_response(membership)


@router.put("/{org_id}/members/{user_id}", response_model=MemberResponse)
def update_member_role(
    org_id: str,
    user_id: str,
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
    return _member_to_response(membership)


@router.delete("/{org_id}/members/{user_id}")
def remove_member(
    org_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    db: Session = Depends(get_db),
):
    """Remove member from organization."""
    get_org_membership(org_id, current_user, db)
    if not org_service.remove_member(org_id, current_user.id, user_id):
        raise ForbiddenError("Only owner can remove members")
    return {"message": "Member removed successfully"}


@router.get("/{org_id}/usage", response_model=OrganizationUsageResponse)
def get_organization_usage(
    org_id: str,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
    plan_limit_service: PlanLimitService = Depends(get_plan_limit_service),
    db: Session = Depends(get_db),
):
    """Get organization usage and limits."""
    get_org_membership(org_id, current_user, db)

    # Get organization to determine plan
    org = org_service.get_organization(org_id, current_user.id)
    if not org:
        raise NotFoundError("Organization")

    plan = org.plan or "free"
    limits = plan_limit_service.get_plan_limits(plan)
    usage = plan_limit_service.get_organization_usage(org_id)
    remaining = plan_limit_service.get_remaining_limits(org_id, plan)

    return OrganizationUsageResponse(
        plan=plan,
        apartments_used=usage["apartments"],
        rooms_used=usage["rooms"],
        members_used=usage["members"],
        max_apartments=limits.max_apartments,
        max_rooms=limits.max_rooms,
        max_members=limits.max_members,
        apartments_remaining=remaining["apartments"],
        rooms_remaining=remaining["rooms"],
        members_remaining=remaining["members"],
        can_invite_members=limits.can_create_team,
        can_create_team=limits.can_create_team,
    )
