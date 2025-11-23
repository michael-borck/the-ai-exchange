"""Application configuration from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # General
    project_name: str = "The AI Exchange - SoMM"
    api_v1_str: str = "/api/v1"
    secret_key: str = "change-me-to-secure-random-string"
    debug: bool = False
    testing: bool = False  # Testing mode (dev only): disables rate limiting, uses mocked services

    # Database - uses absolute path relative to this config file location
    # This ensures the database is created in the backend directory,
    # regardless of where the application is run from
    database_url: str = f"sqlite:///{Path(__file__).parent.parent.parent / 'ai_exchange.db'}"

    # Authentication
    allowed_domains: list[str] = ["curtin.edu.au"]
    email_whitelist: list[str] = []  # Specific emails allowed (comma-separated, overwrites domain check)
    algorithm: str = "HS256"  # JWT algorithm (HS256, HS512, RS256, etc.)
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Email Configuration - Flexible Provider Support
    email_provider: str = "dev"  # Options: dev, gmail, sendgrid, custom, curtin

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

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

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
    rate_limit_reset_password: str = "5/minute"
    rate_limit_read: str = "60/minute"
    rate_limit_write: str = "30/minute"


settings = Settings()
