# Console API controllers
from .auth import router as auth_router
from .organizations import router as organizations_router
from .apartments import router as apartments_router
from .tenants import router as tenants_router
from .leases import router as leases_router
from .utilities import router as utilities_router
from .bills import router as bills_router
from .reports import router as reports_router
from .permissions import router as permissions_router

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
]
