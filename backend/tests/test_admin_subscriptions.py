"""Tests for admin and subscription endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import hash_password
from app.models import User, UserRole


@pytest.fixture
def admin_headers(client: TestClient, session: Session) -> dict[str, str]:  # noqa: ARG001
    """Create admin user and return auth headers.

    Args:
        client: Test client
        session: Database session

    Returns:
        Authorization headers for admin
    """
    # Register first user (becomes admin)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@curtin.edu.au",
            "full_name": "Admin User",
            "password": "adminpass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers(client: TestClient, admin_headers: dict[str, str]) -> dict[str, str]:  # noqa: ARG001
    """Create staff user and return auth headers.

    Args:
        client: Test client
        admin_headers: Admin headers (ensures admin is created first)

    Returns:
        Authorization headers for staff
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "staff@curtin.edu.au",
            "full_name": "Staff User",
            "password": "staffpass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# Admin User Management Tests


def test_list_users_admin(client: TestClient, admin_headers: dict[str, str]) -> None:
    """Test listing users as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
    """
    response = client.get(
        "/api/v1/admin/users",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(user["email"] == "admin@curtin.edu.au" for user in data)


def test_list_users_staff_forbidden(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test that staff cannot list users.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    response = client.get(
        "/api/v1/admin/users",
        headers=staff_headers,
    )
    assert response.status_code == 403
    assert "Only admins" in response.json()["detail"]


def test_get_user_admin(
    client: TestClient,
    admin_headers: dict[str, str],
    session: Session,
) -> None:
    """Test getting a specific user as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        session: Database session
    """
    # Create a user to retrieve
    user = User(
        email="testuser@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password("pass123"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    response = client.get(
        f"/api/v1/admin/users/{user.id}",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@curtin.edu.au"


def test_update_user_role(
    client: TestClient,
    admin_headers: dict[str, str],
    session: Session,
) -> None:
    """Test changing user role as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        session: Database session
    """
    # Create staff user
    user = User(
        email="staffuser@curtin.edu.au",
        full_name="Staff User",
        hashed_password=hash_password("pass123"),
        role=UserRole.STAFF,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Update to admin
    response = client.patch(
        f"/api/v1/admin/users/{user.id}/role",
        json={"role": "ADMIN"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ADMIN"


def test_update_user_status(
    client: TestClient,
    admin_headers: dict[str, str],
    session: Session,
) -> None:
    """Test deactivating user as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        session: Database session
    """
    # Create user
    user = User(
        email="usertoblock@curtin.edu.au",
        full_name="User To Block",
        hashed_password=hash_password("pass123"),
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Deactivate
    response = client.patch(
        f"/api/v1/admin/users/{user.id}/status",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is False

    # Verify user cannot login
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "usertoblock@curtin.edu.au",
            "password": "pass123",
        },
    )
    assert login_response.status_code == 403


def test_approve_user(
    client: TestClient,
    admin_headers: dict[str, str],
    session: Session,
) -> None:
    """Test approving external user as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        session: Database session
    """
    # Create unapproved user
    user = User(
        email="external@example.com",
        full_name="External User",
        hashed_password=hash_password("pass123"),
        is_approved=False,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Approve
    response = client.patch(
        f"/api/v1/admin/users/{user.id}/approve",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_approved"] is True


def test_delete_user(
    client: TestClient,
    admin_headers: dict[str, str],
    session: Session,
) -> None:
    """Test deleting user as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        session: Database session
    """
    # Create user
    user = User(
        email="todelete@curtin.edu.au",
        full_name="To Delete",
        hashed_password=hash_password("pass123"),
    )
    session.add(user)
    session.commit()
    user_id = user.id

    # Delete
    response = client.delete(
        f"/api/v1/admin/users/{user_id}",
        headers=admin_headers,
    )
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(
        f"/api/v1/admin/users/{user_id}",
        headers=admin_headers,
    )
    assert get_response.status_code == 404


# Admin Resource Management Tests


def test_verify_resource(
    client: TestClient,
    admin_headers: dict[str, str],
    staff_headers: dict[str, str],
) -> None:
    """Test verifying resource as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        staff_headers: Staff authorization headers
    """
    # Create resource as staff
    resource_response = client.post(
        "/api/v1/resources",
        json={
            "type": "POLICY",
            "title": "AI Policy",
            "content_text": "This is our AI policy...",
            "is_anonymous": False,
        },
        headers=staff_headers,
    )
    resource_id = resource_response.json()["id"]

    # Verify as admin
    response = client.patch(
        f"/api/v1/admin/resources/{resource_id}/verify",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_verified"] is True


def test_hide_resource(
    client: TestClient,
    admin_headers: dict[str, str],
    staff_headers: dict[str, str],
) -> None:
    """Test hiding resource as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        staff_headers: Staff authorization headers
    """
    # Create resource
    resource_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Inappropriate content",
            "content_text": "Some bad content...",
            "is_anonymous": False,
        },
        headers=staff_headers,
    )
    resource_id = resource_response.json()["id"]

    # Hide as admin
    response = client.patch(
        f"/api/v1/admin/resources/{resource_id}/hide",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_hidden"] is True

    # Verify hidden from list
    list_response = client.get(
        "/api/v1/resources",
        headers=staff_headers,
    )
    resources = list_response.json()
    assert not any(r["id"] == resource_id for r in resources)


def test_unhide_resource(
    client: TestClient,
    admin_headers: dict[str, str],
    staff_headers: dict[str, str],
) -> None:
    """Test unhiding resource as admin.

    Args:
        client: Test client
        admin_headers: Admin authorization headers
        staff_headers: Staff authorization headers
    """
    # Create and hide resource
    resource_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Hidden resource",
            "content_text": "Content...",
            "is_anonymous": False,
        },
        headers=staff_headers,
    )
    resource_id = resource_response.json()["id"]

    client.patch(
        f"/api/v1/admin/resources/{resource_id}/hide",
        headers=admin_headers,
    )

    # Unhide
    response = client.patch(
        f"/api/v1/admin/resources/{resource_id}/unhide",
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_hidden"] is False


# Subscription Tests


def test_subscribe_to_tag(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test subscribing to tag.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    response = client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "Marketing"},
        headers=staff_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tag"] == "Marketing"


def test_subscribe_duplicate(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test that duplicate subscriptions are rejected.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    # Subscribe once
    client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "Marketing"},
        headers=staff_headers,
    )

    # Try to subscribe again
    response = client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "Marketing"},
        headers=staff_headers,
    )
    assert response.status_code == 400
    assert "already subscribed" in response.json()["detail"].lower()


def test_unsubscribe_from_tag(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test unsubscribing from tag.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    # Subscribe
    client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "Marketing"},
        headers=staff_headers,
    )

    # Unsubscribe
    response = client.delete(
        "/api/v1/subscriptions/unsubscribe/Marketing",
        headers=staff_headers,
    )
    assert response.status_code == 204

    # Verify unsubscribed
    get_response = client.get(
        "/api/v1/subscriptions",
        headers=staff_headers,
    )
    subscriptions = get_response.json()
    assert not any(sub["tag"] == "Marketing" for sub in subscriptions)


def test_get_subscriptions(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test getting user subscriptions.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    # Subscribe to multiple tags
    tags = ["Marketing", "Finance", "Analytics"]
    for tag in tags:
        client.post(
            "/api/v1/subscriptions/subscribe",
            json={"tag": tag},
            headers=staff_headers,
        )

    # Get subscriptions
    response = client.get(
        "/api/v1/subscriptions",
        headers=staff_headers,
    )
    assert response.status_code == 200
    subscriptions = response.json()
    assert len(subscriptions) == 3
    assert all(sub["tag"] in tags for sub in subscriptions)


def test_update_notification_prefs(
    client: TestClient,
    staff_headers: dict[str, str],
) -> None:
    """Test updating notification preferences.

    Args:
        client: Test client
        staff_headers: Staff authorization headers
    """
    response = client.patch(
        "/api/v1/subscriptions/notify-prefs",
        json={
            "notify_requests": False,
            "notify_solutions": True,
        },
        headers=staff_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notify_requests"] is False
    assert data["notify_solutions"] is True

    # Verify persisted
    me_response = client.get(
        "/api/v1/auth/me",
        headers=staff_headers,
    )
    me_data = me_response.json()
    assert me_data["notification_prefs"]["notify_requests"] is False
    assert me_data["notification_prefs"]["notify_solutions"] is True
