"""Admin configuration management endpoints.

Provides read-only view of all settings and ability to update safe settings.
Secrets are write-only (can be set but never displayed).
Automatic timestamped backups are created before modifying .env.
"""

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.core.config import settings
from app.models import User, UserRole

router = APIRouter(prefix="/api/v1/admin/config", tags=["admin-config"])


def _create_env_backup(env_file: Path) -> Path | None:
    """Create a timestamped backup of the .env file before modifications.

    Args:
        env_file: Path to the .env file

    Returns:
        Path to the backup file, or None if backup creation failed
    """
    if not env_file.exists():
        return None

    try:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        backup_file = env_file.parent / f".env.backup_{timestamp}"

        with open(env_file) as src:
            content = src.read()

        with open(backup_file, "w") as dst:
            dst.write(content)

        return backup_file
    except Exception as e:
        print(f"Warning: Failed to create .env backup: {e}")
        return None


# ============================================================================
# Read-Only Settings (Safe to display)
# ============================================================================
class SafeSettingInfo(BaseModel):
    """Information about a safe, displayable setting."""

    name: str
    value: Any
    description: str
    editable: bool = False
    category: str


class ConfigSnapshot(BaseModel):
    """Current configuration snapshot (safe values only)."""

    general: dict[str, SafeSettingInfo]
    authentication: dict[str, SafeSettingInfo]
    email: dict[str, SafeSettingInfo]
    rate_limiting: dict[str, SafeSettingInfo]
    cors: dict[str, SafeSettingInfo]


# ============================================================================
# Editable Settings (Safe to modify)
# ============================================================================
class EditableConfig(BaseModel):
    """Configuration values that can be safely edited."""

    allowed_domains: list[str] | None = None
    email_whitelist: list[str] | None = None
    rate_limit_login: str | None = None
    rate_limit_register: str | None = None
    rate_limit_forgot_password: str | None = None
    rate_limit_reset_password: str | None = None
    rate_limit_read: str | None = None
    rate_limit_write: str | None = None
    access_token_expire_minutes: int | None = None
    refresh_token_expire_days: int | None = None
    allowed_origins: list[str] | None = None
    email_provider: str | None = None
    log_level: str | None = None
    debug: bool | None = None
    testing: bool | None = None


# ============================================================================
# Secrets (Write-only)
# ============================================================================
class SecretUpdate(BaseModel):
    """Update a secret value (write-only, never displayed)."""

    secret_name: str  # e.g., "secret_key", "smtp_password", "sendgrid_api_key"
    value: str


class SecretStatus(BaseModel):
    """Status of a secret (configured or not)."""

    name: str
    configured: bool  # True if set in .env, False if using default
    description: str


# ============================================================================
# Endpoints
# ============================================================================


