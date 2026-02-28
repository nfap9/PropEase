from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.organization import MemberRole


class OrganizationBase(BaseModel):
    name: str


class OrganizationCreate(OrganizationBase):
    slug: Optional[str] = None  # 可选，自动生成


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[dict] = None


class OrganizationResponse(OrganizationBase):
    id: str
    plan: str
    settings: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationMemberBase(BaseModel):
    pass


class OrganizationMemberCreate(BaseModel):
    user_phone: str
    role: MemberRole = MemberRole.MEMBER


class OrganizationMemberUpdate(BaseModel):
    role: MemberRole


class OrganizationMemberResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: MemberRole
    created_at: datetime

    class Config:
        from_attributes = True


class OrganizationMemberWithUser(OrganizationMemberResponse):
    user_phone: Optional[str] = None
    user_full_name: str


# Aliases for convenience
MemberResponse = OrganizationMemberWithUser
