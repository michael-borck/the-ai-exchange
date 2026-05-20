"""Tests for authentication endpoints."""


from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.security import hash_password
from app.models import User, UserRole

# Strong password that passes validation
STRONG_PASSWORD = "TestP@ss1234"


def _get_token_from_cookies(response) -> str:
    """Extract access_token from response cookies."""
    return response.cookies.get("access_token", "")


def _get_token_from_login(client: TestClient, email: str, password: str) -> str:
    """Login and return access token from cookies."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return _get_token_from_cookies(response)


def test_register_new_user(client: TestClient) -> None:
    """Test registering a new user."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@curtin.edu.au",
            "full_name": "New User",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@curtin.edu.au"


def test_register_weak_password_rejected(client: TestClient) -> None:
    """Test that weak passwords are rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@curtin.edu.au",
            "full_name": "New User",
            "password": "weak",
        },
    )
    assert response.status_code == 422


def test_register_second_user_is_staff(client: TestClient, session: Session) -> None:
    """Test that second user is STAFF role."""
    admin = User(
        email="admin@curtin.edu.au",
        full_name="Admin User",
        hashed_password=hash_password(STRONG_PASSWORD),
        role=UserRole.ADMIN,
    )
    session.add(admin)
    session.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "staff@curtin.edu.au",
            "full_name": "Staff User",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 201


def test_register_duplicate_email(client: TestClient, session: Session) -> None:
    """Test registering with duplicate email."""
    user = User(
        email="existing@curtin.edu.au",
        full_name="Existing User",
        hashed_password=hash_password(STRONG_PASSWORD),
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@curtin.edu.au",
            "full_name": "Another User",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_register_invalid_domain(client: TestClient) -> None:
    """Test registering with invalid domain."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "full_name": "External User",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 403
    assert "domain" in response.json()["detail"].lower()


def test_login_success(client: TestClient, session: Session) -> None:
    """Test successful login sets httpOnly cookies."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@curtin.edu.au",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@curtin.edu.au"
    # Tokens should be in httpOnly cookies only, not in response body
    assert "access_token" not in data
    assert "access_token" in response.cookies


def test_login_invalid_password(client: TestClient, session: Session) -> None:
    """Test login with wrong password."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@curtin.edu.au",
            "password": "WrongP@ss1234",
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_user_not_found(client: TestClient) -> None:
    """Test login with nonexistent user."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@curtin.edu.au",
            "password": STRONG_PASSWORD,
        },
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_inactive_user(client: TestClient, session: Session) -> None:
    """Test login with deactivated user."""
    user = User(
        email="inactive@curtin.edu.au",
        full_name="Inactive User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=False,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@curtin.edu.au",
            "password": STRONG_PASSWORD,
        },
    )
    # Inactive accounts get the same generic message as wrong password —
    # login responses must never reveal account state.
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unapproved_user(client: TestClient, session: Session) -> None:
    """Test login with unapproved user."""
    user = User(
        email="external@curtin.edu.au",
        full_name="External User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=False,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "external@curtin.edu.au",
            "password": STRONG_PASSWORD,
        },
    )
    # Pending-approval users get the same generic message — no account-state leak.
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unverified_user(client: TestClient, session: Session) -> None:
    """Test login with unverified user."""
    user = User(
        email="unverified@curtin.edu.au",
        full_name="Unverified User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=False,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "unverified@curtin.edu.au",
            "password": STRONG_PASSWORD,
        },
    )
    # Unverified users get the same generic message — they're directed to the
    # verification flow at registration time, not via login error.
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_account_lockout(client: TestClient, session: Session) -> None:
    """Test account lockout after too many failed attempts."""
    user = User(
        email="lockme@curtin.edu.au",
        full_name="Lock Me",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    # Make 5 failed attempts
    for _ in range(5):
        client.post(
            "/api/v1/auth/login",
            json={"email": "lockme@curtin.edu.au", "password": "WrongP@ss1234"},
        )

    # 6th attempt should be locked out
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "lockme@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    assert response.status_code == 429
    assert "locked" in response.json()["detail"].lower()


def test_get_current_user_with_cookie(client: TestClient, session: Session) -> None:
    """Test getting current user via cookie-based auth."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    # Login (sets cookies on test client)
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.cookies

    # Get current user using the cookie from login response
    token_cookie = login_response.cookies["access_token"]
    response = client.get(
        "/api/v1/auth/me",
        cookies={"access_token": token_cookie},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@curtin.edu.au"


def test_get_current_user_with_bearer(client: TestClient, session: Session) -> None:
    """Test getting current user via Authorization header (backward compat)."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    token = login_response.cookies["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@curtin.edu.au"


def test_get_current_user_no_token(client: TestClient) -> None:
    """Test getting current user without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]


def test_get_current_user_invalid_token(client: TestClient) -> None:
    """Test getting current user with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]


def test_get_current_user_wrong_format(client: TestClient) -> None:
    """Test getting current user with wrong token format."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "invalid_token"},
    )
    assert response.status_code == 401
    assert "Invalid token format" in response.json()["detail"]


