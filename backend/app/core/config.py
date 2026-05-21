"""Application configuration from environment variables."""

import json
import secrets
import warnings
from pathlib import Path
from typing import Annotated, Any, Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings.sources import NoDecode


def _parse_list_field(v: Any) -> Any:
    """Accept either a JSON array or a comma-separated string for list[str] env vars.

    pydantic-settings v2 defaults to JSON parsing for `list[str]` fields, which
    means `FOO="a,b,c"` in a .env file blows up with JSONDecodeError. This
    validator normalises both forms so the .env file can stay in the more
    readable comma-separated style that .env.example documents.
    """
    if v is None or isinstance(v, list):
        return v
    if isinstance(v, str):
        stripped = v.strip()
        if not stripped:
            return []
        if stripped.startswith("["):
            # Looks like JSON — try that first, fall through to comma-split on failure.
            try:
                return json.loads(stripped)
            except json.JSONDecodeError:
                pass
        return [item.strip() for item in stripped.split(",") if item.strip()]
    return v


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @field_validator(
        "allowed_domains",
        "email_whitelist",
        "allowed_hosts",
        "allowed_origins",
        "trusted_proxies",
        mode="before",
    )
    @classmethod
    def _split_csv_lists(cls, v: Any) -> Any:
        return _parse_list_field(v)

    # General
    project_name: str = "The AI Exchange - SoMM"
    api_v1_str: str = "/api/v1"
    secret_key: str = "change-me-to-secure-random-string"
    debug: bool = False

    # Cookie settings
    cookie_domain: str | None = None  # None = current domain
    cookie_secure: bool = True  # Must be False for local dev over HTTP
    # Literal type validates the env value (rejects typos) and satisfies
    # Response.set_cookie's samesite parameter type.
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    @model_validator(mode="after")
    def validate_settings(self) -> "Settings":
        """Validate critical settings at startup."""
        # Reject default SECRET_KEY in production; auto-generate in debug
        insecure_keys = {"change-me-to-secure-random-string", ""}
        if self.secret_key in insecure_keys:
            if self.debug:
                self.secret_key = secrets.token_urlsafe(32)
                warnings.warn(
                    "SECRET_KEY is using default value. "
                    "Generated random key for this session. "
                    "Set SECRET_KEY in .env for production.",
                    stacklevel=2,
                )
            else:
                raise ValueError(
                    "SECRET_KEY must be set to a secure random value in production. "
                    'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
                )
        # Auto-disable secure cookies in debug mode (HTTP)
        if self.debug:
            self.cookie_secure = False
        return self
    testing: bool = False  # Testing mode (dev only): disables rate limiting, uses mocked services

    # Database - uses absolute path relative to this config file location
    # This ensures the database is created in the backend directory,
    # regardless of where the application is run from
    database_url: str = f"sqlite:///{Path(__file__).parent.parent.parent / 'ai_exchange.db'}"

    # Authentication
    # The Annotated[..., NoDecode] disables pydantic-settings' default JSON
    # decoding for these list fields so the field validator above can accept
    # the comma-separated format documented in .env.example.
    allowed_domains: Annotated[list[str], NoDecode] = ["curtin.edu.au"]
    email_whitelist: Annotated[list[str], NoDecode] = []
    algorithm: str = "HS256"  # JWT algorithm (HS256, HS512, RS256, etc.)
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Email Configuration - Flexible Provider Support
    email_provider: str = "dev"  # Options: dev, gmail, sendgrid, custom, curtin

    # Where in-app feedback submissions get sent
    feedback_recipient: str = "michael.borck@curtin.edu.au"

    # Common SMTP Settings (for custom and curtin providers)
    smtp_server: str = "smtp.curtin.edu.au"
    smtp_port: int = 587
    smtp_user: str = "noreply@curtin.edu.au"
    smtp_password: str = ""
    mail_from: str = "noreply@curtin.edu.au"
    mail_from_name: str = "The AI Exchange"

    # Gmail Configuration
    gmail_app_password: str | None = None

    # SendGrid Configuration
    sendgrid_api_key: str | None = None

    # Email Settings
    use_tls: bool = True
    use_ssl: bool = False
    validate_certs: bool = True

    # Trusted Hosts
    allowed_hosts: Annotated[list[str], NoDecode] = [
        "localhost",
        "127.0.0.1",
        "testserver",
        "theaiexchange.eduserver.au",
    ]

    # CORS
    allowed_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Trusted proxies — IPs or CIDR ranges allowed to set X-Forwarded-For.
    # Empty means: don't trust XFF from anyone, use request.client.host directly.
    # For a Docker-behind-Caddy/nginx setup, include the proxy's network, e.g.
    # "127.0.0.1,172.16.0.0/12" for loopback + the default Docker bridge range.
    trusted_proxies: Annotated[list[str], NoDecode] = []

    # LLM Configuration (optional)
    llm_provider: str | None = None  # openai, claude, gemini, openrouter, ollama
    llm_api_key: str | None = None
    llm_model: str | None = None
    llm_base_url: str | None = None  # For Ollama self-hosted

    # Logging
    log_level: str = "INFO"

    # Rate Limiting
    rate_limit_login: str = "5/minute"
    rate_limit_register: str = "3/minute"
    rate_limit_forgot_password: str = "3/minute"
    rate_limit_resend_verification: str = "3/minute"
    rate_limit_reset_password: str = "5/minute"
    rate_limit_read: str = "60/minute"
    rate_limit_write: str = "30/minute"


settings = Settings()
