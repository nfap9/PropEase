"""
Database configuration module.
"""
from .settings import settings


def get_database_url() -> str:
    """Get database URL from settings."""
    return settings.DATABASE_URL


def get_database_config() -> dict:
    """Get database connection pool configuration."""
    return {
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "echo": settings.DB_ECHO,
    }
