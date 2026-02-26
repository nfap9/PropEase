"""
Apartment Ultra API - Main Application Entry Point

This is the main entry point for the Apartment Ultra backend API.
It configures the FastAPI application, middleware, and routes.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.configs import settings
from app.controllers.console import (
    auth_router,
    organizations_router,
    apartments_router,
    tenants_router,
    leases_router,
    utilities_router,
    bills_router,
    reports_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    print(f"🚀 Starting {settings.APP_NAME}...")
    yield
    # Shutdown
    print(f"👋 Shutting down {settings.APP_NAME}...")


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

    # CORS middleware
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
