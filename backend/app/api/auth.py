"""Authentication routes for user login and registration."""

from datetime import timedelta
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
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    User,
    UserCreate,
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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(LIMIT_REGISTER)
def register(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    user_create: UserCreate,
    session: Session = Depends(get_session),
) -> TokenResponse:
    """Register a new user.

    Args:
        user_create: User creation data
        session: Database session

    Returns:
        Token response with user info

    Raises:
        HTTPException: If email already exists or domain not allowed
    """
    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == user_create.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check domain whitelist
    email_domain = user_create.email.split("@")[1]
    is_curtin = email_domain in settings.allowed_domains

    if not is_curtin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {settings.allowed_domains} domain emails are allowed. Contact admin to request access.",
        )

    # Check if this is the first user
    user_count = session.exec(select(User)).all()
    is_first_user = len(user_count) == 0

    # Create new user
    new_user = User(
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=hash_password(user_create.password),
        role=UserRole.ADMIN if is_first_user else UserRole.STAFF,
        is_active=True,
        is_approved=is_curtin,  # Auto-approve if curtin domain
        disciplines=user_create.disciplines or [],
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Create tokens
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})

    return TokenResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active,
        is_approved=new_user.is_approved,
        disciplines=new_user.disciplines,
        notification_prefs=new_user.notification_prefs,
        created_at=new_user.created_at,
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
        HTTPException: If credentials invalid or user not approved
    """
    # Find user by email
    user = session.exec(select(User).where(User.email == login_data.email)).first()

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
        is_active=user.is_active,
        is_approved=user.is_approved,
        disciplines=user.disciplines,
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
        is_active=current_user.is_active,
        is_approved=current_user.is_approved,
        disciplines=current_user.disciplines,
        notification_prefs=current_user.notification_prefs,
        created_at=current_user.created_at,
    )


class UserUpdateRequest(BaseModel):
    """User profile update request."""

    full_name: str | None = None
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
        is_active=current_user.is_active,
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
