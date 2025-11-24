"""FastAPI application entry point for The AI Exchange."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlmodel import SQLModel

from app.api import (
    admin,
    admin_config,
    analytics,
    auth,
    collections,
    comments,
    prompts,
    resources,
    subscriptions,
)
from app.core.config import settings
from app.core.rate_limiter import limiter
from app.services.config import ConfigService
from app.services.database import engine, get_session

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Create tables
    logger.info("Starting up The AI Exchange API...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables created/verified")

    # Seed configurable values from defaults.yaml
    logger.info("Seeding configurable values...")
    session = get_session()
    try:
        ConfigService.seed_database(session)
        logger.info("Configurable values seeded successfully")
    except Exception as e:
        logger.warning(f"Could not seed configurable values: {e}")
    finally:
        session.close()

    yield

    # Shutdown
    logger.info("Shutting down The AI Exchange API...")


app = FastAPI(
    title=settings.project_name,
    description="Internal platform for sharing and discovering AI use cases",
    version="0.1.0",
    openapi_url=f"{settings.api_v1_str}/openapi.json",
    lifespan=lifespan,
)

# Add rate limiter to app
app.state.limiter = limiter


def rate_limit_handler(_request: Request, _exc: Exception) -> JSONResponse:
    """Handle rate limit exceeded errors."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "error": "rate_limit_exceeded",
        },
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Add middleware for rate limiting
app.add_middleware(SlowAPIMiddleware)

# Add middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "testserver",  # For tests
    ],
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Health check endpoint.

    Returns:
        Status message
    """
    return {"status": "ok"}


# Include API routers
app.include_router(auth.router)
app.include_router(resources.router)
app.include_router(comments.router)
app.include_router(prompts.router)
app.include_router(collections.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(admin_config.router)
app.include_router(subscriptions.router)


# API v1 routes
@app.get(f"{settings.api_v1_str}/", tags=["System"])
def read_root() -> dict[str, str]:
    """API root endpoint.

    Returns:
        Welcome message
    """
    return {
        "message": "Welcome to The AI Exchange API",
        "docs": f"{settings.api_v1_str}/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
