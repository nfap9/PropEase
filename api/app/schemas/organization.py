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


class OrganizationUsageResponse(BaseModel):
    """组织使用情况响应"""
    plan: str
    # 当前用量
    apartments_used: int
    rooms_used: int
    members_used: int
    # 限制
    max_apartments: int  # -1 表示无限制
    max_rooms: int  # -1 表示无限制
    max_members: int  # -1 表示无限制
    # 剩余
    apartments_remaining: int  # -1 表示无限制
    rooms_remaining: int  # -1 表示无限制
    members_remaining: int  # -1 表示无限制
    # 功能开关
    can_invite_members: bool
    can_create_team: bool


# Aliases for convenience
MemberResponse = OrganizationMemberWithUser
