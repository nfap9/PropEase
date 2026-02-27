"""
Authentication controller - handles user registration, login, and token refresh.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    RefreshTokenRequest,
    SendSmsCode,
)
from app.controllers.common.errors import BadRequestError, UnauthorizedError

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get auth service instance."""
    return AuthService(db)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """注册新用户（需要验证码验证）"""
    try:
        user = auth_service.register(data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/login", response_model=Token)
def login(
    data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """登录（支持密码或验证码）"""
    try:
        return auth_service.login(data)
    except ValueError as e:
        raise UnauthorizedError(str(e))


@router.post("/sms/send", status_code=status.HTTP_204_NO_CONTENT)
def send_sms_code(
    data: SendSmsCode,
    auth_service: AuthService = Depends(get_auth_service),
):
    """发送短信验证码"""
    try:
        if data.purpose == "login":
            auth_service.send_login_code(data.phone)
        else:
            auth_service.send_register_code(data.phone)
    except ValueError as e:
        raise BadRequestError(str(e))


@router.post("/refresh", response_model=Token)
def refresh_token(
    data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """刷新访问令牌"""
    try:
        return auth_service.refresh_token(data.refresh_token)
    except ValueError as e:
        raise UnauthorizedError(str(e))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse.model_validate(current_user)
