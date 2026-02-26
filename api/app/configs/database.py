"""
Database configuration module.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .settings import settings


# Convert postgresql:// to postgresql+psycopg:// for psycopg3 driver
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Get database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
