"""
运营账号数据访问层。
"""

from sqlalchemy.orm import Session, joinedload

from app.models.admin_user import AdminUser
from app.repositories.base import BaseRepository


class AdminUserRepository(BaseRepository[AdminUser]):
    def __init__(self, db: Session):
        super().__init__(db, AdminUser)

    def find_by_username(self, username: str) -> AdminUser | None:
        return self.db.query(AdminUser).filter(AdminUser.username == username).first()

    def get_with_role(self, id: str) -> AdminUser | None:
        return self.db.query(AdminUser).options(joinedload(AdminUser.role)).filter(AdminUser.id == id).first()

    def exists_by_username(self, username: str) -> bool:
        return self.find_by_username(username) is not None
