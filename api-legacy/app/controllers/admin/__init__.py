"""
运营后台 API 路由。
前缀: /api/v1/admin
认证: Bearer 令牌，payload.type=admin，sub=admin_user_id。
"""

from fastapi import APIRouter

from app.controllers.admin import auth as admin_auth
from app.controllers.admin import organizations as admin_organizations
from app.controllers.admin import registered_users as admin_registered_users
from app.controllers.admin import roles as admin_roles
from app.controllers.admin import stats as admin_stats
from app.controllers.admin import subscriptions as admin_subscriptions
from app.controllers.admin import users as admin_users

admin_router = APIRouter()

# 登录（无需认证）
admin_router.include_router(
    admin_auth.router,
    prefix="/auth",
    tags=["Admin Auth"],
)

# 以下需要 get_current_admin_user
admin_router.include_router(
    admin_users.router,
    prefix="/users",
    tags=["Admin Users"],
)
admin_router.include_router(
    admin_roles.router,
    prefix="/roles",
    tags=["Admin Roles"],
)
admin_router.include_router(
    admin_organizations.router,
    prefix="/organizations",
    tags=["Admin Organizations"],
)
admin_router.include_router(
    admin_registered_users.router,
    prefix="/registered-users",
    tags=["Admin Registered Users"],
)
admin_router.include_router(
    admin_subscriptions.router,
    prefix="",
    tags=["Admin Subscriptions"],
)
admin_router.include_router(
    admin_stats.router,
    prefix="",
    tags=["Admin Stats"],
)