def _require_admin(user: User = Depends(get_current_user)) -> User:
    """Verify user is an admin."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


@router.get("/snapshot", response_model=ConfigSnapshot)
def get_config_snapshot(admin: User = Depends(_require_admin)) -> ConfigSnapshot:
    """Get current configuration (safe values only, no secrets).

    Returns:
        ConfigSnapshot with categorised settings
    """
    return ConfigSnapshot(
        general={
            "project_name": SafeSettingInfo(
                name="project_name",
                value=settings.project_name,
                description="Application name",
                category="general",
            ),
            "api_v1_str": SafeSettingInfo(
                name="api_v1_str",
                value=settings.api_v1_str,
                description="API version prefix",
                category="general",
            ),
            "debug": SafeSettingInfo(
                name="debug",
                value=settings.debug,
                description="Debug mode (development only)",
                editable=True,
                category="general",
            ),
            "testing": SafeSettingInfo(
                name="testing",
                value=settings.testing,
                description="Testing mode (disables rate limiting)",
                editable=True,
                category="general",
            ),
        },
        authentication={
            "algorithm": SafeSettingInfo(
                name="algorithm",
                value=settings.algorithm,
                description="JWT signing algorithm",
                category="authentication",
            ),
            "access_token_expire_minutes": SafeSettingInfo(
                name="access_token_expire_minutes",
                value=settings.access_token_expire_minutes,
                description="Access token expiration (minutes)",
                editable=True,
                category="authentication",
            ),
            "refresh_token_expire_days": SafeSettingInfo(
                name="refresh_token_expire_days",
                value=settings.refresh_token_expire_days,
                description="Refresh token expiration (days)",
                editable=True,
                category="authentication",
            ),
            "allowed_domains": SafeSettingInfo(
                name="allowed_domains",
                value=settings.allowed_domains,
                description="Email domains allowed to register",
                editable=True,
                category="authentication",
            ),
            "email_whitelist": SafeSettingInfo(
                name="email_whitelist",
                value=settings.email_whitelist,
                description="Specific emails allowed to register",
                editable=True,
                category="authentication",
            ),
        },
        email={
            "email_provider": SafeSettingInfo(
                name="email_provider",
                value=settings.email_provider,
                description="Email provider (dev, gmail, sendgrid, custom, curtin)",
                editable=True,
                category="email",
            ),
            "mail_from": SafeSettingInfo(
                name="mail_from",
                value=settings.mail_from,
                description="From email address",
                category="email",
            ),
            "mail_from_name": SafeSettingInfo(
                name="mail_from_name",
                value=settings.mail_from_name,
                description="From email display name",
                category="email",
            ),
            "smtp_server": SafeSettingInfo(
                name="smtp_server",
                value=settings.smtp_server,
                description="SMTP server address",
                category="email",
            ),
            "smtp_port": SafeSettingInfo(
                name="smtp_port",
                value=settings.smtp_port,
                description="SMTP server port",
                category="email",
            ),
        },
        rate_limiting={
            "rate_limit_login": SafeSettingInfo(
                name="rate_limit_login",
                value=settings.rate_limit_login,
                description="Login attempt rate limit",
                editable=True,
                category="rate_limiting",
            ),
            "rate_limit_register": SafeSettingInfo(
                name="rate_limit_register",
                value=settings.rate_limit_register,
                description="Registration rate limit",
                editable=True,
                category="rate_limiting",
            ),
            "rate_limit_forgot_password": SafeSettingInfo(
                name="rate_limit_forgot_password",
                value=settings.rate_limit_forgot_password,
                description="Password reset request rate limit",
                editable=True,
                category="rate_limiting",
            ),
            "rate_limit_reset_password": SafeSettingInfo(
                name="rate_limit_reset_password",
                value=settings.rate_limit_reset_password,
                description="Password reset submission rate limit",
                editable=True,
                category="rate_limiting",
            ),
            "rate_limit_read": SafeSettingInfo(
                name="rate_limit_read",
                value=settings.rate_limit_read,
                description="Read operation rate limit",
                editable=True,
                category="rate_limiting",
            ),
            "rate_limit_write": SafeSettingInfo(
                name="rate_limit_write",
                value=settings.rate_limit_write,
                description="Write operation rate limit",
                editable=True,
                category="rate_limiting",
            ),
        },
        cors={
            "allowed_origins": SafeSettingInfo(
                name="allowed_origins",
                value=settings.allowed_origins,
                description="CORS allowed origins",
                editable=True,
                category="cors",
            ),
        },
    )


@router.get("/secrets/status", response_model=list[SecretStatus])
def get_secrets_status(admin: User = Depends(_require_admin)) -> list[SecretStatus]:
    """Get status of all secrets (configured or not, never show value).

    Returns:
        List of SecretStatus objects showing which secrets are configured
    """
    # Read .env file to check which secrets are actually set
    env_file = Path(__file__).parent.parent.parent / ".env"
    configured_secrets = set()

    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    for secret in [
                        "SECRET_KEY",
                        "SMTP_PASSWORD",
                        "GMAIL_APP_PASSWORD",
                        "SENDGRID_API_KEY",
                    ]:
                        if line.startswith(f"{secret}="):
                            configured_secrets.add(secret)

    return [
        SecretStatus(
            name="SECRET_KEY",
            configured="SECRET_KEY" in configured_secrets,
            description="JWT signing key (critical for production)",
        ),
        SecretStatus(
            name="SMTP_PASSWORD",
            configured="SMTP_PASSWORD" in configured_secrets,
            description="SMTP server password (for custom/curtin email provider)",
        ),
        SecretStatus(
            name="GMAIL_APP_PASSWORD",
            configured="GMAIL_APP_PASSWORD" in configured_secrets,
            description="Gmail app-specific password (for Gmail email provider)",
        ),
        SecretStatus(
            name="SENDGRID_API_KEY",
            configured="SENDGRID_API_KEY" in configured_secrets,
            description="SendGrid API key (for SendGrid email provider)",
        ),
    ]


@router.post("/update")
def update_config(
    config: EditableConfig, admin: User = Depends(_require_admin)
) -> dict[str, str | list[str]]:
    """Update editable configuration values.

    Creates a timestamped backup before writing to .env file.

    Args:
        config: Configuration values to update (None values are skipped)
        admin: Authenticated admin user

    Returns:
        Confirmation message, which values were updated, and backup file path
    """
    env_file = Path(__file__).parent.parent.parent / ".env"

    # Create backup before making changes
    backup_file = _create_env_backup(env_file)

    # Read current .env
    env_content = ""
    if env_file.exists():
        with open(env_file) as f:
            env_content = f.read()

    # Build updates to apply
    updates = {}
    if config.allowed_domains is not None:
        updates["ALLOWED_DOMAINS"] = ",".join(config.allowed_domains)
    if config.email_whitelist is not None:
        updates["EMAIL_WHITELIST"] = ",".join(config.email_whitelist)
    if config.rate_limit_login is not None:
        updates["RATE_LIMIT_LOGIN"] = f'"{config.rate_limit_login}"'
    if config.rate_limit_register is not None:
        updates["RATE_LIMIT_REGISTER"] = f'"{config.rate_limit_register}"'
    if config.rate_limit_forgot_password is not None:
        updates["RATE_LIMIT_FORGOT_PASSWORD"] = (
            f'"{config.rate_limit_forgot_password}"'
        )
    if config.rate_limit_reset_password is not None:
        updates["RATE_LIMIT_RESET_PASSWORD"] = f'"{config.rate_limit_reset_password}"'
    if config.rate_limit_read is not None:
        updates["RATE_LIMIT_READ"] = f'"{config.rate_limit_read}"'
    if config.rate_limit_write is not None:
        updates["RATE_LIMIT_WRITE"] = f'"{config.rate_limit_write}"'
    if config.access_token_expire_minutes is not None:
        updates["ACCESS_TOKEN_EXPIRE_MINUTES"] = str(
            config.access_token_expire_minutes
        )
    if config.refresh_token_expire_days is not None:
        updates["REFRESH_TOKEN_EXPIRE_DAYS"] = str(config.refresh_token_expire_days)
    if config.allowed_origins is not None:
        updates["ALLOWED_ORIGINS"] = ",".join(config.allowed_origins)
    if config.email_provider is not None:
        updates["EMAIL_PROVIDER"] = f'"{config.email_provider}"'
    if config.log_level is not None:
        updates["LOG_LEVEL"] = f'"{config.log_level}"'
    if config.debug is not None:
        updates["DEBUG"] = "true" if config.debug else "false"
    if config.testing is not None:
        updates["TESTING"] = "true" if config.testing else "false"

    # Update or add settings in env_content
    lines = env_content.split("\n")
    updated_keys = set()

    for i, line in enumerate(lines):
        for key, value in updates.items():
            if line.startswith(f"{key}="):
                lines[i] = f'{key}={value}'
                updated_keys.add(key)
                break

    # Add any new settings that weren't found
    for key, value in updates.items():
        if key not in updated_keys:
            lines.append(f"{key}={value}")

    # Write back to .env
    with open(env_file, "w") as f:
        f.write("\n".join(lines))

    response = {
        "status": "success",
        "message": f"Updated {len(updates)} configuration settings",
        "note": "Server restart may be required for some settings to take effect",
        "updated": list(updates.keys()),
    }

    # Include backup file path if backup was created
    if backup_file:
        response["backup_file"] = str(backup_file)
        response["backup_note"] = f"Backup created at: {backup_file.name}"

    return response


@router.post("/secrets/update")
def update_secret(
    update: SecretUpdate, admin: User = Depends(_require_admin)
) -> dict[str, str]:
    """Update a secret value (write-only, never displayed).

    Creates a timestamped backup before writing to .env file.

    Args:
        update: Secret name and value
        admin: Authenticated admin user

    Returns:
        Confirmation message and backup file path

    Raises:
        HTTPException: If secret name is invalid
    """
    valid_secrets = {
        "secret_key": "SECRET_KEY",
        "smtp_password": "SMTP_PASSWORD",
        "gmail_app_password": "GMAIL_APP_PASSWORD",
        "sendgrid_api_key": "SENDGRID_API_KEY",
    }

    secret_name_lower = update.secret_name.lower()
    if secret_name_lower not in valid_secrets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid secret name. Allowed: {list(valid_secrets.keys())}",
        )

    env_key = valid_secrets[secret_name_lower]
    env_file = Path(__file__).parent.parent.parent / ".env"

    # Create backup before making changes
    backup_file = _create_env_backup(env_file)

    # Read current .env
    env_content = ""
    if env_file.exists():
        with open(env_file) as f:
            env_content = f.read()

    # Update or add secret
    lines = env_content.split("\n")
    found = False

    for i, line in enumerate(lines):
        if line.startswith(f"{env_key}="):
            lines[i] = f'{env_key}="{update.value}"'
            found = True
            break

    if not found:
        lines.append(f'{env_key}="{update.value}"')

    # Write back
    with open(env_file, "w") as f:
        f.write("\n".join(lines))

    response = {
        "status": "success",
        "message": f"Secret '{secret_name_lower}' has been saved to .env",
        "note": "Secret value is write-only and will never be displayed",
    }

    # Include backup file path if backup was created
    if backup_file:
        response["backup_file"] = str(backup_file)
        response["backup_note"] = f"Backup created at: {backup_file.name}"

    return response
