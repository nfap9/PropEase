# Console API controllers
from .apartments import router as apartments_router
from .auth import router as auth_router
from .bills import router as bills_router
from .custom_roles import router as custom_roles_router
from .leases import router as leases_router
from .notifications import router as notifications_router
from .organizations import router as organizations_router
from .permissions import router as permissions_router
from .reports import router as reports_router
from .subscriptions import router as subscriptions_router
from .tenants import router as tenants_router
from .utilities import router as utilities_router

__all__ = [
    "auth_router",
    "organizations_router",
    "apartments_router",
    "tenants_router",
    "leases_router",
    "utilities_router",
    "bills_router",
    "reports_router",
    "permissions_router",
    "subscriptions_router",
    "notifications_router",
    "custom_roles_router",
]
