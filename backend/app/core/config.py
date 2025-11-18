"""Application configuration from environment variables."""


from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # General
    project_name: str = "The AI Exchange - SoMM"
    api_v1_str: str = "/api/v1"
    secret_key: str = "change-me-to-secure-random-string"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./ai_exchange.db"

    # Authentication
    allowed_domains: list[str] = ["curtin.edu.au"]
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Email (mocked for MVP)
    smtp_server: str = "smtp.curtin.edu.au"
    smtp_port: int = 587
    smtp_user: str = "noreply@curtin.edu.au"
    smtp_password: str = ""
    mail_from: str = "noreply@curtin.edu.au"

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


settings = Settings()
