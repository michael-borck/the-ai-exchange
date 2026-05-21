"""Authentication routes for user login and registration."""

import ipaddress
import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlmodel import Session, select

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.rate_limiter import (
    LIMIT_FORGOT_PASSWORD,
    LIMIT_LOGIN,
    LIMIT_REGISTER,
    LIMIT_RESEND_VERIFICATION,
    LIMIT_RESET_PASSWORD,
    limiter,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import (
    EmailVerificationRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginAttempt,
    ProfessionalRole,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenBlacklist,
    User,
    UserCreate,
    UserRegistrationResponse,
    UserResponse,
    UserRole,
)

# Account lockout settings
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_MINUTES = 15

# Pre-computed hash used to keep login response time constant when the email
# isn't registered. Avoids timing-based account enumeration. Value is the hash
# of an arbitrary string nobody can log in with.
_DUMMY_PASSWORD_HASH = hash_password("not-a-real-password-constant-time-only")
from app.services.audit import audit_log
from app.services.database import get_session
from app.services.password_reset import (
    create_and_send_password_reset,
    mark_reset_code_used,
    verify_reset_code,
)

router = APIRouter(prefix=f"{settings.api_v1_str}/auth", tags=["auth"])


def _is_trusted_proxy(client_ip: str | None) -> bool:
    """True if the immediate connection came from a configured trusted proxy."""
    if client_ip is None or not settings.trusted_proxies:
        return False
    try:
        addr = ipaddress.ip_address(client_ip)
    except ValueError:
        return False
    for entry in settings.trusted_proxies:
        try:
            if "/" in entry:
                if addr in ipaddress.ip_network(entry, strict=False):
                    return True
            elif addr == ipaddress.ip_address(entry):
                return True
        except ValueError:
            continue  # malformed entry, skip
    return False


def _get_client_ip(request: Request) -> str | None:
    """Extract the real client IP.

    Only honors X-Forwarded-For when the immediate caller (request.client.host)
    is a configured trusted proxy. Otherwise an attacker can spoof XFF to
    bypass rate limits / lockouts / audit attribution.
    """
    immediate = request.client.host if request.client else None
    if _is_trusted_proxy(immediate):
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # XFF chain: "client, proxy1, proxy2" — leftmost is the original client
            return forwarded_for.split(",")[0].strip()
    return immediate


def _check_account_lockout(
    session: Session, email: str, ip_address: str | None
) -> None:
    """Raise 429 if too many recent failed logins for this (email, ip) pair.

    Locking by email alone lets an attacker DoS a victim by submitting bad
    passwords against their address. Locking by (email, ip) means a legitimate
    user's normal IP gets locked after 5 fails, but the victim's other devices
    keep working and an attacker can't lock them out from elsewhere.
    """
    if ip_address is None:
        # No client IP (test client, misconfigured proxy) — fall back to email-only
        # to preserve the safety net rather than disabling lockout entirely.
        ip_filter = True  # always-true so the email filter alone applies
    else:
        ip_filter = LoginAttempt.ip_address == ip_address

    cutoff = datetime.now(UTC) - timedelta(minutes=LOCKOUT_WINDOW_MINUTES)
    recent_failures = session.exec(
        select(LoginAttempt).where(
            (LoginAttempt.email == email.lower())
            & ip_filter
            & (LoginAttempt.success == False)  # noqa: E712
            & (LoginAttempt.attempted_at >= cutoff)
        )
    ).all()
    if len(recent_failures) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to too many failed login attempts. Try again in {LOCKOUT_WINDOW_MINUTES} minutes.",
        )


def _record_login_attempt(
    session: Session, email: str, success: bool, ip_address: str | None = None
) -> None:
    """Record a login attempt for lockout tracking."""
    attempt = LoginAttempt(email=email.lower(), success=success, ip_address=ip_address)
    session.add(attempt)
    session.commit()


