"""
Reset database - drop all tables and recreate them.
Usage: uv run python scripts/reset_db.py [--seed]

Options:
  --seed    重置后运行种子脚本（仅添加一个系统管理员）
"""
import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.configs.database import engine, Base, SessionLocal

# Import all models to ensure they are registered
from app.models import *  # noqa: F401, F403


def get_all_table_names():
    """Get all table names from the database."""
    with SessionLocal() as session:
        if engine.dialect.name == "postgresql":
            result = session.execute(
                text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                )
            )
            return [row[0] for row in result]
        elif engine.dialect.name == "sqlite":
            result = session.execute(
                text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                )
            )
            return [row[0] for row in result]
        else:
            # Generic fallback - use SQLAlchemy metadata
            return list(Base.metadata.tables.keys())


def reset_database():
    """Drop all tables and recreate them."""
    print("🗑️  Resetting database...")

    # Get table names before dropping
    try:
        tables = get_all_table_names()
        if tables:
            print(f"   Found {len(tables)} tables to drop")
    except Exception:
        print("   Could not list existing tables (may be empty)")

    # For PostgreSQL, drop all tables with CASCADE to handle dependencies
    if engine.dialect.name == "postgresql":
        with SessionLocal() as session:
            # Drop all tables in public schema with CASCADE
            for table in tables:
                session.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
            session.commit()
        print("   ✅ All tables dropped (CASCADE)")
    else:
        # For other databases (SQLite), use SQLAlchemy's drop_all
        Base.metadata.drop_all(bind=engine)
        print("   ✅ All tables dropped")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("   ✅ All tables recreated")

    # Also run alembic stamp to mark migrations as current
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config(Path(__file__).parent.parent / "alembic.ini")
        command.stamp(alembic_cfg, "head")
        print("   ✅ Alembic migrations marked as current")
    except Exception as e:
        print(f"   ⚠️  Could not stamp alembic: {e}")

    print("✅ Database reset complete!")


def run_seed():
    """运行种子脚本：默认仅添加一个系统管理员。"""
    print("\n📦 运行种子脚本...")
    from scripts.seed_demo import seed_admin_only

    seed_admin_only()


def main():
    parser = argparse.ArgumentParser(description="Reset database")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="重置后运行种子脚本（仅添加一个系统管理员）",
    )
    parser.add_argument(
        "-y",
        "--yes",
        action="store_true",
        help="Skip confirmation prompt",
    )
    args = parser.parse_args()

    # Confirm before resetting
    if not args.yes:
        response = input("⚠️  将删除所有数据，是否继续？[y/N] ")
        if response.lower() != "y":
            print("❌ 已取消")
            return

    reset_database()

    if args.seed:
        run_seed()
    else:
        print("\n💡 提示：可加 --seed 在重置后添加系统管理员")


if __name__ == "__main__":
    main()
