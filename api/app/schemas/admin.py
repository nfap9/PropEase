"""
运营后台 API 的请求/响应 Schema。
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class AdminLogin(BaseModel):
    """运营后台登录请求"""

    username: str
    password: str

    model_config = ConfigDict(extra="forbid")


class AdminToken(BaseModel):
    """运营后台登录响应"""

    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(extra="forbid")


class AdminRoleResponse(BaseModel):
    """运营角色响应"""

    id: str
    name: str
    permissions: list[str]
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="forbid")


class AdminUserResponse(BaseModel):
    """运营账号响应（不含密码）"""

    id: str
    username: str
    name: str
    email: str | None
    role_id: str
    role_name: str | None = None
    is_active: bool
    is_system: bool = False
    last_login_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="forbid")


class AdminUserCreate(BaseModel):
    """创建运营账号"""

    username: str
    password: str
    name: str
    email: str | None = None
    role_id: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("密码至少 8 位")
        return v


class AdminUserUpdate(BaseModel):
    """更新运营账号"""

    name: str | None = None
    email: str | None = None
    role_id: str | None = None
    is_active: bool | None = None

    model_config = ConfigDict(extra="forbid")


class AdminPasswordReset(BaseModel):
    """运营账号密码重置"""

    new_password: str

    model_config = ConfigDict(extra="forbid")

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("密码至少 8 位")
        return v


class AdminRoleCreate(BaseModel):
    """创建运营角色"""

    name: str
    permissions: list[str] = []

    model_config = ConfigDict(extra="forbid")


class AdminRoleUpdate(BaseModel):
    """更新运营角色"""

    name: str | None = None
    permissions: list[str] | None = None

    model_config = ConfigDict(extra="forbid")


# ==================== 运营侧组织 ====================


class AdminOrganizationResponse(BaseModel):
    """运营侧组织响应"""

    id: str
    name: str
    slug: str
    plan: str
    is_personal: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, extra="forbid")


class AdminOrganizationSetActive(BaseModel):
    """运营侧组织启用/停用"""

    is_active: bool

    model_config = ConfigDict(extra="forbid")


# ==================== 运营侧订阅 ====================


class AdminSubscriptionRenew(BaseModel):
    """运营侧手动续期：延长天数"""

    extend_days: int = 30

    model_config = ConfigDict(extra="forbid")


# ==================== 运营分析 ====================


class AdminPlatformStatsResponse(BaseModel):
    """平台级统计响应"""

    organizations_count: int
    users_count: int
    apartments_count: int
    rooms_count: int
    active_subscriptions_count: int

    model_config = ConfigDict(extra="forbid")