def _is_token_blacklisted(session: Session, jti: str) -> bool:
    """Check if a token JTI is on the blacklist."""
    entry = session.exec(
        select(TokenBlacklist).where(TokenBlacklist.jti == jti)
    ).first()
    return entry is not None


def _blacklist_token(session: Session, jti: str, user_id: UUID, expires_at: datetime) -> None:
    """Add a token to the blacklist so it cannot be reused."""
    entry = TokenBlacklist(jti=jti, user_id=user_id, expires_at=expires_at)
    session.add(entry)
    session.commit()


def _revoke_all_user_tokens(session: Session, user_id: UUID) -> None:
    """Invalidate every outstanding token for a user by bumping a per-user timestamp.

    `get_current_user` rejects any token whose `iat` claim is older than the
    user's `tokens_revoked_at`. Call this on password reset and any other
    event that should kill existing sessions.
    """
    user = session.get(User, user_id)
    if user is None:
        return
    user.tokens_revoked_at = datetime.now(UTC)
    session.add(user)
    session.commit()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set httpOnly auth cookies on the response."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.refresh_token_expire_days * 86400,
        path=f"{settings.api_v1_str}/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies from the response."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path=f"{settings.api_v1_str}/auth")


class AuthResponse(UserResponse):
    """Auth response — user info only. Tokens are set via httpOnly cookies."""

    pass


