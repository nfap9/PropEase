"""
Permission controller - handles permission management.
"""


from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import ForbiddenError
from app.dependencies import get_current_organization, get_current_user
from app.models.organization import MemberRole, OrganizationMember
from app.models.user import User
from app.schemas.permission import (
    GrantSystemRoleRequest,
    PermissionResponse,
    RevokeSystemRoleRequest,
    RolePermissionsResponse,
    SystemRoleConfigResponse,
    UpdateRolePermissionsRequest,
    UserPermissionsResponse,
)
from app.services.permission_service import PermissionService

router = APIRouter()


def get_permission_service(db: Session = Depends(get_db)) -> PermissionService:
    """Get permission service instance."""
    return PermissionService(db)


@router.get("", response_model=list[PermissionResponse])
def get_all_permissions(
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取所有可用权限"""
    return perm_service.get_all_permissions()


@router.get("/grouped", response_model=dict[str, list[PermissionResponse]])
def get_permissions_grouped(
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取按资源分组的权限"""
    return perm_service.get_permissions_grouped()


@router.get("/organization/{org_id}/roles/{role}", response_model=RolePermissionsResponse)
def get_role_permissions(
    org_id: str,
    role: MemberRole,
    membership: OrganizationMember = Depends(get_current_organization),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取组织角色的权限配置"""
    permissions = perm_service.get_role_permissions(org_id, role)
    return RolePermissionsResponse(role=role.value, permissions=permissions)


@router.put("/organization/{org_id}/roles/{role}")
def update_role_permissions(
    org_id: str,
    role: MemberRole,
    data: UpdateRolePermissionsRequest,
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """更新组织角色权限配置"""
    if not perm_service.update_role_permissions(org_id, role, data.permission_codes, current_user.id):
        raise ForbiddenError("只有所有者可以修改权限，且所有者权限不可修改")

    return {"message": "权限更新成功"}


@router.get("/me", response_model=UserPermissionsResponse)
def get_my_permissions(
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取当前用户在组织中的权限列表"""
    permissions = perm_service.get_user_permissions(current_user.id, org_id)
    system_roles = perm_service.get_user_system_roles(current_user.id)
    is_super_admin = perm_service.is_super_admin(current_user.id)

    return UserPermissionsResponse(
        permissions=permissions,
        system_roles=system_roles,
        is_super_admin=is_super_admin,
    )


# 系统角色管理 API（仅超级管理员可用）


@router.get("/system-roles", response_model=list[SystemRoleConfigResponse])
def get_system_roles(
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取所有系统角色配置"""
    if not perm_service.is_super_admin(current_user.id):
        raise ForbiddenError("需要超级管理员权限")
    return perm_service.get_system_role_configs()


@router.post("/system-roles/grant", status_code=status.HTTP_200_OK)
def grant_system_role(
    data: GrantSystemRoleRequest,
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """授予用户系统角色"""
    if not perm_service.grant_system_role(data.user_id, data.role, current_user.id):
        raise ForbiddenError("需要超级管理员权限")
    return {"message": "角色授予成功"}


@router.post("/system-roles/revoke", status_code=status.HTTP_200_OK)
def revoke_system_role(
    data: RevokeSystemRoleRequest,
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """撤销用户的系统角色"""
    if not perm_service.revoke_system_role(data.user_id, data.role, current_user.id):
        raise ForbiddenError("需要超级管理员权限")
    return {"message": "角色撤销成功"}


@router.get("/system-roles/me", response_model=list[str])
def get_my_system_roles(
    current_user: User = Depends(get_current_user),
    perm_service: PermissionService = Depends(get_permission_service),
):
    """获取当前用户的系统角色"""
    roles = perm_service.get_user_system_roles(current_user.id)
    return [r.value for r in roles]
