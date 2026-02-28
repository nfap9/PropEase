"""
Tenant repository for data access operations.
"""

from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.repositories.base import BaseRepository


class TenantRepository(BaseRepository[Tenant]):
    """Repository for Tenant model."""

    def __init__(self, db: Session):
        super().__init__(db, Tenant)

    def find_by_organization(self, org_id: str) -> list[Tenant]:
        """Find all tenants in an organization."""
        return self.db.query(Tenant).filter(Tenant.organization_id == org_id).all()
