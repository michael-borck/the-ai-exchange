"""Rate limiting configuration for API endpoints."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Create limiter instance using IP address as key
limiter = Limiter(key_func=get_remote_address, enabled=not settings.testing)

# Named rate limit strategies for common operations (from config)
LIMIT_LOGIN = settings.rate_limit_login
LIMIT_REGISTER = settings.rate_limit_register
LIMIT_FORGOT_PASSWORD = settings.rate_limit_forgot_password
LIMIT_RESET_PASSWORD = settings.rate_limit_reset_password
LIMIT_READ = settings.rate_limit_read
LIMIT_WRITE = settings.rate_limit_write


def disable_rate_limiter() -> None:
    """Disable rate limiting (for testing)."""
    limiter.enabled = False


def enable_rate_limiter() -> None:
    """Enable rate limiting."""
    limiter.enabled = True
