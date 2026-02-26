"""
Authentication service for user management and JWT operations.
"""
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from jose import jwt
import bcrypt

from app.services.base import BaseService
from app.repositories.user_repository import UserRepository
from app.repositories.organization_repository import OrganizationMemberRepository
from app.models.user import User
from app.models.organization import MemberRole
from app.configs import settings
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse


class AuthService(BaseService):
    """Service for authentication and user management."""

    def __init__(self, db: Session):
        super().__init__(db)
        self.user_repo = UserRepository(db)
        self.member_repo = OrganizationMemberRepository(db)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def create_refresh_token(
        self, data: dict, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT refresh token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            return payload
        except jwt.JWTError:
            return None

    def register(self, user_data: UserCreate) -> User:
        """
        Register a new user.

        Args:
            user_data: User registration data

        Returns:
            Created user

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        if self.user_repo.exists_by_email(user_data.email):
            raise ValueError("Email already registered")

        # Create user
        user = User(
            email=user_data.email,
            password_hash=self.hash_password(user_data.password),
            full_name=user_data.full_name,
        )
        return self.user_repo.create(user)

    def login(self, credentials: UserLogin) -> Token:
        """
        Authenticate user and return tokens.

        Args:
            credentials: Login credentials

        Returns:
            Token with access and refresh tokens

        Raises:
            ValueError: If credentials are invalid
        """
        user = self.user_repo.find_by_email(credentials.email)
        if not user or not self.verify_password(
            credentials.password, user.password_hash
        ):
            raise ValueError("Invalid email or password")

        token_data = {"sub": user.id, "email": user.email}
        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token(token_data)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )

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
        payload = self.decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user = self.user_repo.get(payload["sub"])
        if not user:
            raise ValueError("User not found")

        token_data = {"sub": user.id, "email": user.email}
        new_access_token = self.create_access_token(token_data)
        new_refresh_token = self.create_refresh_token(token_data)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    def get_current_user(self, user_id: int) -> Optional[User]:
        """Get current user by ID."""
        return self.user_repo.get(user_id)

    def check_permission(
        self, user_id: int, org_id: int, allowed_roles: list[MemberRole]
    ) -> bool:
        """Check if user has required role in organization."""
        return self.member_repo.has_role(org_id, user_id, allowed_roles)
