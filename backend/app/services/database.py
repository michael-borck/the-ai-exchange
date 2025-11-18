"""Database connection and session management."""

from collections.abc import Generator

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

from app.core.config import settings

# Create engine with appropriate settings based on database URL
if "sqlite" in settings.database_url:
    # SQLite specific settings
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL or other databases
    engine = create_engine(
        settings.database_url,
        echo=settings.debug,
    )


def get_session() -> Generator[Session, None, None]:
    """Get database session for dependency injection.

    Yields:
        Database session
    """
    with Session(engine) as session:
        yield session
