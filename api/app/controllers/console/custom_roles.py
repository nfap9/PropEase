"""
Custom role controller - handles organization custom roles.
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import MemberRole
from app.services.custom_role_service import CustomRoleService
from app.schemas.custom_role import (
    CustomRoleCreate,
    CustomRoleUpdate,
    CustomRoleResponse,
)
from app.controllers.common.errors import NotFoundError, ForbiddenError, BadRequestError
from app.controllers.common.deps import get_org_membership

router = APIRouter()


def get_custom_role_service(db: Session = Depends(get_db)) -> CustomRoleService:
    """Get custom role service instance."""
    return CustomRoleService(db)


def require_admin(org_id: str, user: User, db: Session) -> None:
    """Require admin or owner role."""
    from app.repositories.organization_repository import OrganizationMemberRepository
    member_repo = OrganizationMemberRepository(db)
    if not member_repo.has_role(org_id, user.id, [MemberRole.OWNER, MemberRole.ADMIN]):
        raise ForbiddenError("需要管理员权限")


@router.get("/orgs/{org_id}/roles", response_model=List[CustomRoleResponse])
def list_roles(
    org_id: str,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """List all custom roles in an organization."""
    get_org_membership(org_id, current_user, db)
    roles = service.list_roles(org_id, active_only)
    return [CustomRoleResponse.from_model(r) for r in roles]


@router.post(
    "/orgs/{org_id}/roles",
    response_model=CustomRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    org_id: str,
    data: CustomRoleCreate,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """Create a new custom role."""
    get_org_membership(org_id, current_user, db)
    require_admin(org_id, current_user, db)

    try:
        role = service.create_role(org_id, data)
        return CustomRoleResponse.from_model(role)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.get("/orgs/{org_id}/roles/{role_id}", response_model=CustomRoleResponse)
def get_role(
    org_id: str,
    role_id: str,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """Get a custom role by ID."""
    get_org_membership(org_id, current_user, db)
    role = service.get_role(role_id, org_id)
    if not role:
        raise NotFoundError("Custom role")
    return CustomRoleResponse.from_model(role)


@router.put("/orgs/{org_id}/roles/{role_id}", response_model=CustomRoleResponse)
def update_role(
    org_id: str,
    role_id: str,
    data: CustomRoleUpdate,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """Update a custom role."""
    get_org_membership(org_id, current_user, db)
    require_admin(org_id, current_user, db)

    try:
        role = service.update_role(role_id, org_id, data)
        if not role:
            raise NotFoundError("Custom role")
        return CustomRoleResponse.from_model(role)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.delete("/orgs/{org_id}/roles/{role_id}")
def delete_role(
    org_id: str,
    role_id: str,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """Delete a custom role."""
    get_org_membership(org_id, current_user, db)
    require_admin(org_id, current_user, db)

    try:
        if not service.delete_role(role_id, org_id):
            raise NotFoundError("Custom role")
        return {"message": "角色已删除"}
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/orgs/{org_id}/roles/init")
def initialize_roles(
    org_id: str,
    current_user: User = Depends(get_current_user),
    service: CustomRoleService = Depends(get_custom_role_service),
    db: Session = Depends(get_db),
):
    """Initialize default custom roles for organization."""
    get_org_membership(org_id, current_user, db)
    require_admin(org_id, current_user, db)

    roles = service.initialize_default_roles(org_id)
    return {
        "message": f"已创建 {len(roles)} 个默认角色",
        "roles": [r.name for r in roles],
    }
