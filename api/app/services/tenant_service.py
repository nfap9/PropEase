"""
Tenant service for tenant management.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.services.base import BaseService
from app.repositories.tenant_repository import TenantRepository
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate


class TenantService(BaseService):
    """Service for tenant management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.tenant_repo = TenantRepository(db)

    def list_tenants(self, org_id: int) -> List[Tenant]:
        """List all tenants in an organization."""
        return self.tenant_repo.find_by_organization(org_id)

    def get_tenant(self, tenant_id: int, org_id: int) -> Optional[Tenant]:
        """Get a tenant by ID within an organization."""
        tenant = self.tenant_repo.get(tenant_id)
        if tenant and tenant.organization_id == org_id:
            return tenant
        return None

    def create_tenant(self, org_id: int, data: TenantCreate) -> Tenant:
        """Create a new tenant."""
        tenant = Tenant(
            organization_id=org_id,
            name=data.name,
            phone=data.phone,
            email=data.email,
            id_card=data.id_card,
            emergency_contact=data.emergency_contact,
            emergency_phone=data.emergency_phone,
            notes=data.notes,
        )
        return self.tenant_repo.create(tenant)

    def update_tenant(
        self, tenant_id: int, org_id: int, data: TenantUpdate
    ) -> Optional[Tenant]:
        """Update a tenant."""
        tenant = self.get_tenant(tenant_id, org_id)
        if not tenant:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return self.tenant_repo.update(tenant_id, **update_data)

    def delete_tenant(self, tenant_id: int, org_id: int) -> bool:
        """Delete a tenant."""
        tenant = self.get_tenant(tenant_id, org_id)
        if not tenant:
            return False
        return self.tenant_repo.delete(tenant_id)
