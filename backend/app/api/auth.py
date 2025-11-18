"""Authentication routes for user login and registration."""

from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import User, UserCreate, UserResponse
from app.services.database import get_session

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
def register(
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
        role="ADMIN" if is_first_user else "STAFF",
        is_active=True,
        is_approved=is_curtin,  # Auto-approve if curtin domain
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
        notification_prefs=new_user.notification_prefs,
        created_at=new_user.created_at,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
def login(
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
        notification_prefs=current_user.notification_prefs,
        created_at=current_user.created_at,
    )
