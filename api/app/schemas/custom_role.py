"""
Custom role schemas for request/response validation.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CustomRoleBase(BaseModel):
    """Base schema for custom role."""
    name: str
    description: Optional[str] = None


class CustomRoleCreate(CustomRoleBase):
    """Schema for creating a custom role."""
    permissions: List[str] = []


class CustomRoleUpdate(BaseModel):
    """Schema for updating a custom role."""
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CustomRoleResponse(CustomRoleBase):
    """Response schema for custom role."""
    id: str
    organization_id: str
    is_system: bool
    is_active: bool
    permissions: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, role):
        """Create response from model."""
        import json
        perms = []
        if role.permissions:
            try:
                perms = json.loads(role.permissions)
            except (json.JSONDecodeError, TypeError):
                perms = []

        return cls(
            id=role.id,
            organization_id=role.organization_id,
            name=role.name,
            description=role.description,
            is_system=role.is_system,
            is_active=role.is_active,
            permissions=perms,
            created_at=role.created_at,
        )


class MemberWithRoleResponse(BaseModel):
    """Response schema for member with role info."""
    id: str
    organization_id: str
    user_id: str
    role: str
    custom_role_id: Optional[str] = None
    custom_role_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_full_name: str
    created_at: datetime
