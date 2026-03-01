"""
Organization controller - handles organization management.
"""

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.deps import get_org_membership
from app.controllers.common.errors import BadRequestError, ForbiddenError, NotFoundError
from app.dependencies import get_current_user
from app.models.organization import MemberRole
from app.models.user import User
from app.schemas.organization import (
    MemberResponse,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationUsageResponse,
)
from app.services.organization_service import OrganizationService
from app.services.plan_limit_service import PlanLimitService

router = APIRouter()


class MigratePersonalTeamRequest(BaseModel):
    """Request body for personal team migration."""

    target_org_id: str


class MigrationStatsResponse(BaseModel):
    """Response for migration statistics."""

    apartments: int
    rooms: int
    tenants: int
    leases: int
    bills: int
    utility_readings: int
    message: str


class DeletionPreviewResponse(BaseModel):
    """Response for organization deletion preview."""

    can_delete: bool
    blockers: list[str]
    stats: dict
    org_name: str
    is_personal: bool


class ConfirmDeletionRequest(BaseModel):
    """Request body for confirming organization deletion."""

    confirmed_name: str


def get_org_service(db: Session = Depends(get_db)) -> OrganizationService:
    """Get organization service instance."""
    return OrganizationService(db)


def get_plan_limit_service(db: Session = Depends(get_db)) -> PlanLimitService:
    """Get plan limit service instance."""
    return PlanLimitService(db)


@router.get("", response_model=list[OrganizationResponse])
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


@router.get("/{org_id}/deletion-preview", response_model=DeletionPreviewResponse)
def get_deletion_preview(
    org_id: str,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """
    Get a preview of what will be deleted when deleting an organization.

    Returns statistics about data that will be deleted and any blocking issues.
    """
    try:
        return org_service.get_deletion_preview(org_id, current_user.id)
    except ValueError as e:
        raise ForbiddenError(str(e))


@router.delete("/{org_id}")
def delete_organization(
    org_id: str,
    data: ConfirmDeletionRequest = None,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """
    Delete organization.

    Requires confirmation by providing the organization name.
    Use /{org_id}/deletion-preview first to see what will be deleted.
    """
    if data is None or not data.confirmed_name:
        raise BadRequestError("请提供团队名称以确认删除")

    try:
        if org_service.confirm_and_delete(org_id, current_user.id, data.confirmed_name):
            return {"message": "团队已删除"}
        raise ForbiddenError("只有团队所有者可以删除团队")
    except ValueError as e:
        raise BadRequestError(str(e))


@router.get("/{org_id}/members", response_model=list[MemberResponse])
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
    try:
        membership = org_service.add_member(org_id, current_user.id, phone, role)
        return _member_to_response(membership)
    except ValueError as e:
        raise BadRequestError(str(e))


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


@router.get("/personal", response_model=OrganizationResponse)
def get_personal_team(
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """Get current user's personal team."""
    org = org_service.get_personal_team(current_user.id)
    if not org:
        raise NotFoundError("Personal team")
    return org


@router.post("/personal/migrate", response_model=MigrationStatsResponse)
def migrate_personal_team(
    data: MigratePersonalTeamRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
):
    """
    Migrate data from personal team to a formal team.

    This will transfer all apartments, tenants, and related data
    from the user's personal team to the target organization.
    The personal team will be deleted after migration.
    """
    # Get personal team
    personal_team = org_service.get_personal_team(current_user.id)
    if not personal_team:
        raise BadRequestError("您没有个人团队")

    try:
        stats = org_service.migrate_personal_team(
            personal_org_id=personal_team.id,
            target_org_id=data.target_org_id,
            user_id=current_user.id,
        )
        return MigrationStatsResponse(
            **stats,
            message="团队迁移成功",
        )
    except ValueError as e:
        raise BadRequestError(str(e))
