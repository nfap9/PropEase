"""
Tenant repository for data access operations.
"""
from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.tenant import Tenant


class TenantRepository(BaseRepository[Tenant]):
    """Repository for Tenant model."""

    def __init__(self, db: Session):
        super().__init__(db, Tenant)

    def find_by_organization(self, org_id: str) -> List[Tenant]:
        """Find all tenants in an organization."""
        return (
            self.db.query(Tenant)
            .filter(Tenant.organization_id == org_id)
            .all()
        )
