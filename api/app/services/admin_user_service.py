"""
运营账号管理服务。
"""

from sqlalchemy.orm import Session

from app.models.admin_user import AdminUser
from app.repositories.admin_role_repository import AdminRoleRepository
from app.repositories.admin_user_repository import AdminUserRepository
from app.schemas.admin import AdminPasswordReset, AdminUserCreate, AdminUserUpdate
from app.utils.security import get_password_hash


class AdminUserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = AdminUserRepository(db)
        self.role_repo = AdminRoleRepository(db)

    def list_users(self, skip: int = 0, limit: int = 100) -> list[AdminUser]:
        return self.user_repo.get_all(skip=skip, limit=limit)

    def get_user(self, user_id: str) -> AdminUser | None:
        return self.user_repo.get_with_role(user_id)

    def create_user(self, data: AdminUserCreate) -> AdminUser:
        if self.user_repo.exists_by_username(data.username):
            raise ValueError("用户名已存在")
        role = self.role_repo.get(data.role_id)
        if not role:
            raise ValueError("角色不存在")
        admin = AdminUser(
            username=data.username,
            password_hash=get_password_hash(data.password),
            name=data.name,
            email=data.email,
            role_id=data.role_id,
        )
        return self.user_repo.create(admin)

    def update_user(self, user_id: str, data: AdminUserUpdate) -> AdminUser | None:
        admin = self.user_repo.get(user_id)
        if not admin:
            return None
        if data.role_id is not None:
            role = self.role_repo.get(data.role_id)
            if not role:
                raise ValueError("角色不存在")
        kwargs = data.model_dump(exclude_unset=True)
        self.user_repo.update(user_id, **kwargs)
        return self.user_repo.get_with_role(user_id)

    def delete_user(self, user_id: str) -> bool:
        admin = self.user_repo.get(user_id)
        if not admin:
            return False
        if admin.is_system:
            raise ValueError("系统预置账号不可删除")
        return self.user_repo.delete(user_id)

    def reset_password(self, user_id: str, data: AdminPasswordReset) -> None:
        admin = self.user_repo.get(user_id)
        if not admin:
            raise ValueError("运营账号不存在")
        admin.password_hash = get_password_hash(data.new_password)
        admin.failed_login_attempts = 0
        admin.locked_until = None
        self.db.commit()