# Keep TokenResponse for backward compatibility in tests that check JSON body
class TokenResponse(AuthResponse):
    """Legacy response that includes tokens in body (for backward compat during migration)."""

    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login request payload."""

    email: str
    password: str


class ResendVerificationRequest(BaseModel):
    """Resend verification code request payload."""

    email: str


class ResendVerificationResponse(BaseModel):
    """Resend verification code response."""

    message: str


def get_current_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None),
    session: Session = Depends(get_session),
) -> User:
    """Get current user from JWT token (cookie or Authorization header).

    Checks httpOnly cookie first, then falls back to Authorization header
    for backward compatibility during migration.

    Args:
        authorization: Authorization header with Bearer token
        access_token: httpOnly cookie with JWT token
        session: Database session

    Returns:
        Current user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Prefer cookie-based auth, fall back to Authorization header
    token: str | None = None
    if access_token:
        token = access_token
    elif authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            )
        token = authorization.removeprefix("Bearer ")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Check if token has been revoked (individual blacklist)
    jti = payload.get("jti")
    if jti and _is_token_blacklisted(session, jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        user_id = UUID(user_id)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from e

    user = session.exec(select(User).where(User.id == user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Reject tokens issued before the user's last revocation event (password reset etc).
    # `iat` is added by create_access_token / create_refresh_token in seconds-since-epoch.
    if user.tokens_revoked_at is not None:
        iat_raw = payload.get("iat")
        if iat_raw is None:
            # Pre-iat token issued before this protection existed — reject it.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )
        token_issued = datetime.fromtimestamp(int(iat_raw), tz=UTC)
        # SQLite strips tzinfo on read; treat any naive value as UTC for compare.
        revoked_at = user.tokens_revoked_at
        if revoked_at.tzinfo is None:
            revoked_at = revoked_at.replace(tzinfo=UTC)
        if token_issued < revoked_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not active",
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not approved",
        )

    return user


@router.post("/register", response_model=UserRegistrationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(LIMIT_REGISTER)
def register(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    user_create: UserCreate,
    session: Session = Depends(get_session),
) -> UserRegistrationResponse:
    """Register a new user and send verification email.

    Args:
        user_create: User creation data
        session: Database session

    Returns:
        Registration response with email

    Raises:
        HTTPException: If email already exists or domain not allowed
    """
    import secrets
    import string

    from app.models import EmailVerification
    from app.services.email_service import send_verification_email

    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == user_create.email.lower())
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check access - using email whitelist or domain whitelist (lowercase for consistency)
    email_lower = user_create.email.lower()
    email_domain = email_lower.split("@")[1]

    # Check if email is whitelisted specifically
    is_whitelisted = email_lower in settings.email_whitelist
    # Check if domain is allowed
    is_domain_allowed = email_domain in settings.allowed_domains

    # Access granted if either whitelist or domain matches
    is_approved = is_whitelisted or is_domain_allowed

    if not is_approved:
        whitelisted_str = f" or {settings.email_whitelist}" if settings.email_whitelist else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Allowed domains: {settings.allowed_domains}{whitelisted_str}. Contact admin for access.",
        )

    # Check if this is the first user
    user_count = session.exec(select(User)).all()
    is_first_user = len(user_count) == 0

    # Create new user (store email as lowercase for consistency)
    # Handle multiple professional roles - validate input
    professional_roles = user_create.professional_roles or ["Educator"]
    # Validate roles are from enum
    valid_roles = [ProfessionalRole.EDUCATOR, ProfessionalRole.RESEARCHER, ProfessionalRole.PROFESSIONAL]
    professional_roles = [r for r in professional_roles if r in [v.value for v in valid_roles]]
    if not professional_roles:
        professional_roles = ["Educator"]

    new_user = User(
        email=email_lower,
        full_name=user_create.full_name,
        hashed_password=hash_password(user_create.password),
        role=UserRole.ADMIN if is_first_user else UserRole.STAFF,
        is_active=True,
        is_verified=False,  # All users must verify email
        is_approved=is_approved,  # Auto-approve if whitelisted or from allowed domain
        professional_roles=professional_roles,
        specialties=user_create.specialties or [],
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Audit log
    client_ip = _get_client_ip(request)
    audit_log(session, "user_registered", user_id=new_user.id, ip_address=client_ip)

    # Generate 8-char alphanumeric verification code
    charset = string.ascii_uppercase + string.digits
    verification_code = "".join(secrets.choice(charset) for _ in range(8))

    # Create EmailVerification record
    verification = EmailVerification(
        user_id=new_user.id,
        code=verification_code,
        expires_at=datetime.now(UTC) + timedelta(minutes=60),
    )
    session.add(verification)
    session.commit()

    # Send verification email
    email_sent = False
    try:
        email_sent = send_verification_email(new_user, verification_code)
    except Exception as e:
        logger.error("Failed to send verification email to user_id=%s: %s", new_user.id, e)

    if email_sent:
        return UserRegistrationResponse(
            email=new_user.email,
            message="Registration successful. Please check your email for verification code.",
            email_sent=True,
        )
    else:
        logger.warning("Verification email failed for user_id=%s", new_user.id)
        return UserRegistrationResponse(
            email=new_user.email,
            message="Account created, but we couldn't send the verification email. Please contact an administrator.",
            email_sent=False,
        )


@router.post("/verify-email", response_model=AuthResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def verify_email(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    verify_request: EmailVerificationRequest,
    response: Response,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """Verify email with 6-digit code and return JWT tokens.

    Args:
        verify_request: Email verification request with code
        session: Database session

    Returns:
        Token response with user info

    Raises:
        HTTPException: If email not found, code invalid/expired, or already used
    """
    from app.models import EmailVerification

    # Find user by email (lowercase for consistency)
    user = session.exec(
        select(User).where(User.email == verify_request.email.lower())
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found with this email",
        )

    # Find valid verification code
    verification = session.exec(
        select(EmailVerification).where(
            (EmailVerification.user_id == user.id)
            & (EmailVerification.code == verify_request.code)
        )
    ).first()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    if verification.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has already been used",
        )

    if verification.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired",
        )

    # Mark user as verified
    user.is_verified = True
    session.add(user)

    # Mark verification code as used
    verification.used = True
    session.add(verification)

    session.commit()
    session.refresh(user)

    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Set httpOnly cookies (tokens never returned in response body)
    _set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        professional_roles=user.professional_roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_approved=user.is_approved,
        specialties=user.specialties,
        notification_prefs=user.notification_prefs,
        created_at=user.created_at,
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit(LIMIT_LOGIN)
def login(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    login_data: LoginRequest,
    response: Response,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """Login user with email and password.

    Includes account lockout after repeated failures and audit logging.

    Args:
        login_data: Login request with email and password
        session: Database session

    Returns:
        Token response with user info

    Raises:
        HTTPException: If credentials invalid, user not verified/approved, or account locked
    """
    client_ip = _get_client_ip(request)

    # Check for account lockout before processing
    _check_account_lockout(session, login_data.email, client_ip)

    # Find user by email (lowercase for consistency)
    user = session.exec(select(User).where(User.email == login_data.email.lower())).first()

    # Run password verify even when the user doesn't exist so the response time
    # doesn't reveal whether the email is registered (timing-based enumeration).
    if user is None:
        # Cost-equivalent dummy verify against a known-bad hash so the bcrypt/argon2
        # work is performed regardless. Discard the result.
        verify_password(login_data.password, _DUMMY_PASSWORD_HASH)
        password_ok = False
    else:
        password_ok = verify_password(login_data.password, user.hashed_password)

    # Single generic failure mode for: missing user, wrong password, inactive,
    # unverified, unapproved. Specific guidance lives in the dedicated flows
    # (resend-verification, forgot-password, admin approval) so login doesn't
    # leak account state.
    login_blocked = (
        user is None
        or not password_ok
        or not user.is_active
        or not user.is_verified
        or not user.is_approved
    )
    if login_blocked:
        _record_login_attempt(session, login_data.email, success=False, ip_address=client_ip)
        # Audit log distinguishes the real reason (server-side only, never returned)
        if user is None:
            reason = "no_such_user"
        elif not password_ok:
            reason = "bad_password"
        elif not user.is_active:
            reason = "inactive"
        elif not user.is_verified:
            reason = "unverified"
        else:
            reason = "unapproved"
        audit_log(
            session,
            "login_failed",
            user_id=user.id if user else None,
            detail=f"reason={reason}",
            ip_address=client_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Record successful login
    _record_login_attempt(session, login_data.email, success=True, ip_address=client_ip)
    audit_log(session, "login_success", user_id=user.id, ip_address=client_ip)

    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Set httpOnly cookies (tokens never returned in response body)
    _set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        professional_roles=user.professional_roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_approved=user.is_approved,
        specialties=user.specialties,
        notification_prefs=user.notification_prefs,
        created_at=user.created_at,
    )


@router.post("/logout")
def logout(
    response: Response,
    access_token: str | None = Cookie(None),
    refresh_token: str | None = Cookie(None),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    """Logout user by blacklisting current tokens and clearing cookies."""
    # Blacklist the access token so it can't be reused
    for token_value in (access_token, refresh_token):
        if token_value:
            payload = decode_token(token_value)
            if payload and payload.get("jti"):
                try:
                    user_id = UUID(payload["sub"])
                    expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)
                    _blacklist_token(session, payload["jti"], user_id, expires_at)
                except (ValueError, KeyError):
                    pass  # Malformed token — just clear the cookie

    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=AuthResponse)
def refresh_tokens(
    response: Response,
    refresh_token: str | None = Cookie(None),
    session: Session = Depends(get_session),
) -> AuthResponse:
    """Exchange a refresh token for a new access/refresh token pair.

    The old refresh token is blacklisted (rotation) so it cannot be reused.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Must be a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    # Check blacklist
    old_jti = payload.get("jti")
    if old_jti and _is_token_blacklisted(session, old_jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    try:
        user_id = UUID(user_id_str)
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from e

    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user or not user.is_active or not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Blacklist the old refresh token (rotation)
    if old_jti:
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)
        _blacklist_token(session, old_jti, user_id, expires_at)

    # Issue new token pair
    new_access = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    new_refresh = create_refresh_token(data={"sub": str(user.id)})
    _set_auth_cookies(response, new_access, new_refresh)

    return AuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        professional_roles=user.professional_roles,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_approved=user.is_approved,
        specialties=user.specialties,
        notification_prefs=user.notification_prefs,
        created_at=user.created_at,
    )


def get_current_user_optional(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None),
    session: Session = Depends(get_session),
) -> User | None:
    """Return the current user, or None if there is no valid session.

    Mirrors get_current_user but swallows the 401 cases so callers can
    distinguish "no session" from "valid auth required". Used by
    /auth/session for the SPA bootstrap probe — anonymous visitors should
    not produce a network 401 every time they load the landing page.
    """
    try:
        return get_current_user(
            authorization=authorization,
            access_token=access_token,
            session=session,
        )
    except HTTPException:
        return None


class SessionResponse(BaseModel):
    """Response for /auth/session — null user means anonymous."""

    user: UserResponse | None


@router.get("/session", response_model=SessionResponse)
def get_session_state(
    current_user: User | None = Depends(get_current_user_optional),
) -> SessionResponse:
    """Bootstrap session probe. Always returns 200; user is null if anonymous.

    The SPA calls this on mount to decide whether to render the authed shell
    or the marketing landing. Returning 200 (instead of 401) keeps the browser
    console clean for anonymous visitors.
    """
    if current_user is None:
        return SessionResponse(user=None)
    return SessionResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            role=current_user.role,
            professional_roles=current_user.professional_roles,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            is_approved=current_user.is_approved,
            specialties=current_user.specialties,
            notification_prefs=current_user.notification_prefs,
            created_at=current_user.created_at,
        )
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user.

    Args:
        current_user: Current user from dependency

    Returns:
        Current user info
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        professional_roles=current_user.professional_roles,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_approved=current_user.is_approved,
        specialties=current_user.specialties,
        notification_prefs=current_user.notification_prefs,
        created_at=current_user.created_at,
    )


class UserUpdateRequest(BaseModel):
    """User profile update request."""

    full_name: str | None = None
    professional_roles: list[str] | None = None
    notification_prefs: dict[str, bool] | None = None


@router.patch("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserResponse:
    """Update current user's profile.

    Args:
        user_update: Profile update data
        current_user: Current authenticated user
        session: Database session

    Returns:
        Updated user info
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.professional_roles is not None:
        # Validate roles are from enum
        from app.models import ProfessionalRole
        valid_roles = [ProfessionalRole.EDUCATOR, ProfessionalRole.RESEARCHER, ProfessionalRole.PROFESSIONAL]
        professional_roles = [r for r in user_update.professional_roles if r in [v.value for v in valid_roles]]
        if professional_roles:
            current_user.professional_roles = professional_roles

    if user_update.notification_prefs is not None:
        current_user.notification_prefs = user_update.notification_prefs

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        professional_roles=current_user.professional_roles,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_approved=current_user.is_approved,
        specialties=current_user.specialties,
        notification_prefs=current_user.notification_prefs,
        created_at=current_user.created_at,
    )


# Password reset endpoints


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit(LIMIT_FORGOT_PASSWORD)
def forgot_password(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    forgot_request: ForgotPasswordRequest,
    session: Session = Depends(get_session),
) -> ForgotPasswordResponse:
    """Request a password reset code via email.

    Sends a 6-digit reset code to the user's email address if the account exists.
    Always returns a success message to prevent email enumeration attacks.

    Args:
        forgot_request: Forgot password request with email
        session: Database session

    Returns:
        Success message (generic to prevent email enumeration)

    Raises:
        HTTPException: If email sending fails (rare)
    """
    # Find user by email (but don't reveal if they exist)
    user = session.exec(
        select(User).where(User.email == forgot_request.email.lower())
    ).first()

    if not user:
        logger.warning("Password reset requested for unknown email")
    elif not user.is_active:
        logger.warning("Password reset requested for inactive user_id=%s", user.id)
    elif not user.is_approved:
        logger.warning("Password reset requested for unapproved user_id=%s", user.id)
    else:
        # Create and send password reset code
        logger.info("Sending password reset email to user_id=%s", user.id)
        success, _ = create_and_send_password_reset(session, user)

        if success:
            logger.info("Password reset email sent to user_id=%s", user.id)
        else:
            logger.error("Failed to send password reset email to user_id=%s", user.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset code. Please try again later.",
            )

    # Always return success message (don't reveal if email exists)
    return ForgotPasswordResponse(
        message="If an account with this email exists, a password reset code has been sent to your email."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
@limiter.limit(LIMIT_RESET_PASSWORD)
def reset_password(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    reset_request: ResetPasswordRequest,
    session: Session = Depends(get_session),
) -> ResetPasswordResponse:
    """Reset user password with verification code.

    Args:
        reset_request: Reset password request with email, code, and new password
        session: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If code is invalid, expired, or password reset fails
    """
    # Verify the reset code
    is_valid, user, error_message = verify_reset_code(
        session,
        reset_request.email,
        reset_request.code,
    )

    if not is_valid or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message or "Invalid or expired reset code",
        )

    try:
        # Update password
        user.hashed_password = hash_password(reset_request.new_password)

        # Mark reset code as used
        mark_reset_code_used(session, reset_request.email, reset_request.code)

        session.add(user)
        session.commit()

        # Audit log
        client_ip = _get_client_ip(request)
        audit_log(session, "password_reset", user_id=user.id, ip_address=client_ip)

        # Invalidate all existing sessions for this user
        _revoke_all_user_tokens(session, user.id)

        return ResetPasswordResponse(
            message="Password reset successfully. You can now log in with your new password."
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again.",
        ) from e


@router.post("/resend-verification", response_model=ResendVerificationResponse)
@limiter.limit(LIMIT_RESEND_VERIFICATION)
def resend_verification(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    resend_request: ResendVerificationRequest,
    session: Session = Depends(get_session),
) -> ResendVerificationResponse:
    """Resend email verification code.

    Generates a new 6-digit verification code and sends it to the user's email.
    Always returns a success message to prevent email enumeration attacks.

    Args:
        resend_request: Request with email address
        session: Database session

    Returns:
        Success message (generic to prevent email enumeration)
    """
    import secrets
    import string

    from app.models import EmailVerification
    from app.services.email_service import send_verification_email

    # Find user by email (but don't reveal if they exist)
    user = session.exec(
        select(User).where(User.email == resend_request.email.lower())
    ).first()

    if not user or user.is_verified:
        # Return success anyway to prevent email enumeration
        return ResendVerificationResponse(
            message="If an unverified account with this email exists, a new verification code has been sent. Please check your inbox and Junk/Spam folder."
        )

    # Mark existing unused verification codes as used
    existing_codes = session.exec(
        select(EmailVerification).where(
            (EmailVerification.user_id == user.id)
            & (EmailVerification.used == False)  # noqa: E712
        )
    ).all()

    for code in existing_codes:
        code.used = True
        session.add(code)

    # Generate new 8-char alphanumeric verification code
    charset = string.ascii_uppercase + string.digits
    verification_code = "".join(secrets.choice(charset) for _ in range(8))

    # Create new EmailVerification record
    verification = EmailVerification(
        user_id=user.id,
        code=verification_code,
        expires_at=datetime.now(UTC) + timedelta(minutes=60),
    )
    session.add(verification)
    session.commit()

    # Send verification email
    try:
        send_verification_email(user, verification_code)
    except Exception as e:
        logger.error("Failed to send verification email to user_id=%s: %s", user.id, e)

    return ResendVerificationResponse(
        message="If an unverified account with this email exists, a new verification code has been sent. Please check your inbox and Junk/Spam folder."
    )
