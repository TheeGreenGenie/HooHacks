import secrets
from pathlib import Path
from typing import Any, Dict, List, Union, Annotated

from pydantic import AnyHttpUrl, EmailStr, HttpUrl, field_validator, BeforeValidator
from pydantic_core.core_schema import ValidationInfo
from pydantic_settings import BaseSettings

def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    model_config = {"env_file": str(Path(__file__).parents[5] / "HHP" / ".env"), "extra": "ignore"}

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    TOTP_SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 60 * 30
    REFRESH_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 30
    JWT_ALGO: str = "HS512"
    TOTP_ALGO: str = "SHA-1"
    SERVER_NAME: str = "localhost"
    SERVER_HOST: AnyHttpUrl = "http://localhost:8000"
    SERVER_BOT: str = "Symona"
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000", \
    # "http://localhost:8080", "http://local.dockertoolbox.tiangolo.com"]'
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyHttpUrl] | str, BeforeValidator(parse_cors)
    ] = ["http://localhost:3000", "http://localhost:8000", "http://localhost"]

    PROJECT_NAME: str = "Frontier Finance"
    SENTRY_DSN: HttpUrl | None = None

    @field_validator("SENTRY_DSN", mode="before")
    def sentry_dsn_can_be_blank(cls, v: str) -> str | None:
        if isinstance(v, str) and len(v) == 0:
            return None
        return v

    # GENERAL SETTINGS

    MULTI_MAX: int = 20

    # COMPONENT SETTINGS
    MONGO_DATABASE: str = "app"
    MONGO_DATABASE_URI: str = ""

    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None
    EMAILS_TO_EMAIL: EmailStr | None = None

    @field_validator("EMAILS_FROM_NAME")
    def get_project_name(cls, v: str | None, info: ValidationInfo) -> str:
        if not v:
            return info.data.get("PROJECT_NAME", "Frontier Finance")
        return v

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "/app/app/email-templates/build"
    EMAILS_ENABLED: bool = False

    @field_validator("EMAILS_ENABLED", mode="before")
    def get_emails_enabled(cls, v: bool, info: ValidationInfo) -> bool:
        return bool(info.data.get("SMTP_HOST") and info.data.get("SMTP_PORT") and info.data.get("EMAILS_FROM_EMAIL"))

    EMAIL_TEST_USER: EmailStr = "test@example.com"  # type: ignore
    FIRST_SUPERUSER: EmailStr = "admin@wildwestfinance.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"
    USERS_OPEN_REGISTRATION: bool = True

    # Auth0 (optional — falls back to built-in JWT when not set)
    AUTH0_DOMAIN: str | None = None
    AUTH0_CLIENT_ID: str | None = None
    AUTH0_CLIENT_SECRET: str | None = None
    AUTH0_AUDIENCE: str | None = None

    # Stock search
    ALPHAVANTAGE_API_KEY: str | None = None

    # AI providers (stubbed when missing)
    GEMINI_API_KEY: str | None = None
    OPENROUTER_API_KEY: str | None = None

    # Snowflake — username/password auth (externalbrowser not usable server-side)
    SNOWFLAKE_ACCOUNT: str | None = None   # e.g. VHRTSNV-QIC29014
    SNOWFLAKE_USER: str | None = None      # e.g. THEEGREENGENIE
    SNOWFLAKE_PASSWORD: str | None = None
    SNOWFLAKE_WAREHOUSE: str | None = None
    SNOWFLAKE_DATABASE: str | None = None
    SNOWFLAKE_SCHEMA: str | None = None

    # Voice
    ELEVENLABS_API_KEY: str | None = None

    # OCR (Google Cloud Vision)
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    # Kroger merchant API (developer.kroger.com)
    KROGER_CLIENT_ID: str | None = None
    KROGER_CLIENT_SECRET: str | None = None

    # Payments feature flag + provider keys
    ENABLE_PAYMENTS: bool = False
    STRIPE_SECRET_KEY: str | None = None
    SOLANA_RPC_URL: str | None = None
    SOLANA_PRIVATE_KEY: str | None = None
    WOLFRAM_APP_ID: str | None = None


settings = Settings()
