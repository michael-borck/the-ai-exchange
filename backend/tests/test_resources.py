"""Tests for resource CRUD endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session


@pytest.fixture
def auth_headers(client: TestClient, session: Session) -> dict[str, str]:  # noqa: ARG001
    """Create authenticated user and return auth headers.

    Args:
        client: Test client
        session: Database session

    Returns:
        Authorization headers
    """
    # Register user
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


def test_create_request(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test creating a request.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "How to use ChatGPT for marketing?",
            "content_text": "I want to learn how to use ChatGPT for marketing campaigns effectively.",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "REQUEST"
    assert data["title"] == "How to use ChatGPT for marketing?"
    assert data["status"] == "OPEN"
    assert data["is_anonymous"] is False
    assert len(data["system_tags"]) > 0  # Should have auto-generated tags


def test_create_anonymous_request(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test creating an anonymous request.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "Anonymous question",
            "content_text": "I want to ask something anonymously",
            "is_anonymous": True,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["is_anonymous"] is True


def test_create_prompt(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test creating a prompt.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Email marketing prompt",
            "content_text": "Use this prompt to generate email content...",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "PROMPT"


def test_create_use_case(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test creating a use case.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    response = client.post(
        "/api/v1/resources",
        json={
            "type": "USE_CASE",
            "title": "Using ChatGPT for market research",
            "content_text": "Here's how I used ChatGPT to conduct market research...",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "USE_CASE"


def test_create_solution_to_request(
    client: TestClient,
    auth_headers: dict[str, str],
    session: Session,  # noqa: ARG001
) -> None:
    """Test creating a solution (response) to a request.

    Args:
        client: Test client
        auth_headers: Authorization headers
        session: Database session
    """
    # Create request first
    request_response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "Need help with AI",
            "content_text": "How can I use AI for marketing?",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    request_id = request_response.json()["id"]

    # Create solution
    solution_response = client.post(
        "/api/v1/resources",
        json={
            "type": "USE_CASE",
            "title": "Used ChatGPT for campaigns",
            "content_text": "Here's how I used ChatGPT...",
            "is_anonymous": False,
            "parent_id": request_id,
        },
        headers=auth_headers,
    )
    assert solution_response.status_code == 201
    solution_data = solution_response.json()
    assert solution_data["parent_id"] == request_id

    # Check request status changed to SOLVED
    request_check = client.get(
        f"/api/v1/resources/{request_id}",
        headers=auth_headers,
    )
    assert request_check.json()["status"] == "SOLVED"


def test_get_resource(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test getting a single resource.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create resource
    create_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Test prompt",
            "content_text": "Test content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    resource_id = create_response.json()["id"]

    # Get resource
    response = client.get(
        f"/api/v1/resources/{resource_id}",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == resource_id
    assert data["title"] == "Test prompt"


def test_list_resources(client: TestClient, auth_headers: dict[str, str]) -> None:
    """Test listing resources.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create multiple resources
    for i in range(3):
        client.post(
            "/api/v1/resources",
            json={
                "type": "PROMPT",
                "title": f"Prompt {i}",
                "content_text": f"Content {i}",
                "is_anonymous": False,
            },
            headers=auth_headers,
        )

    # List resources
    response = client.get(
        "/api/v1/resources",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3


def test_list_resources_with_type_filter(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test filtering resources by type.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create different types
    client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "A prompt",
            "content_text": "Content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "A request",
            "content_text": "Content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )

    # Filter by type
    response = client.get(
        "/api/v1/resources?type=PROMPT",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert all(item["type"] == "PROMPT" for item in data)


def test_list_resources_with_search(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test searching resources.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create resource with specific title
    client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Unique Title XYZ",
            "content_text": "Some content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )

    # Search
    response = client.get(
        "/api/v1/resources?search=Unique",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert any("Unique" in item["title"] for item in data)


def test_update_resource(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test updating a resource.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create resource
    create_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Original title",
            "content_text": "Original content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    resource_id = create_response.json()["id"]

    # Update resource
    response = client.patch(
        f"/api/v1/resources/{resource_id}",
        json={
            "title": "Updated title",
            "content_text": "Updated content",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated title"
    assert data["content_text"] == "Updated content"


def test_update_resource_not_owner(
    client: TestClient,
    auth_headers: dict[str, str],
    session: Session,  # noqa: ARG001
) -> None:
    """Test that non-owner cannot update resource.

    Args:
        client: Test client
        auth_headers: Authorization headers
        session: Database session
    """
    # Create resource with first user
    create_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "Original",
            "content_text": "Content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    resource_id = create_response.json()["id"]

    # Register second user
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@curtin.edu.au",
            "full_name": "Other User",
            "password": "otherpass123",
        },
    )
    other_token = response.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Try to update with second user
    response = client.patch(
        f"/api/v1/resources/{resource_id}",
        json={"title": "Hacked title"},
        headers=other_headers,
    )
    assert response.status_code == 403
    assert "Only resource owner" in response.json()["detail"]


def test_delete_resource(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test deleting a resource.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create resource
    create_response = client.post(
        "/api/v1/resources",
        json={
            "type": "PROMPT",
            "title": "To delete",
            "content_text": "Content",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    resource_id = create_response.json()["id"]

    # Delete resource
    response = client.delete(
        f"/api/v1/resources/{resource_id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(
        f"/api/v1/resources/{resource_id}",
        headers=auth_headers,
    )
    assert get_response.status_code == 404


def test_get_solutions(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    """Test getting solutions for a request.

    Args:
        client: Test client
        auth_headers: Authorization headers
    """
    # Create request
    request_response = client.post(
        "/api/v1/resources",
        json={
            "type": "REQUEST",
            "title": "Need help",
            "content_text": "How can I do X?",
            "is_anonymous": False,
        },
        headers=auth_headers,
    )
    request_id = request_response.json()["id"]

    # Add multiple solutions
    for i in range(2):
        client.post(
            "/api/v1/resources",
            json={
                "type": "USE_CASE",
                "title": f"Solution {i}",
                "content_text": f"Here's solution {i}",
                "is_anonymous": False,
                "parent_id": request_id,
            },
            headers=auth_headers,
        )

    # Get solutions
    response = client.get(
        f"/api/v1/resources/{request_id}/solutions",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(item["parent_id"] == request_id for item in data)
