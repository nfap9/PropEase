"""
Apartment Ultra API - Main Application Entry Point

This is the main entry point for the Apartment Ultra backend API.
It configures the FastAPI application, middleware, and routes.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException

from app.configs import settings
from app.configs.logging import get_logger, setup_logging
from app.controllers.console import (
    apartments_router,
    auth_router,
    bills_router,
    custom_roles_router,
    leases_router,
    notifications_router,
    organizations_router,
    permissions_router,
    reports_router,
    subscriptions_router,
    tenants_router,
    utilities_router,
)
from app.middlewares.rate_limit import RateLimitMiddleware
from app.middlewares.request_logging import RequestLoggingMiddleware
from app.middlewares.response_wrapper import ResponseWrapperMiddleware
from app.controllers.common.errors import AppError
from app.controllers.common.exception_handlers import (
    app_error_handler,
    http_exception_handler,
    validation_error_handler,
    generic_exception_handler,
)

# 初始化日志系统
setup_logging(debug=settings.DEBUG, json_format=False)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME}...")

    # 初始化权限系统
    from app.configs.database import SessionLocal
    from app.services.permission_service import PermissionService

    db = SessionLocal()
    try:
        perm_service = PermissionService(db)
        logger.info("Initializing permissions...")
        perm_service.initialize_permissions()
        logger.info("Initializing system roles...")
        perm_service.initialize_system_roles()
        logger.info("Permission system initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize permission system: {e}")
    finally:
        db.close()

    # Start scheduler for background jobs
    from app.scheduler import start_scheduler, schedule_all_jobs

    try:
        schedule_all_jobs()
        start_scheduler()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")

    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")

    # Shutdown scheduler
    from app.scheduler import shutdown_scheduler

    try:
        shutdown_scheduler()
    except Exception as e:
        logger.error(f"Error shutting down scheduler: {e}")


def create_app() -> FastAPI:
    """Application factory function."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="Multi-tenant apartment management system API",
        version="0.1.0",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ==================== 注册异常处理器 ====================
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ==================== 注册中间件（顺序重要：后添加的先执行）====================
    # 响应包装（最内层）
    app.add_middleware(ResponseWrapperMiddleware)
    # Request logging middleware
    app.add_middleware(RequestLoggingMiddleware)
    # Rate limiting middleware
    app.add_middleware(RateLimitMiddleware)
    # CORS middleware（最外层）
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Include API routers
    app.include_router(
        auth_router,
        prefix=f"{settings.API_V1_PREFIX}/auth",
        tags=["Authentication"],
    )
    app.include_router(
        organizations_router,
        prefix=f"{settings.API_V1_PREFIX}/organizations",
        tags=["Organizations"],
    )
    app.include_router(
        apartments_router,
        prefix=f"{settings.API_V1_PREFIX}/apartments",
        tags=["Apartments & Rooms"],
    )
    app.include_router(
        tenants_router,
        prefix=f"{settings.API_V1_PREFIX}/tenants",
        tags=["Tenants"],
    )
    app.include_router(
        leases_router,
        prefix=f"{settings.API_V1_PREFIX}/leases",
        tags=["Leases"],
    )
    app.include_router(
        utilities_router,
        prefix=f"{settings.API_V1_PREFIX}/utilities",
        tags=["Utility Readings"],
    )
    app.include_router(
        bills_router,
        prefix=f"{settings.API_V1_PREFIX}/bills",
        tags=["Bills & Payments"],
    )
    app.include_router(
        reports_router,
        prefix=f"{settings.API_V1_PREFIX}/reports",
        tags=["Reports & Analytics"],
    )
    app.include_router(
        permissions_router,
        prefix=f"{settings.API_V1_PREFIX}/permissions",
        tags=["Permissions"],
    )
    app.include_router(
        subscriptions_router,
        prefix=f"{settings.API_V1_PREFIX}/subscriptions",
        tags=["Subscriptions"],
    )
    app.include_router(
        notifications_router,
        prefix=f"{settings.API_V1_PREFIX}/notifications",
        tags=["Notifications"],
    )
    app.include_router(
        custom_roles_router,
        prefix=f"{settings.API_V1_PREFIX}/custom-roles",
        tags=["Custom Roles"],
    )

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    def health_check():
        """Health check endpoint for monitoring."""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": "0.1.0",
        }

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
