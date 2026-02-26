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
            raise ValueError(
                "生产环境必须设置 SECRET_KEY 环境变量！"
                "请生成一个安全的密钥，例如: openssl rand -hex 32"
            )


def _is_production() -> bool:
    """判断是否为生产环境。"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    return env in ("production", "prod", "live")


# Global settings instance
settings = Settings()

# 生产环境启动时验证配置
if _is_production():
    settings.validate_production()
