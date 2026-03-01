"""
运营侧注册用户管理：平台级业务侧账号列表、详情、启用/停用。
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import NotFoundError
from app.dependencies import get_current_admin_user
from app.schemas.admin import (
    AdminRegisteredUserDetailResponse,
    AdminRegisteredUserResponse,
    AdminRegisteredUserSetActive,
)
from app.services.admin_registered_user_service import AdminRegisteredUserService

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_service(db: Session = Depends(get_db)) -> AdminRegisteredUserService:
    return AdminRegisteredUserService(db)


@router.get("", response_model=list[AdminRegisteredUserResponse])
def list_registered_users(
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
    search: str | None = None,
    service: AdminRegisteredUserService = Depends(get_service),
):
    """平台级注册用户列表。支持按状态、手机号/姓名搜索。"""
    users = service.list_registered_users(skip=skip, limit=limit, is_active=is_active, search=search)
    return [AdminRegisteredUserResponse.model_validate(u) for u in users]


@router.get("/count", response_model=dict)
def count_registered_users(
    is_active: bool | None = None,
    search: str | None = None,
    service: AdminRegisteredUserService = Depends(get_service),
):
    """平台级注册用户总数（与列表筛选参数一致）。"""
    total = service.count_registered_users(is_active=is_active, search=search)
    return {"total": total}


@router.get("/{user_id}", response_model=AdminRegisteredUserDetailResponse)
def get_registered_user(
    user_id: str,
    service: AdminRegisteredUserService = Depends(get_service),
):
    """注册用户详情（含所属组织）。"""
    detail = service.get_registered_user_detail(user_id)
    if not detail:
        raise NotFoundError("注册用户")
    return detail


@router.patch("/{user_id}/active", response_model=AdminRegisteredUserResponse)
def set_registered_user_active(
    user_id: str,
    data: AdminRegisteredUserSetActive,
    service: AdminRegisteredUserService = Depends(get_service),
):
    """注册用户启用/停用。"""
    user = service.set_active(user_id, data.is_active)
    if not user:
        raise NotFoundError("注册用户")
    return AdminRegisteredUserResponse.model_validate(user)
