"""
Permission schemas for API request/response.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

from app.models.permission import Resource, Action, SystemRole


class PermissionBase(BaseModel):
    resource: Resource
    action: Action
    code: str
    name: str
    description: Optional[str] = None


class PermissionResponse(PermissionBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class PermissionGroupedResponse(BaseModel):
    resource: str
    permissions: List[PermissionResponse]


class UpdateRolePermissionsRequest(BaseModel):
    permission_codes: List[str]


class RolePermissionsResponse(BaseModel):
    role: str
    permissions: List[PermissionResponse]


class SystemRoleConfigResponse(BaseModel):
    role: SystemRole
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SystemRoleConfigWithPermissions(SystemRoleConfigResponse):
    permissions: List[PermissionResponse]


class UserSystemRoleResponse(BaseModel):
    role: SystemRole
    granted_at: datetime
    granted_by_name: Optional[str] = None


class UserPermissionsResponse(BaseModel):
    permissions: List[str]
    system_roles: List[SystemRole]
    is_super_admin: bool


class GrantSystemRoleRequest(BaseModel):
    user_id: str
    role: SystemRole


class RevokeSystemRoleRequest(BaseModel):
    user_id: str
    role: SystemRole
