"""
Permission schemas for API request/response.
"""

from datetime import datetime

from pydantic import BaseModel

from app.models.permission import Action, Resource, SystemRole


class PermissionBase(BaseModel):
    resource: Resource
    action: Action
    code: str
    name: str
    description: str | None = None


class PermissionResponse(PermissionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class PermissionGroupedResponse(BaseModel):
    resource: str
    permissions: list[PermissionResponse]


class UpdateRolePermissionsRequest(BaseModel):
    permission_codes: list[str]


class RolePermissionsResponse(BaseModel):
    role: str
    permissions: list[PermissionResponse]


class SystemRoleConfigResponse(BaseModel):
    role: SystemRole
    name: str
    description: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SystemRoleConfigWithPermissions(SystemRoleConfigResponse):
    permissions: list[PermissionResponse]


class UserSystemRoleResponse(BaseModel):
    role: SystemRole
    granted_at: datetime
    granted_by_name: str | None = None


class UserPermissionsResponse(BaseModel):
    permissions: list[str]
    system_roles: list[SystemRole]
    is_super_admin: bool


class GrantSystemRoleRequest(BaseModel):
    user_id: str
    role: SystemRole


class RevokeSystemRoleRequest(BaseModel):
    user_id: str
    role: SystemRole
