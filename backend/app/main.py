"""FastAPI application entry point for The AI Exchange."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlmodel import SQLModel

from app.api import auth, resources
from app.core.config import settings
from app.services.database import engine

# Configure logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup: Create tables
    logger.info("Starting up The AI Exchange API...")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables created/verified")

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
