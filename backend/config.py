import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))


@dataclass(frozen=True)
class Settings:
    app_name: str
    database_url: str
    frontend_origin: str


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name="TERRANOVA AI",
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/terranova_ai",
        ),
        frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
    )
