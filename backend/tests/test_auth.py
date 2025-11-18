"""Tests for authentication endpoints."""

import json
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import hash_password
from app.models import User, UserRole


def test_register_new_user(client: TestClient) -> None:
    """Test registering a new user.

    Args:
        client: Test client
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@curtin.edu.au",
            "full_name": "New User",
            "password": "securepass123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@curtin.edu.au"
    assert data["full_name"] == "New User"
    assert data["role"] == "ADMIN"  # First user is admin
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_second_user_is_staff(client: TestClient, session: Session) -> None:
    """Test that second user is STAFF role.

    Args:
        client: Test client
        session: Database session
    """
    # Create first admin
    admin = User(
        email="admin@curtin.edu.au",
        full_name="Admin User",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
    )
    session.add(admin)
    session.commit()

    # Register second user
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "staff@curtin.edu.au",
            "full_name": "Staff User",
            "password": "staffpass123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "STAFF"  # Second user is staff


def test_register_duplicate_email(client: TestClient, session: Session) -> None:
    """Test registering with duplicate email.

    Args:
        client: Test client
        session: Database session
    """
    # Create existing user
    user = User(
        email="existing@curtin.edu.au",
        full_name="Existing User",
        hashed_password=hash_password("pass123"),
    )
    session.add(user)
    session.commit()

    # Try to register with same email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@curtin.edu.au",
            "full_name": "Another User",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_invalid_domain(client: TestClient) -> None:
    """Test registering with invalid domain.

    Args:
        client: Test client
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "full_name": "External User",
            "password": "password123",
        },
    )
    assert response.status_code == 403
    assert "domain" in response.json()["detail"].lower()


def test_login_success(client: TestClient, session: Session) -> None:
    """Test successful login.

    Args:
        client: Test client
        session: Database session
    """
    # Create user
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password("testpass123"),
        is_active=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@curtin.edu.au",
            "password": "testpass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@curtin.edu.au"
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_invalid_password(client: TestClient, session: Session) -> None:
    """Test login with wrong password.

    Args:
        client: Test client
        session: Database session
    """
    # Create user
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password("correctpass"),
        is_active=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()

    # Try login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@curtin.edu.au",
            "password": "wrongpass",
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_user_not_found(client: TestClient) -> None:
    """Test login with nonexistent user.

    Args:
        client: Test client
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@curtin.edu.au",
            "password": "password123",
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_inactive_user(client: TestClient, session: Session) -> None:
    """Test login with deactivated user.

    Args:
        client: Test client
        session: Database session
    """
    # Create inactive user
    user = User(
        email="inactive@curtin.edu.au",
        full_name="Inactive User",
        hashed_password=hash_password("pass123"),
        is_active=False,
    )
    session.add(user)
    session.commit()

    # Try login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@curtin.edu.au",
            "password": "pass123",
        },
    )
    assert response.status_code == 403
    assert "deactivated" in response.json()["detail"]


def test_login_unapproved_user(client: TestClient, session: Session) -> None:
    """Test login with unapproved user.

    Args:
        client: Test client
        session: Database session
    """
    # Create unapproved user (external domain)
    user = User(
        email="external@example.com",
        full_name="External User",
        hashed_password=hash_password("pass123"),
        is_active=True,
        is_approved=False,
    )
    session.add(user)
    session.commit()

    # Try login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "external@example.com",
            "password": "pass123",
        },
    )
    assert response.status_code == 403
    assert "pending approval" in response.json()["detail"]


def test_get_current_user(client: TestClient, session: Session) -> None:
    """Test getting current user info.

    Args:
        client: Test client
        session: Database session
    """
    # Create and login user
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password("pass123"),
        is_active=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Login to get token
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@curtin.edu.au",
            "password": "pass123",
        },
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@curtin.edu.au"
    assert data["full_name"] == "Test User"


def test_get_current_user_no_token(client: TestClient) -> None:
    """Test getting current user without token.

    Args:
        client: Test client
    """
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Missing authorization header" in response.json()["detail"]


def test_get_current_user_invalid_token(client: TestClient) -> None:
    """Test getting current user with invalid token.

    Args:
        client: Test client
    """
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]


def test_get_current_user_wrong_format(client: TestClient) -> None:
    """Test getting current user with wrong token format.

    Args:
        client: Test client
    """
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "invalid_token"},
    )
    assert response.status_code == 401
    assert "Invalid token format" in response.json()["detail"]
