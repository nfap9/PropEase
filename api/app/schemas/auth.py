import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator


# 手机号验证正则（中国大陆11位手机号）
PHONE_PATTERN = re.compile(r'^1[3-9]\d{9}$')


def validate_phone(v: str) -> str:
    """验证手机号格式。"""
    if not PHONE_PATTERN.match(v):
        raise ValueError('请输入有效的中国大陆手机号')
    return v


class UserBase(BaseModel):
    phone: str
    full_name: str

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        return validate_phone(v)


class UserCreate(UserBase):
    password: str
    verification_code: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """验证密码强度。"""
        if len(v) < 8:
            raise ValueError("密码长度至少为8个字符")
        if not re.search(r"[a-zA-Z]", v):
            raise ValueError("密码必须包含至少一个字母")
        if not re.search(r"\d", v):
            raise ValueError("密码必须包含至少一个数字")
        return v


class UserLogin(BaseModel):
    """统一登录请求，支持密码或验证码登录"""
    phone: str
    password: Optional[str] = None
    verification_code: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        return validate_phone(v)

    @model_validator(mode='after')
    def validate_login_method(self) -> 'UserLogin':
        if not self.password and not self.verification_code:
            raise ValueError('密码和验证码至少提供一个')
        if self.password and self.verification_code:
            raise ValueError('密码和验证码只能提供一个')
        return self


class SendSmsCode(BaseModel):
    """发送短信验证码请求"""
    phone: str
    purpose: str  # 'login' or 'register'

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("purpose")
    @classmethod
    def validate_purpose(cls, v: str) -> str:
        if v not in ('login', 'register'):
            raise ValueError('purpose 必须是 login 或 register')
        return v


class UserResponse(BaseModel):
    id: int
    phone: str
    email: Optional[str] = None
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Alias for backward compatibility
TokenResponse = Token


class RefreshTokenRequest(BaseModel):
    refresh_token: str
