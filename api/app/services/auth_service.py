"""
Authentication service for user management and JWT operations.
"""


from sqlalchemy.orm import Session

from app.models.organization import MemberRole
from app.models.user import User
from app.repositories.organization_repository import OrganizationMemberRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token, UserCreate, UserLogin
from app.services.base import BaseService
from app.services.sms_service import SmsService, get_sms_provider
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


class AuthService(BaseService):
    """Service for authentication and user management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.user_repo = UserRepository(db)
        self.member_repo = OrganizationMemberRepository(db)
        self.sms_service = SmsService(db, get_sms_provider())

    def register(self, user_data: UserCreate) -> User:
        """
        Register a new user and create a personal team.

        Args:
            user_data: User registration data

        Returns:
            Created user

        Raises:
            ValueError: If phone already exists or verification code is invalid
        """
        # 1. 验证验证码
        if not self.sms_service.verify_code(user_data.phone, user_data.verification_code, "register"):
            raise ValueError("验证码无效或已过期")

        # 2. 检查手机号是否已注册
        if self.user_repo.exists_by_phone(user_data.phone):
            raise ValueError("手机号已注册")

        # 3. 创建用户
        user = User(
            phone=user_data.phone,
            password_hash=get_password_hash(user_data.password),
            full_name=user_data.full_name,
        )
        user = self.user_repo.create(user)

        # 4. 创建个人团队
        from app.services.organization_service import OrganizationService

        org_service = OrganizationService(self.db)
        org_service.create_personal_team(
            user_id=user.id,
            user_name=user.full_name or "用户",
        )

        return user

    def login(self, credentials: UserLogin) -> Token:
        """
        Authenticate user and return tokens.
        Supports password or verification code login.

        Args:
            credentials: Login credentials (phone + password or phone + verification_code)

        Returns:
            Token with access and refresh tokens

        Raises:
            ValueError: If credentials are invalid
        """
        user = self.user_repo.find_by_phone(credentials.phone)
        if not user:
            raise ValueError("手机号或密码错误")

        if credentials.password:
            # 密码登录
            if not verify_password(credentials.password, user.password_hash):
                raise ValueError("手机号或密码错误")
        else:
            # 验证码登录
            if not self.sms_service.verify_code(credentials.phone, credentials.verification_code, "login"):
                raise ValueError("验证码无效或已过期")

        token_data = {"sub": str(user.id), "phone": user.phone}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

    def send_login_code(self, phone: str) -> bool:
        """
        Send login verification code.

        Args:
            phone: Phone number

        Returns:
            bool: Whether code was sent successfully
        """
        return self.sms_service.send_code(phone, "login")

    def send_register_code(self, phone: str) -> bool:
        """
        Send registration verification code.

        Args:
            phone: Phone number

        Returns:
            bool: Whether code was sent successfully

        Raises:
            ValueError: If phone already registered
        """
        if self.user_repo.exists_by_phone(phone):
            raise ValueError("手机号已注册")
        return self.sms_service.send_code(phone, "register")

    def refresh_token(self, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Valid refresh token

        Returns:
            New token pair

        Raises:
            ValueError: If refresh token is invalid
        """
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user = self.user_repo.get(payload["sub"])
        if not user:
            raise ValueError("User not found")

        token_data = {"sub": str(user.id), "phone": user.phone}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    def get_current_user(self, user_id: str) -> User | None:
        """Get current user by ID."""
        return self.user_repo.get(user_id)

    def check_permission(self, user_id: str, org_id: str, allowed_roles: list[MemberRole]) -> bool:
        """Check if user has required role in organization."""
        return self.member_repo.has_role(org_id, user_id, allowed_roles)
