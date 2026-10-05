import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    database_url: str
    frontend_origins: tuple[str, ...]
    session_cookie_name: str
    session_max_age_seconds: int
    session_cookie_secure: bool
    session_cookie_samesite: str


def _parse_bool(value: str, default: bool) -> bool:
    normalized = value.strip().lower()

    if normalized in {"1", "true", "yes", "on"}:
        return True

    if normalized in {"0", "false", "no", "off"}:
        return False

    return default


def _parse_origins(value: str) -> tuple[str, ...]:
    origins = tuple(origin.strip() for origin in value.split(",") if origin.strip())
    return origins or ("http://localhost:3000",)


@lru_cache
def get_settings() -> Settings:
    deployed = os.getenv("DEPLOYED", "").strip() == "1"
    raw_app_env = os.getenv("APP_ENV")

    if deployed and not raw_app_env:
        raise ValueError(
            "APP_ENV must be explicitly set when DEPLOYED=1. "
            "Allowed values are 'development' and 'production'."
        )

    app_env = (raw_app_env or "development").strip().lower()
    if app_env not in {"development", "production"}:
        raise ValueError(
            f"Invalid APP_ENV '{app_env}'. Allowed values are 'development' and 'production'."
        )

    return Settings(
        app_name="TERRANOVA AI",
        app_env=app_env,
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/terranova_ai",
        ),
        frontend_origins=_parse_origins(
            os.getenv("FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")),
        ),
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME", "terranova_session"),
        session_max_age_seconds=int(os.getenv("SESSION_MAX_AGE_SECONDS", "604800")),
        session_cookie_secure=_parse_bool(os.getenv("SESSION_COOKIE_SECURE", "false"), False),
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "lax"),
    )
