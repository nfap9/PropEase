"""
运营侧组织管理：平台级组织列表、详情、启用/停用。
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.repositories.organization_repository import OrganizationRepository


class AdminOrganizationService:
    def __init__(self, db: Session):
        self.db = db
        self.org_repo = OrganizationRepository(db)

    def list_organizations(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
    ) -> list[Organization]:
        filters: dict = {}
        if is_active is not None:
            filters["is_active"] = is_active
        return self.org_repo.get_all(skip=skip, limit=limit, **filters)

    def get_organization(self, org_id: str) -> Optional[Organization]:
        return self.org_repo.get(org_id)

    def set_active(self, org_id: str, is_active: bool) -> Optional[Organization]:
        updated = self.org_repo.update(org_id, is_active=is_active)
        return updated
