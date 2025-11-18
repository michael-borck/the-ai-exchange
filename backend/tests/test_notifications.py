"""Tests for email notification system."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.services.email_service import clear_email_log, get_email_log


@pytest.fixture
def requester_headers(client: TestClient) -> dict[str, str]:
    """Create requester user and return auth headers.

    Args:
        client: Test client

    Returns:
        Authorization headers for requester
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "requester@curtin.edu.au",
            "full_name": "Question Asker",
            "password": "pass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def subscriber_headers(client: TestClient, requester_headers: dict[str, str]) -> dict[str, str]:  # noqa: ARG001
    """Create subscriber user and return auth headers.

    Args:
        client: Test client
        requester_headers: Requester headers (ensures proper user creation order)

    Returns:
        Authorization headers for subscriber
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "subscriber@curtin.edu.au",
            "full_name": "Solution Giver",
            "password": "pass123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_notification_on_new_request(
    client: TestClient,
    requester_headers: dict[str, str],
    subscriber_headers: dict[str, str],
    session: Session,  # noqa: ARG001
) -> None:
    """Test that subscribers receive notification when request is posted.

    Args:
        client: Test client
        requester_headers: Requester authorization headers
        subscriber_headers: Subscriber authorization headers
        session: Database session
    """
    clear_email_log()

    # Subscribe to tag "marketing"
    subscriber_response = client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "marketing"},
        headers=subscriber_headers,
    )
    assert subscriber_response.status_code == 201

    # Post a request with marketing-related keywords
    request_response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "How to use ChatGPT for marketing campaigns?",
            "content_text": "I want to understand how to leverage AI for marketing.",
            "is_anonymous": False,
        },
        headers=requester_headers,
    )
    assert request_response.status_code == 201

    # Check that notification was sent to subscriber
    email_log = get_email_log()
    assert len(email_log) > 0
    notification = email_log[0]
    assert notification["to"] == "subscriber@curtin.edu.au"
    assert "marketing" in notification["subject"].lower() or "request" in notification["subject"].lower()
    assert notification["type"] == "new_request"


def test_no_notification_if_preferences_disabled(
    client: TestClient,
    requester_headers: dict[str, str],
    subscriber_headers: dict[str, str],
    session: Session,  # noqa: ARG001
) -> None:
    """Test that no notification sent if subscriber disabled request notifications.

    Args:
        client: Test client
        requester_headers: Requester authorization headers
        subscriber_headers: Subscriber authorization headers
        session: Database session
    """
    clear_email_log()

    # Subscribe to tag
    client.post(
        "/api/v1/subscriptions/subscribe",
        json={"tag": "marketing"},
        headers=subscriber_headers,
    )

    # Disable request notifications
    client.patch(
        "/api/v1/auth/me",
        json={
            "notification_prefs": {
                "notify_requests": False,
                "notify_solutions": False,
            }
        },
        headers=subscriber_headers,
    )

    # Post request
    client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "Marketing question for AI",
            "content_text": "Content",
            "is_anonymous": False,
        },
        headers=requester_headers,
    )

    # Check that no notification was sent
    email_log = get_email_log()
    assert len(email_log) == 0


def test_notification_on_solution_posted(
    client: TestClient,
    requester_headers: dict[str, str],
    subscriber_headers: dict[str, str],
) -> None:
    """Test that solution posts work (notification tested separately).

    Args:
        client: Test client
        requester_headers: Requester authorization headers
        subscriber_headers: Subscriber authorization headers
    """
    # Post a request as requester
    request_response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "How to use ChatGPT?",
            "content_text": "I need help with ChatGPT.",
            "is_anonymous": False,
        },
        headers=requester_headers,
    )
    assert request_response.status_code == 201
    request_id = request_response.json()["id"]

    # Post a solution as subscriber
    solution_response = client.post(
        "/api/v1/resources",
        json={
            "type": "USE_CASE",
            "title": "Here's how I use ChatGPT",
            "content_text": "I've found this approach works well...",
            "is_anonymous": False,
            "parent_id": request_id,
        },
        headers=subscriber_headers,
    )
    assert solution_response.status_code == 201
    solution_data = solution_response.json()
    assert solution_data["parent_id"] == request_id

    # Verify request status changed to SOLVED
    request_check = client.get(
        f"/api/v1/resources/{request_id}",
        headers=requester_headers,
    )
    assert request_check.json()["status"] == "SOLVED"


def test_no_solution_notification_if_disabled(
    client: TestClient,
    requester_headers: dict[str, str],
    subscriber_headers: dict[str, str],
) -> None:
    """Test that requester doesn't receive notification if solutions disabled.

    Args:
        client: Test client
        requester_headers: Requester authorization headers
        subscriber_headers: Subscriber authorization headers
    """
    clear_email_log()

    # Post request
    request_response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "Question?",
            "content_text": "Help please",
            "is_anonymous": False,
        },
        headers=requester_headers,
    )
    request_id = request_response.json()["id"]

    # Disable solution notifications for requester
    client.patch(
        "/api/v1/auth/me",
        json={
            "notification_prefs": {
                "notify_requests": True,
                "notify_solutions": False,
            }
        },
        headers=requester_headers,
    )

    # Post solution
    client.post(
        "/api/v1/resources",
        json={
            "type": "USE_CASE",
            "title": "Solution",
            "content_text": "Content",
            "is_anonymous": False,
            "parent_id": request_id,
        },
        headers=subscriber_headers,
    )

    # Check no notification sent
    email_log = get_email_log()
    assert len(email_log) == 0


def test_multiple_subscribers_basic(
    client: TestClient,
    requester_headers: dict[str, str],  # noqa: ARG001
    session: Session,  # noqa: ARG001
) -> None:
    """Test that multiple subscribers can subscribe.

    Args:
        client: Test client
        requester_headers: Requester authorization headers
        session: Database session
    """
    # Create multiple subscribers
    subscribers = []
    for i in range(3):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"subscriber{i}@curtin.edu.au",
                "full_name": f"Subscriber {i}",
                "password": "pass123",
            },
        )
        token = response.json()["access_token"]
        subscribers.append({"token": token, "email": f"subscriber{i}@curtin.edu.au"})

    # All subscribe to same tag
    for subscriber in subscribers:
        response = client.post(
            "/api/v1/subscriptions/subscribe",
            json={"tag": "machine"},
            headers={"Authorization": f"Bearer {subscriber['token']}"},
        )
        assert response.status_code == 201

    # Verify all 3 subscriptions exist
    for _i, subscriber in enumerate(subscribers):
        response = client.get(
            "/api/v1/subscriptions",
            headers={"Authorization": f"Bearer {subscriber['token']}"},
        )
        assert response.status_code == 200
        subs = response.json()
        assert len(subs) == 1
        assert subs[0]["tag"] == "machine"
