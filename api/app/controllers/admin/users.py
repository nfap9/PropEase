"""
运营账号 CRUD 及密码重置。
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import BadRequestError, ConflictError, NotFoundError
from app.dependencies import get_current_admin_user
from app.models.admin_user import AdminUser
from app.schemas.admin import (
    AdminPasswordReset,
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
)
from app.services.admin_user_service import AdminUserService

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_admin_user_service(db: Session = Depends(get_db)) -> AdminUserService:
    return AdminUserService(db)


def _admin_user_to_response(admin: AdminUser) -> AdminUserResponse:
    return AdminUserResponse(
        id=admin.id,
        username=admin.username,
        name=admin.name,
        email=admin.email,
        role_id=admin.role_id,
        role_name=admin.role.name if admin.role else None,
        is_active=admin.is_active,
        last_login_at=admin.last_login_at,
        created_at=admin.created_at,
    )


@router.get("", response_model=list[AdminUserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """运营账号列表。"""
    users = service.list_users(skip=skip, limit=limit)
    return [_admin_user_to_response(u) for u in users]


@router.get("/me", response_model=AdminUserResponse)
def get_me(
    current_admin: AdminUser = Depends(get_current_admin_user),
    service: AdminUserService = Depends(get_admin_user_service),
):
    """当前登录的运营账号信息。"""
    admin = service.get_user(current_admin.id)
    if not admin:
        raise NotFoundError("运营账号")
    return _admin_user_to_response(admin)


@router.get("/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: str,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """运营账号详情。"""
    admin = service.get_user(user_id)
    if not admin:
        raise NotFoundError("运营账号")
    return _admin_user_to_response(admin)


@router.post("", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminUserCreate,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """创建运营账号。"""
    try:
        admin = service.create_user(data)
        created = service.get_user(admin.id)
        if not created:
            raise NotFoundError("运营账号")
        return _admin_user_to_response(created)
    except ValueError as e:
        if "已存在" in str(e):
            raise ConflictError(str(e)) from e
        raise BadRequestError(str(e)) from e


@router.put("/{user_id}", response_model=AdminUserResponse)
def update_user(
    user_id: str,
    data: AdminUserUpdate,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """更新运营账号。"""
    try:
        admin = service.update_user(user_id, data)
        if not admin:
            raise NotFoundError("运营账号")
        return _admin_user_to_response(admin)
    except ValueError as e:
        raise BadRequestError(str(e)) from e


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """删除运营账号。"""
    if not service.delete_user(user_id):
        raise NotFoundError("运营账号")


@router.post("/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    user_id: str,
    data: AdminPasswordReset,
    service: AdminUserService = Depends(get_admin_user_service),
):
    """重置运营账号密码。"""
    try:
        service.reset_password(user_id, data)
    except ValueError as err:
        raise NotFoundError("运营账号") from err
