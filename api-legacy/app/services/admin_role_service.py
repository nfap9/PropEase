"""
运营角色管理服务。
"""

from sqlalchemy.orm import Session

from app.models.admin_role import AdminRole
from app.repositories.admin_role_repository import AdminRoleRepository
from app.schemas.admin import AdminRoleCreate, AdminRoleUpdate


class AdminRoleService:
    def __init__(self, db: Session):
        self.db = db
        self.role_repo = AdminRoleRepository(db)

    def list_roles(self, skip: int = 0, limit: int = 100) -> list[AdminRole]:
        return self.role_repo.get_all(skip=skip, limit=limit)

    def get_role(self, role_id: str) -> AdminRole | None:
        return self.role_repo.get(role_id)

    def create_role(self, data: AdminRoleCreate) -> AdminRole:
        if self.role_repo.find_by_name(data.name):
            raise ValueError("角色名称已存在")
        role = AdminRole(
            name=data.name,
            permissions=data.permissions,
            is_system=False,
        )
        return self.role_repo.create(role)

    def update_role(self, role_id: str, data: AdminRoleUpdate) -> AdminRole | None:
        role = self.role_repo.get(role_id)
        if not role:
            return None
        if role.is_system:
            raise ValueError("系统预置角色不可修改")
        kwargs = data.model_dump(exclude_unset=True)
        self.role_repo.update(role_id, **kwargs)
        return self.role_repo.get(role_id)

    def delete_role(self, role_id: str) -> bool:
        role = self.role_repo.get(role_id)
        if not role:
            return False
        if role.is_system:
            raise ValueError("系统预置角色不可删除")
        return self.role_repo.delete(role_id)
