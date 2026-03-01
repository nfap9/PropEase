"""
运营角色 CRUD。
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import BadRequestError, ConflictError, NotFoundError
from app.dependencies import get_current_admin_user
from app.schemas.admin import AdminRoleCreate, AdminRoleResponse, AdminRoleUpdate
from app.services.admin_role_service import AdminRoleService

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_admin_role_service(db: Session = Depends(get_db)) -> AdminRoleService:
    return AdminRoleService(db)


@router.get("", response_model=list[AdminRoleResponse])
def list_roles(
    skip: int = 0,
    limit: int = 100,
    service: AdminRoleService = Depends(get_admin_role_service),
):
    """运营角色列表。"""
    roles = service.list_roles(skip=skip, limit=limit)
    return [AdminRoleResponse.model_validate(r) for r in roles]


@router.get("/{role_id}", response_model=AdminRoleResponse)
def get_role(
    role_id: str,
    service: AdminRoleService = Depends(get_admin_role_service),
):
    """运营角色详情。"""
    role = service.get_role(role_id)
    if not role:
        raise NotFoundError("运营角色")
    return AdminRoleResponse.model_validate(role)


@router.post("", response_model=AdminRoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    data: AdminRoleCreate,
    service: AdminRoleService = Depends(get_admin_role_service),
):
    """创建运营角色。"""
    try:
        role = service.create_role(data)
        return AdminRoleResponse.model_validate(role)
    except ValueError as e:
        if "已存在" in str(e):
            raise ConflictError(str(e)) from e
        raise BadRequestError(str(e)) from e


@router.put("/{role_id}", response_model=AdminRoleResponse)
def update_role(
    role_id: str,
    data: AdminRoleUpdate,
    service: AdminRoleService = Depends(get_admin_role_service),
):
    """更新运营角色（系统预置角色不可修改）。"""
    try:
        role = service.update_role(role_id, data)
        if not role:
            raise NotFoundError("运营角色")
        return AdminRoleResponse.model_validate(role)
    except ValueError as e:
        raise BadRequestError(str(e)) from e


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: str,
    service: AdminRoleService = Depends(get_admin_role_service),
):
    """删除运营角色（系统预置角色不可删除）。"""
    try:
        if not service.delete_role(role_id):
            raise NotFoundError("运营角色")
    except ValueError as e:
        raise BadRequestError(str(e)) from e
