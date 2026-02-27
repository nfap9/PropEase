"""
Reset database - drop all tables and recreate them.
Usage: uv run python scripts/reset_db.py [--seed]

Options:
  --seed    Run seed_admin.py after reset to create admin user
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

    # Drop all tables
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
    """Run seed_admin.py to create admin user."""
    print("\n📦 Running seed script...")
    from scripts.seed_admin import seed_admin

    seed_admin()


def main():
    parser = argparse.ArgumentParser(description="Reset database")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Run seed_admin.py after reset to create admin user",
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
        response = input("⚠️  This will delete ALL data. Continue? [y/N] ")
        if response.lower() != "y":
            print("❌ Aborted")
            return

    reset_database()

    if args.seed:
        run_seed()
    else:
        print("\n💡 Tip: Run with --seed to create admin user")


if __name__ == "__main__":
    main()
