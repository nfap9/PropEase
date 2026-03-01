"""
Application settings module.
Configuration loaded from environment variables.
"""

import os

from pydantic_settings import BaseSettings

# 默认密钥，用于开发环境（生产环境必须设置环境变量）
_DEFAULT_SECRET_KEY = "dev-secret-key-do-not-use-in-production"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Apartment Ultra API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/apartment_ultra"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 3600
    DB_ECHO: bool = False

    # Security
    SECRET_KEY: str = _DEFAULT_SECRET_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 60  # 请求数
    RATE_LIMIT_PERIOD: int = 60  # 秒

    # SMS Service
    SMS_PROVIDER: str = "mock"  # mock, aliyun, tencent
    SMS_ACCESS_KEY: str = ""
    SMS_SECRET: str = ""
    SMS_SIGN_NAME: str = ""
    SMS_TEMPLATE_CODE: str = ""
    SMS_CODE_EXPIRE_MINUTES: int = 5
    SMS_CODE_RESEND_SECONDS: int = 60
    SMS_CODE_MAX_DAILY: int = 10  # 同一手机号每日最大发送次数

    # 运营后台种子账号（仅首次初始化时使用，可选）
    ADMIN_INIT_USERNAME: str = "admin"
    ADMIN_INIT_PASSWORD: str = "Admin@123456"

    # 运营后台账号安全
    ADMIN_MAX_LOGIN_ATTEMPTS: int = 5  # 连续失败次数超过此次数后锁定
    ADMIN_LOCKOUT_MINUTES: int = 15  # 锁定时长（分钟）
    ADMIN_LOGIN_RATE_LIMIT_PER_MINUTE: int = 5  # 每 IP 每分钟最多登录尝试次数
    ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 运营后台 JWT 过期时间（分钟）
    ADMIN_PASSWORD_MIN_LENGTH: int = 8
    ADMIN_PASSWORD_REQUIRE_COMPLEXITY: bool = True  # 密码需包含大小写、数字、特殊字符

    # 微信支付（订阅支付）
    WECHAT_PAY_ENABLED: bool = False
    WECHAT_MCH_ID: str = ""
    WECHAT_APIV3_KEY: str = ""
    WECHAT_APP_ID: str = ""
    WECHAT_PRIVATE_KEY_PATH: str = ""  # 商户 API 私钥文件路径，与 PRIVATE_KEY 二选一
    WECHAT_PRIVATE_KEY: str = ""  # 商户 API 私钥内容（环境变量中可填 PEM 多行）
    WECHAT_CERT_SERIAL_NO: str = ""
    WECHAT_PAY_NOTIFY_URL_BASE: str = ""  # 回调基础 URL，如 https://api.example.com

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def validate_production(self) -> None:
        """验证生产环境配置。如果配置不安全则抛出异常。"""
        if self.SECRET_KEY == _DEFAULT_SECRET_KEY:
            raise ValueError("生产环境必须设置 SECRET_KEY 环境变量！请生成一个安全的密钥，例如: openssl rand -hex 32")


def _is_production() -> bool:
    """判断是否为生产环境。"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    return env in ("production", "prod", "live")


# Global settings instance
settings = Settings()

# 生产环境启动时验证配置
if _is_production():
    settings.validate_production()
