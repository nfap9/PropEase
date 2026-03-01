"""
运营后台认证服务。

登录逻辑：先检查账号是否存在、是否停用、是否处于锁定期；
密码错误时增加失败次数，达到阈值则设置锁定时间；成功登录后清零失败次数并更新 last_login_at。
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.configs import settings
from app.models.admin_user import AdminUser
from app.repositories.admin_user_repository import AdminUserRepository
from app.schemas.admin import AdminLogin, AdminToken
from app.utils.security import (
    create_admin_access_token,
    get_password_hash,
    validate_admin_password,
    verify_password,
)


class AdminAuthService:
    """运营后台登录与令牌签发。"""

    def __init__(self, db: Session):
        self.db = db
        self.admin_user_repo = AdminUserRepository(db)

    def login(self, data: AdminLogin) -> AdminToken:
        """
        运营账号登录。校验用户名密码，受锁定与失败次数限制，成功则更新 last_login_at 并返回 access_token。
        """
        admin = self.admin_user_repo.find_by_username(data.username)
        if not admin:
            raise ValueError("用户名或密码错误")
        if not admin.is_active:
            raise ValueError("账号已停用")

        now = datetime.now(UTC)
        if admin.locked_until and admin.locked_until > now:
            raise ValueError("账号已锁定，请稍后再试")

        if not verify_password(data.password, admin.password_hash):
            admin.failed_login_attempts = (admin.failed_login_attempts or 0) + 1
            if admin.failed_login_attempts >= settings.ADMIN_MAX_LOGIN_ATTEMPTS:
                admin.locked_until = now + timedelta(minutes=settings.ADMIN_LOCKOUT_MINUTES)
            self.db.commit()
            raise ValueError("用户名或密码错误")

        admin.failed_login_attempts = 0
        admin.locked_until = None
        admin.last_login_at = now
        self.db.commit()
        self.db.refresh(admin)

        token = create_admin_access_token(admin.id)
        return AdminToken(access_token=token)

    def set_password(self, admin_user: AdminUser, new_password: str) -> None:
        """修改运营账号密码。校验强度后写入。"""
        validate_admin_password(new_password)
        admin_user.password_hash = get_password_hash(new_password)
        self.db.commit()
