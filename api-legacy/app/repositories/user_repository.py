"""
User repository for data access operations.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model."""

    def __init__(self, db: Session):
        super().__init__(db, User)

    def find_by_phone(self, phone: str) -> User | None:
        """Find user by phone number."""
        return self.db.query(User).filter(User.phone == phone).first()

    def find_by_organization(self, org_id: str) -> list[User]:
        """Find all users in an organization."""
        from app.models.organization import OrganizationMember

        return (
            self.db.query(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .filter(OrganizationMember.organization_id == org_id)
            .all()
        )

    def exists_by_phone(self, phone: str) -> bool:
        """Check if user exists by phone."""
        return self.find_by_phone(phone) is not None

    def list_platform_users(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> list[User]:
        """
        运营侧：平台级注册用户列表。支持按状态筛选、按手机号/姓名模糊搜索。
        """
        query = self.db.query(User)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter((User.phone.ilike(term)) | (User.full_name.ilike(term)))
        return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    def count_platform_users(
        self,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> int:
        """运营侧：平台级注册用户总数，与 list_platform_users 筛选一致。"""
        query = self.db.query(User)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter((User.phone.ilike(term)) | (User.full_name.ilike(term)))
        return query.count()
