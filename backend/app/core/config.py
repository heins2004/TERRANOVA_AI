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
    rate_limit_public_max_requests: int
    rate_limit_public_window_seconds: int
    rate_limit_login_max_failures: int
    rate_limit_login_window_seconds: int
    rate_limit_real_ip_header: str | None


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

    # Secure cookie flag: set Secure when DEPLOYED=1 or APP_ENV=production, never in development.
    if app_env == "development" and not deployed:
        session_cookie_secure = False
    else:
        session_cookie_secure = bool(deployed or app_env == "production")

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
        session_cookie_secure=session_cookie_secure,
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "lax"),
        rate_limit_public_max_requests=int(os.getenv("RATE_LIMIT_PUBLIC_MAX_REQUESTS", "120")),
        rate_limit_public_window_seconds=int(os.getenv("RATE_LIMIT_PUBLIC_WINDOW_SECONDS", "60")),
        rate_limit_login_max_failures=int(os.getenv("RATE_LIMIT_LOGIN_MAX_FAILURES", "10")),
        rate_limit_login_window_seconds=int(os.getenv("RATE_LIMIT_LOGIN_WINDOW_SECONDS", "900")),
        rate_limit_real_ip_header=os.getenv("RATE_LIMIT_REAL_IP_HEADER"),
    )
