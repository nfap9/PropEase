"""
Seed subscription plans.

Usage: uv run python scripts/seed_plans.py
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.configs.database import SessionLocal
from app.models.subscription import SubscriptionPlan


DEFAULT_PLANS = [
    {
        "name": "免费版",
        "code": "free",
        "description": "适合个人房东，基础功能免费使用",
        "price_monthly": 0,
        "price_yearly": 0,
        "max_apartments": 1,
        "max_rooms": 100,
        "max_members": 1,
        "features": {
            "can_invite": False,
            "can_export": True,
            "support": "community",
        },
        "sort_order": 0,
    },
    {
        "name": "专业版",
        "code": "pro",
        "description": "适合中小型公寓运营者，支持团队协作",
        "price_monthly": 99,
        "price_yearly": 999,
        "max_apartments": 5,
        "max_rooms": 500,
        "max_members": 5,
        "features": {
            "can_invite": True,
            "can_export": True,
            "support": "email",
            "reports": "advanced",
        },
        "sort_order": 1,
    },
    {
        "name": "企业版",
        "code": "enterprise",
        "description": "适合大型公寓运营企业，无限制使用",
        "price_monthly": 299,
        "price_yearly": 2999,
        "max_apartments": -1,  # Unlimited
        "max_rooms": -1,  # Unlimited
        "max_members": -1,  # Unlimited
        "features": {
            "can_invite": True,
            "can_export": True,
            "support": "priority",
            "reports": "advanced",
            "api_access": True,
            "custom_branding": True,
        },
        "sort_order": 2,
    },
]


def seed_plans():
    """Seed subscription plans."""
    db = SessionLocal()
    try:
        created_count = 0
        updated_count = 0

        for plan_data in DEFAULT_PLANS:
            existing = db.query(SubscriptionPlan).filter(
                SubscriptionPlan.code == plan_data["code"]
            ).first()

            if existing:
                # Update existing plan
                for key, value in plan_data.items():
                    setattr(existing, key, value)
                updated_count += 1
                print(f"📝 更新套餐: {plan_data['name']} ({plan_data['code']})")
            else:
                # Create new plan
                plan = SubscriptionPlan(**plan_data)
                db.add(plan)
                created_count += 1
                print(f"✅ 创建套餐: {plan_data['name']} ({plan_data['code']})")

        db.commit()
        print(f"\n🎉 套餐数据初始化完成!")
        print(f"   创建: {created_count} 个")
        print(f"   更新: {updated_count} 个")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding plans: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_plans()
