"""
运营角色数据访问层。
"""

from sqlalchemy.orm import Session

from app.models.admin_role import AdminRole
from app.repositories.base import BaseRepository


class AdminRoleRepository(BaseRepository[AdminRole]):
    def __init__(self, db: Session):
        super().__init__(db, AdminRole)

    def find_by_name(self, name: str) -> AdminRole | None:
        return self.db.query(AdminRole).filter(AdminRole.name == name).first()
