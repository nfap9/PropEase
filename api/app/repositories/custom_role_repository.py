"""
Custom role repository for data access operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.repositories.base import BaseRepository
from app.models.custom_role import CustomRole


class CustomRoleRepository(BaseRepository[CustomRole]):
    """Repository for CustomRole model."""

    def __init__(self, db: Session):
        super().__init__(db, CustomRole)

    def find_by_organization(self, org_id: str, active_only: bool = True) -> List[CustomRole]:
        """Find all custom roles in an organization."""
        query = self.db.query(CustomRole).filter(
            CustomRole.organization_id == org_id
        )
        if active_only:
            query = query.filter(CustomRole.is_active == True)
        return query.all()

    def find_by_name(self, org_id: str, name: str) -> Optional[CustomRole]:
        """Find a custom role by name within an organization."""
        return self.db.query(CustomRole).filter(
            CustomRole.organization_id == org_id,
            CustomRole.name == name,
        ).first()

    def find_system_roles(self, org_id: str) -> List[CustomRole]:
        """Find system preset roles in an organization."""
        return self.db.query(CustomRole).filter(
            CustomRole.organization_id == org_id,
            CustomRole.is_system == True,
        ).all()
