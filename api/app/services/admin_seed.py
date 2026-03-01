"""
运营后台种子数据：超级管理员角色与默认账号。
仅在对应记录不存在时创建。
"""

import logging

from sqlalchemy.orm import Session

from app.configs import settings
from app.models.admin_role import AdminRole
from app.models.admin_user import AdminUser
from app.repositories.admin_role_repository import AdminRoleRepository
from app.repositories.admin_user_repository import AdminUserRepository
from app.utils.security import get_password_hash

logger = logging.getLogger(__name__)

SUPER_ROLE_NAME = "超级管理员"
SUPER_PERMISSIONS = ["*"]


def seed_admin_super(session: Session) -> None:
    """
    若不存在则创建超级管理员角色与默认 admin 账号。
    使用 settings.ADMIN_INIT_USERNAME / ADMIN_INIT_PASSWORD。
    """
    role_repo = AdminRoleRepository(session)
    user_repo = AdminUserRepository(session)

    role = role_repo.find_by_name(SUPER_ROLE_NAME)
    if not role:
        role = AdminRole(
            name=SUPER_ROLE_NAME,
            permissions=SUPER_PERMISSIONS,
            is_system=True,
        )
        role = role_repo.create(role)
        logger.info("Created admin role: %s", SUPER_ROLE_NAME)

    if not user_repo.exists_by_username(settings.ADMIN_INIT_USERNAME):
        admin_user = AdminUser(
            username=settings.ADMIN_INIT_USERNAME,
            password_hash=get_password_hash(settings.ADMIN_INIT_PASSWORD),
            name="超级管理员",
            email=None,
            role_id=role.id,
            is_active=True,
            is_system=True,
        )
        user_repo.create(admin_user)
        logger.info("Created admin user: %s", settings.ADMIN_INIT_USERNAME)
