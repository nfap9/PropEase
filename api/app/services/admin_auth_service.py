"""
运营后台认证服务。
"""

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.admin_user import AdminUser
from app.repositories.admin_user_repository import AdminUserRepository
from app.schemas.admin import AdminLogin, AdminToken
from app.utils.security import (
    create_admin_access_token,
    get_password_hash,
    verify_password,
)


class AdminAuthService:
    """运营后台登录与令牌签发。"""

    def __init__(self, db: Session):
        self.db = db
        self.admin_user_repo = AdminUserRepository(db)

    def login(self, data: AdminLogin) -> AdminToken:
        """
        运营账号登录。校验用户名密码，更新 last_login_at，返回 access_token。
        """
        admin = self.admin_user_repo.find_by_username(data.username)
        if not admin:
            raise ValueError("用户名或密码错误")
        if not admin.is_active:
            raise ValueError("账号已停用")
        if not verify_password(data.password, admin.password_hash):
            raise ValueError("用户名或密码错误")

        admin.last_login_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(admin)

        token = create_admin_access_token(admin.id)
        return AdminToken(access_token=token)

    def set_password(self, admin_user: AdminUser, new_password: str) -> None:
        """修改运营账号密码。"""
        admin_user.password_hash = get_password_hash(new_password)
        self.db.commit()
