"""
运营侧注册用户管理：平台级业务侧账号列表、详情、启用/停用。
"""

from sqlalchemy.orm import Session

from app.models.organization import MemberRole, OrganizationMember
from app.models.user import User
from app.repositories.organization_repository import OrganizationMemberRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import (
    AdminRegisteredUserDetailResponse,
    AdminRegisteredUserOrg,
)


class AdminRegisteredUserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    def list_registered_users(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> list[User]:
        """平台级注册用户列表。"""
        return self.user_repo.list_platform_users(skip=skip, limit=limit, is_active=is_active, search=search)

    def count_registered_users(
        self,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> int:
        """平台级注册用户总数（与列表筛选一致）。"""
        return self.user_repo.count_platform_users(is_active=is_active, search=search)

    def get_registered_user(self, user_id: str) -> User | None:
        """注册用户详情。"""
        return self.user_repo.get(user_id)

    def get_registered_user_detail(self, user_id: str) -> AdminRegisteredUserDetailResponse | None:
        """注册用户详情（含所属组织）。"""
        user = self.user_repo.get(user_id)
        if not user:
            return None
        memberships: list[OrganizationMember] = self.member_repo.find_memberships_by_user(user_id)
        orgs = [
            AdminRegisteredUserOrg(
                id=m.organization.id,
                name=m.organization.name,
                slug=m.organization.slug,
                role=m.role.value if isinstance(m.role, MemberRole) else str(m.role),
            )
            for m in memberships
        ]
        return AdminRegisteredUserDetailResponse(
            id=user.id,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            organizations=orgs,
        )

    def set_active(self, user_id: str, is_active: bool) -> User | None:
        """注册用户启用/停用。"""
        return self.user_repo.update(user_id, is_active=is_active)
