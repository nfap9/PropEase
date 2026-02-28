"""
运营侧组织管理：列表、详情、启用/停用。
"""


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.errors import NotFoundError
from app.dependencies import get_current_admin_user
from app.schemas.admin import AdminOrganizationResponse, AdminOrganizationSetActive
from app.services.admin_organization_service import AdminOrganizationService

router = APIRouter(dependencies=[Depends(get_current_admin_user)])


def get_admin_org_service(db: Session = Depends(get_db)) -> AdminOrganizationService:
    return AdminOrganizationService(db)


@router.get("", response_model=list[AdminOrganizationResponse])
def list_organizations(
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
    service: AdminOrganizationService = Depends(get_admin_org_service),
):
    """平台级组织列表。"""
    orgs = service.list_organizations(skip=skip, limit=limit, is_active=is_active)
    return [AdminOrganizationResponse.model_validate(o) for o in orgs]


@router.get("/{org_id}", response_model=AdminOrganizationResponse)
def get_organization(
    org_id: str,
    service: AdminOrganizationService = Depends(get_admin_org_service),
):
    """组织详情。"""
    org = service.get_organization(org_id)
    if not org:
        raise NotFoundError("组织")
    return AdminOrganizationResponse.model_validate(org)


@router.patch("/{org_id}/active", response_model=AdminOrganizationResponse)
def set_organization_active(
    org_id: str,
    data: AdminOrganizationSetActive,
    service: AdminOrganizationService = Depends(get_admin_org_service),
):
    """组织启用/停用。"""
    org = service.set_active(org_id, data.is_active)
    if not org:
        raise NotFoundError("组织")
    return AdminOrganizationResponse.model_validate(org)
