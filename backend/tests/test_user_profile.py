"""Tests for user profile endpoints."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Create authenticated user and return auth headers.

    Args:
        client: Test client

    Returns:
        Authorization headers
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@curtin.edu.au",
            "full_name": "Test User",
            "password": "testpass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_update_user_profile(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test updating user profile.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.patch(
        "/api/v1/auth/me",
        json={
            "full_name": "Updated Name",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"


def test_update_notification_preferences(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test updating notification preferences via profile endpoint.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.patch(
        "/api/v1/auth/me",
        json={
            "notification_prefs": {
                "notify_requests": False,
                "notify_solutions": True,
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notification_prefs"]["notify_requests"] is False
    assert data["notification_prefs"]["notify_solutions"] is True


def test_update_both_profile_and_prefs(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test updating both name and preferences at once.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.patch(
        "/api/v1/auth/me",
        json={
            "full_name": "New Name",
            "notification_prefs": {
                "notify_requests": True,
                "notify_solutions": False,
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "New Name"
    assert data["notification_prefs"]["notify_requests"] is True
    assert data["notification_prefs"]["notify_solutions"] is False


def test_update_with_no_changes(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test PATCH with empty request body (no updates).

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers,
    )
    original = response.json()

    # PATCH with no changes
    response = client.patch(
        "/api/v1/auth/me",
        json={},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == original["full_name"]
    assert data["notification_prefs"] == original["notification_prefs"]


def test_get_updated_profile(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test that updates persist when fetching user again.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Update profile
    client.patch(
        "/api/v1/auth/me",
        json={
            "full_name": "Persistent Name",
        },
        headers=auth_headers,
    )

    # Fetch again
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Persistent Name"


def test_update_without_auth(client: TestClient) -> None:
    """Test that profile update requires authentication.

    Args:
        client: Test client
    """
    response = client.patch(
        "/api/v1/auth/me",
        json={
            "full_name": "Hacker",
        },
    )
    assert response.status_code == 401
