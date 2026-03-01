"""
认证服务单元测试。

测试覆盖：
- 用户注册（需要验证码）
- 用户登录（密码和验证码）
- Token 刷新
- 权限检查
"""
import pytest
from unittest.mock import patch, MagicMock

from app.services.auth_service import AuthService
from app.schemas.auth import UserCreate, UserLogin, Token


class TestAuthService:
    """认证服务测试类"""

    @pytest.fixture
    def auth_service(self, db_session):
        """创建认证服务实例"""
        return AuthService(db_session)

    @pytest.fixture
    def mock_sms_service(self):
        """Mock 短信服务"""
        with patch('app.services.auth_service.get_sms_provider') as mock:
            mock_provider = MagicMock()
            mock.return_value = mock_provider
            yield mock_provider

    def test_register_creates_new_user(self, auth_service, mock_sms_service):
        """测试：成功注册新用户"""
        # Arrange - Mock 验证码验证
        with patch.object(auth_service.sms_service, 'verify_code', return_value=True):
            user_data = UserCreate(
                phone="13800138000",
                password="Secure123",
                full_name="新用户",
                verification_code="123456",
            )

            # Act
            user = auth_service.register(user_data)

            # Assert
            assert user.id is not None
            assert user.phone == "13800138000"
            assert user.full_name == "新用户"
            assert user.password_hash != "Secure123"  # 密码应该被加密

    def test_register_rejects_duplicate_phone(self, auth_service, test_user, mock_sms_service):
        """测试：拒绝重复手机号注册"""
        # Arrange - Mock 验证码验证
        with patch.object(auth_service.sms_service, 'verify_code', return_value=True):
            user_data = UserCreate(
                phone=test_user.phone,  # 使用已存在的手机号
                password="Secure123",
                full_name="重复用户",
                verification_code="123456",
            )

            # Act & Assert
            with pytest.raises(ValueError, match="手机号已注册"):
                auth_service.register(user_data)

    def test_register_rejects_invalid_code(self, auth_service):
        """测试：拒绝无效验证码注册"""
        # Arrange - Mock 验证码验证返回 False
        with patch.object(auth_service.sms_service, 'verify_code', return_value=False):
            user_data = UserCreate(
                phone="13800138001",
                password="Secure123",
                full_name="新用户",
                verification_code="000000",
            )

            # Act & Assert
            with pytest.raises(ValueError, match="验证码无效或已过期"):
                auth_service.register(user_data)

    def test_login_with_password_returns_tokens(self, auth_service, test_user, mock_sms_service):
        """测试：密码登录成功返回 token"""
        # Arrange
        from app.utils.security import get_password_hash

        test_user.password_hash = get_password_hash("Test1234")
        auth_service.db.commit()

        credentials = UserLogin(phone=test_user.phone, password="Test1234")

        # Act
        token = auth_service.login(credentials)

        # Assert
        assert isinstance(token, Token)
        assert token.access_token is not None
        assert token.refresh_token is not None
        assert token.token_type == "bearer"

    def test_login_with_code_returns_tokens(self, auth_service, test_user, mock_sms_service):
        """测试：验证码登录成功返回 token"""
        # Arrange - Mock 验证码验证
        with patch.object(auth_service.sms_service, 'verify_code', return_value=True):
            credentials = UserLogin(phone=test_user.phone, verification_code="123456")

            # Act
            token = auth_service.login(credentials)

            # Assert
            assert isinstance(token, Token)
            assert token.access_token is not None
            assert token.refresh_token is not None

    def test_login_rejects_wrong_password(self, auth_service, test_user, mock_sms_service):
        """测试：登录拒绝错误密码"""
        # Arrange
        from app.utils.security import get_password_hash

        test_user.password_hash = get_password_hash("CorrectPassword123")
        auth_service.db.commit()

        credentials = UserLogin(phone=test_user.phone, password="WrongPassword123")

        # Act & Assert
        with pytest.raises(ValueError, match="手机号或密码错误"):
            auth_service.login(credentials)

    def test_login_rejects_nonexistent_phone(self, auth_service):
        """测试：登录拒绝不存在的手机号"""
        # Arrange
        credentials = UserLogin(phone="19999999999", password="SomePassword123")

        # Act & Assert
        with pytest.raises(ValueError, match="手机号或密码错误"):
            auth_service.login(credentials)

    def test_login_rejects_invalid_code(self, auth_service, test_user, mock_sms_service):
        """测试：验证码登录拒绝无效验证码"""
        # Arrange - Mock 验证码验证返回 False
        with patch.object(auth_service.sms_service, 'verify_code', return_value=False):
            credentials = UserLogin(phone=test_user.phone, verification_code="000000")

            # Act & Assert
            with pytest.raises(ValueError, match="验证码无效或已过期"):
                auth_service.login(credentials)

    def test_refresh_token_returns_new_tokens(self, auth_service, test_user, mock_sms_service):
        """测试：刷新 token 返回新的 token 对"""
        # Arrange
        import time
        from app.utils.security import get_password_hash

        test_user.password_hash = get_password_hash("Test1234")
        auth_service.db.commit()

        # 先登录获取 refresh token
        credentials = UserLogin(phone=test_user.phone, password="Test1234")
        login_token = auth_service.login(credentials)

        # 等待一秒确保时间戳不同
        time.sleep(1)

        # Act
        new_token = auth_service.refresh_token(login_token.refresh_token)

        # Assert
        assert isinstance(new_token, Token)
        assert new_token.access_token is not None
        assert new_token.refresh_token is not None
        assert new_token.token_type == "bearer"
        # refresh_token 应该不同（过期时间更长）
        assert new_token.refresh_token != login_token.refresh_token

    def test_refresh_token_rejects_invalid_token(self, auth_service):
        """测试：刷新 token 拒绝无效 token"""
        # Act & Assert
        with pytest.raises(ValueError, match="Invalid refresh token"):
            auth_service.refresh_token("invalid_token")

    def test_refresh_token_rejects_access_token(self, auth_service, test_user, mock_sms_service):
        """测试：不能使用 access token 刷新"""
        # Arrange
        from app.utils.security import get_password_hash, create_access_token

        test_user.password_hash = get_password_hash("Test1234")
        auth_service.db.commit()

        access_token = create_access_token({"sub": str(test_user.id), "phone": test_user.phone})

        # Act & Assert
        with pytest.raises(ValueError, match="Invalid refresh token"):
            auth_service.refresh_token(access_token)

    def test_get_current_user_returns_user(self, auth_service, test_user):
        """测试：获取当前用户"""
        # Act
        user = auth_service.get_current_user(test_user.id)

        # Assert
        assert user is not None
        assert user.id == test_user.id
        assert user.phone == test_user.phone

    def test_get_current_user_returns_none_for_nonexistent(self, auth_service):
        """测试：获取不存在的用户返回 None"""
        # Act
        user = auth_service.get_current_user(99999)

        # Assert
        assert user is None

    def test_check_permission_grants_access(self, auth_service, test_user, test_organization):
        """测试：权限检查通过"""
        # Arrange
        from app.models.organization import MemberRole

        # Act
        has_permission = auth_service.check_permission(
            test_user.id,
            test_organization.id,
            [MemberRole.OWNER, MemberRole.ADMIN],
        )

        # Assert
        assert has_permission is True

    def test_check_permission_denies_access(self, auth_service, db_session, test_organization):
        """测试：权限检查拒绝"""
        # Arrange
        from app.models.organization import MemberRole
        from app.models.user import User
        from app.models.organization import OrganizationMember

        # 创建一个普通成员
        viewer_user = User(
            phone="13900139000",
            password_hash="hash",
            full_name="普通成员",
        )
        db_session.add(viewer_user)
        db_session.commit()
        db_session.refresh(viewer_user)

        member = OrganizationMember(
            organization_id=test_organization.id,
            user_id=viewer_user.id,
            role=MemberRole.VIEWER,
        )
        db_session.add(member)
        db_session.commit()

        # Act
        has_permission = auth_service.check_permission(
            viewer_user.id,
            test_organization.id,
            [MemberRole.OWNER, MemberRole.ADMIN],
        )

        # Assert
        assert has_permission is False
