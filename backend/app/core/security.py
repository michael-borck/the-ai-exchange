"""Security utilities for authentication and authorization."""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Optional timedelta for token expiration

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and verify a JWT token.

    Args:
        token: JWT token to decode

    Returns:
        Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
        )
        return payload
    except (JWTError, ValidationError):
        return None


def create_refresh_token(data: dict[str, Any]) -> str:
    """Create a JWT refresh token.

    Args:
        data: Data to encode in the token

    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(
        days=settings.refresh_token_expire_days
    )
    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=ALGORITHM,
    )

    return encoded_jwt