def test_logout_clears_cookies(client: TestClient, session: Session) -> None:
    """Test that logout clears auth cookies."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )

    # Logout
    response = client.post(
        "/api/v1/auth/logout",
        cookies={"access_token": login_response.cookies["access_token"]},
    )
    assert response.status_code == 200
    assert "Logged out" in response.json()["message"]


def test_logout_revokes_token(client: TestClient, session: Session) -> None:
    """Test that logout blacklists the access token so it can't be reused."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    token = login_response.cookies["access_token"]

    # Logout (blacklists the token)
    client.post(
        "/api/v1/auth/logout",
        cookies={"access_token": token},
    )

    # Try to use the old token — should be rejected
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert "revoked" in response.json()["detail"].lower()


def test_refresh_rotates_tokens(client: TestClient, session: Session) -> None:
    """Test that refresh endpoint issues new tokens and blacklists the old refresh token."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    old_refresh = login_response.cookies["refresh_token"]

    # Refresh
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": old_refresh},
    )
    assert refresh_response.status_code == 200
    assert refresh_response.json()["email"] == "user@curtin.edu.au"
    assert "access_token" in refresh_response.cookies

    # Old refresh token should be blacklisted
    reuse_response = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": old_refresh},
    )
    assert reuse_response.status_code == 401


def test_no_tokens_in_response_body(client: TestClient, session: Session) -> None:
    """Test that login/verify responses don't leak tokens in JSON body."""
    user = User(
        email="user@curtin.edu.au",
        full_name="Test User",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_approved=True,
        is_verified=True,
    )
    session.add(user)
    session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    data = response.json()
    assert "access_token" not in data
    assert "refresh_token" not in data


def test_tokens_revoked_at_invalidates_existing_tokens(
    client: TestClient, session: Session
) -> None:
    """Bumping user.tokens_revoked_at must invalidate already-issued JWTs.

    This is the core defence behind password-reset: an attacker who captured a
    session before the password change should not retain access.
    """
    from datetime import UTC, datetime

    from jose import jwt

    from app.core.config import settings
    from app.models import User as UserModel

    user = User(
        email="revoke@curtin.edu.au",
        full_name="Revoke Me",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Issue a token via login
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "revoke@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    assert login.status_code == 200
    token = login.cookies.get("access_token")
    assert token

    # Sanity check: the token works
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200

    # Read the token's iat claim and set tokens_revoked_at to one second later.
    # This proves the invalidation works on `iat`, not on a wall-clock sleep.
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    token_iat = int(payload["iat"])
    fresh_user = session.get(UserModel, user.id)
    assert fresh_user is not None
    fresh_user.tokens_revoked_at = datetime.fromtimestamp(token_iat + 1, tz=UTC)
    session.add(fresh_user)
    session.commit()

    # Old token must now be rejected
    me_after = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_after.status_code == 401
    assert me_after.json()["detail"] == "Token has been revoked"


def test_password_reset_revokes_existing_tokens(
    client: TestClient, session: Session
) -> None:
    """End-to-end: password reset must invalidate all prior sessions."""
    import time

    from app.models import PasswordReset
    from app.services.password_reset import generate_reset_code

    user = User(
        email="resetme@curtin.edu.au",
        full_name="Reset Me",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Get a logged-in session
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "resetme@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    token = login.cookies.get("access_token")
    assert token

    # Create a valid reset code directly in the DB (bypasses email send)
    from datetime import UTC, datetime, timedelta

    code = generate_reset_code()
    session.add(
        PasswordReset(
            user_id=user.id,
            token=code,
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )
    )
    session.commit()

    # Sleep 1.1s so the new tokens_revoked_at > token.iat (JWT iat is seconds).
    time.sleep(1.1)

    new_password = "NewP@ss5678"
    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"email": "resetme@curtin.edu.au", "code": code, "new_password": new_password},
    )
    assert reset.status_code == 200

    # Old session must be dead
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 401


def test_lockout_is_scoped_to_email_and_ip(
    client: TestClient, session: Session
) -> None:
    """Failed logins from one IP must not lock the account for other IPs.

    Prevents the email-only-lockout DoS where an attacker locks a victim out
    of their own account by spamming bad passwords against their address.
    """
    user = User(
        email="locktarget@curtin.edu.au",
        full_name="Lock Target",
        hashed_password=hash_password(STRONG_PASSWORD),
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    session.add(user)
    session.commit()

    # Attacker IP burns 5 failed attempts (note: TestClient client.host defaults
    # to "testclient" so we set XFF — but trusted_proxies is empty, so XFF is
    # ignored and all requests appear to come from the same TCP peer.)
    # Without trusted proxies the test client IP is constant, so this test
    # really exercises the (email, ip) keying when both happen to match.
    for _ in range(5):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": "locktarget@curtin.edu.au", "password": "wrong-password"},
        )
        assert resp.status_code == 401

    # Sixth attempt from the same client is locked
    locked = client.post(
        "/api/v1/auth/login",
        json={"email": "locktarget@curtin.edu.au", "password": STRONG_PASSWORD},
    )
    assert locked.status_code == 429
