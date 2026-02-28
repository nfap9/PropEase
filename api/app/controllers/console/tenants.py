"""
Tenant controller - handles tenant management.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.configs.database import get_db
from app.controllers.common.deps import get_org_membership, require_role
from app.controllers.common.errors import NotFoundError
from app.dependencies import get_current_user
from app.models.organization import MemberRole
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.services.tenant_service import TenantService

router = APIRouter()


def get_tenant_service(db: Session = Depends(get_db)) -> TenantService:
    """Get tenant service instance."""
    return TenantService(db)


@router.get("", response_model=list[TenantResponse])
def list_tenants(
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service),
    db: Session = Depends(get_db),
):
    """List all tenants in organization."""
    get_org_membership(org_id, current_user, db)
    return tenant_service.list_tenants(org_id)


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(
    data: TenantCreate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service),
    db: Session = Depends(get_db),
):
    """Create a new tenant."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(get_org_membership(org_id, current_user, db))
    return tenant_service.create_tenant(org_id, data)


@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service),
    db: Session = Depends(get_db),
):
    """Get tenant by ID."""
    get_org_membership(org_id, current_user, db)
    tenant = tenant_service.get_tenant(tenant_id, org_id)
    if not tenant:
        raise NotFoundError("Tenant")
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service),
    db: Session = Depends(get_db),
):
    """Update tenant."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(get_org_membership(org_id, current_user, db))
    tenant = tenant_service.update_tenant(tenant_id, org_id, data)
    if not tenant:
        raise NotFoundError("Tenant")
    return tenant


@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    org_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service),
    db: Session = Depends(get_db),
):
    """Delete tenant."""
    require_role([MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER])(get_org_membership(org_id, current_user, db))
    if not tenant_service.delete_tenant(tenant_id, org_id):
        raise NotFoundError("Tenant")
    return {"message": "Tenant deleted successfully"}
