"""Pytest configuration and shared fixtures."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.rate_limiter import disable_rate_limiter
from app.core.security import hash_password
from app.main import app
from app.models import User, UserRole
from app.services.database import get_session

# Strong password for all tests (meets complexity requirements)
TEST_PASSWORD = "TestP@ss1234"


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
    # Disable rate limiting for tests
    disable_rate_limiter()

    def get_session_override() -> Session:
        return session

    app.dependency_overrides[get_session] = get_session_override

    from fastapi.testclient import TestClient

    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def create_verified_user(
    session: Session,
    email: str = "user@curtin.edu.au",
    full_name: str = "Test User",
    role: UserRole = UserRole.STAFF,
    password: str = TEST_PASSWORD,
) -> User:
    """Create a verified, active, approved user for testing."""
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def login_and_get_token(client: TestClient, email: str, password: str = TEST_PASSWORD) -> str:
    """Login and return the access token from the httpOnly cookie.

    Removes the cookie from the client's jar afterwards: callers use the
    returned token as a Bearer header, and get_current_user prefers the cookie
    over the header — a leftover cookie from a later login would silently
    authenticate every request as that last user.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    token = response.cookies.get("access_token")
    if not token:
        raise ValueError(f"Login failed or no cookie set: {response.status_code} {response.json()}")
    client.cookies.delete("access_token")
    return token
