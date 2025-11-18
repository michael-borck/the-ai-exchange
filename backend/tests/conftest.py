"""Pytest configuration and shared fixtures."""

from collections.abc import Generator

import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.services.database import get_session


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    """Create an in-memory SQLite database for testing.

    Yields:
        Database session
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator:  # type: ignore[type-arg]
    """Create a test client with test database.

    Args:
        session: Test database session

    Yields:
        FastAPI test client
    """
    def get_session_override() -> Session:
        return session

    app.dependency_overrides[get_session] = get_session_override

    from fastapi.testclient import TestClient

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
