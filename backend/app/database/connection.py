from collections.abc import Generator

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings


def get_connection() -> psycopg.Connection:
    settings = get_settings()
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def get_db() -> Generator[psycopg.Connection, None, None]:
    with get_connection() as connection:
        yield connection
