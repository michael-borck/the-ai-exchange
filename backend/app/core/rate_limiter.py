"""Rate limiting configuration for API endpoints."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance using IP address as key
limiter = Limiter(key_func=get_remote_address)

# Named rate limit strategies for common operations
LIMIT_LOGIN = "5/minute"
LIMIT_REGISTER = "3/minute"
LIMIT_FORGOT_PASSWORD = "3/minute"
LIMIT_RESET_PASSWORD = "5/minute"
LIMIT_READ = "60/minute"
LIMIT_WRITE = "30/minute"


def disable_rate_limiter() -> None:
    """Disable rate limiting (for testing)."""
    limiter.enabled = False


def enable_rate_limiter() -> None:
    """Enable rate limiting."""
    limiter.enabled = True
