"""Authentication routes for user login and registration."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.core.rate_limiter import (
    LIMIT_FORGOT_PASSWORD,
    LIMIT_LOGIN,
    LIMIT_REGISTER,
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
    EmailVerificationResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ProfessionalRole,
    ResetPasswordRequest,
    ResetPasswordResponse,
    User,
    UserCreate,
    UserRegistrationResponse,
    UserResponse,
    UserRole,
)
from app.services.database import get_session
from app.services.password_reset import (
    create_and_send_password_reset,
    mark_reset_code_used,
    verify_reset_code,
)

router = APIRouter(prefix=f"{settings.api_v1_str}/auth", tags=["auth"])


class TokenResponse(UserResponse):
    """Token response with user info."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Login request payload."""

    email: str
    password: str


def get_current_user(
    authorization: str | None = Header(None),
    session: Session = Depends(get_session),
) -> User:
    """Get current user from JWT token.

    Args:
        authorization: Authorization header with Bearer token
        session: Database session

    Returns:
        Current user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
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
    from app.models import EmailVerification
    from app.services.email_service import send_verification_email
    import secrets
    import string

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

    # Generate 6-digit verification code for all users
    digits = string.digits
    verification_code = "".join(secrets.choice(digits) for _ in range(6))

    # Create EmailVerification record
    verification = EmailVerification(
        user_id=new_user.id,
        code=verification_code,
        expires_at=datetime.now(UTC) + timedelta(minutes=60),
    )
    session.add(verification)
    session.commit()

    # Send verification email
    try:
        send_verification_email(new_user, verification_code)
    except Exception as e:
        # Log error but continue - email may fail in dev environment
        print(f"Warning: Failed to send verification email: {e}")

    return UserRegistrationResponse(
        email=new_user.email,
        message="Registration successful. Please check your email for verification code.",
    )


@router.post("/verify-email", response_model=TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def verify_email(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    verify_request: EmailVerificationRequest,
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

    return TokenResponse(
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
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(LIMIT_LOGIN)
def login(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    login_data: LoginRequest,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """Login user with email and password.

    Args:
        login_data: Login request with email and password
        session: Database session

    Returns:
        Token response with user info

    Raises:
        HTTPException: If credentials invalid or user not verified/approved
    """
    # Find user by email (lowercase for consistency)
    user = session.exec(select(User).where(User.email == login_data.email.lower())).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not verified. Please check your email for verification code.",
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is pending approval by admin",
        )

    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
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
        access_token=access_token,
        refresh_token=refresh_token,
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
        professional_role=current_user.professional_role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_approved=current_user.is_approved,
        disciplines=current_user.disciplines,
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
        area=current_user.area,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_approved=current_user.is_approved,
        disciplines=current_user.disciplines,
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

    if user and user.is_active and user.is_approved:
        # Create and send password reset code
        success, _ = create_and_send_password_reset(session, user)

        if not success:
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

        return ResetPasswordResponse(
            message="Password reset successfully. You can now log in with your new password."
        )

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again.",
        ) from e
