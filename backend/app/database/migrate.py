import argparse
import hashlib
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "migrations"

CREATE_SCHEMA_MIGRATIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);
"""


def mask_database_url(url: str) -> str:
    """Mask credentials in database URL for safe logging/printing."""
    try:
        parts = urlsplit(url)
        if parts.password:
            netloc = f"{parts.username or ''}:***@{parts.hostname or ''}"
            if parts.port:
                netloc += f":{parts.port}"
            return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
        return url
    except Exception:
        return "postgresql://***"


def get_migration_database_url() -> str:
    """
    Read connection settings using the app's settings with optional
    environment variable override (MIGRATION_DATABASE_URL or DATABASE_URL).
    """
    override = os.getenv("MIGRATION_DATABASE_URL")
    if override:
        return override
    settings = get_settings()
    return settings.database_url


def compute_checksum(file_path: Path) -> str:
    """Compute SHA-256 checksum of a migration file."""
    content = file_path.read_bytes()
    return hashlib.sha256(content).hexdigest()


def run_migrations(status_only: bool = False, db_url: str | None = None) -> None:
    if db_url is None:
        db_url = get_migration_database_url()

    masked_url = mask_database_url(db_url)
    print(f"Connecting to database: {masked_url}")

    if not MIGRATIONS_DIR.exists():
        print(f"Migrations directory not found: {MIGRATIONS_DIR}")
        sys.exit(1)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        # 1. Ensure schema_migrations table exists
        with conn.cursor() as cur:
            cur.execute(CREATE_SCHEMA_MIGRATIONS_TABLE_SQL)
        conn.commit()

        # 2. Fetch applied migrations
        with conn.cursor() as cur:
            cur.execute("SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version ASC")
            applied_rows = cur.fetchall()

        applied_map = {row["version"]: row for row in applied_rows}

        # 3. Check integrity of already-applied files
        for f in migration_files:
            if f.name in applied_map:
                current_checksum = compute_checksum(f)
                recorded_checksum = applied_map[f.name]["checksum"]
                if current_checksum != recorded_checksum:
                    print(
                        f"ERROR: Migration checksum mismatch for '{f.name}'!\n"
                        f"  Recorded checksum: {recorded_checksum}\n"
                        f"  Current checksum:  {current_checksum}\n"
                        f"Migration file has been altered after application. Aborting."
                    )
                    sys.exit(1)

        # 4. Handle --status
        if status_only:
            print("\nMigration Status:")
            all_versions = sorted(set(list(applied_map.keys()) + [f.name for f in migration_files]))
            if not all_versions:
                print("  No migrations found.")
                return

            for ver in all_versions:
                if ver in applied_map:
                    row = applied_map[ver]
                    print(f"  [APPLIED] {ver} (applied_at: {row['applied_at']}, checksum: {row['checksum'][:8]}...)")
                else:
                    print(f"  [PENDING] {ver}")
            return

        # 5. Apply pending migrations in filename order
        pending = [f for f in migration_files if f.name not in applied_map]
        if not pending:
            print("No pending migrations to apply.")
            return

        for f in pending:
            sql_content = f.read_text(encoding="utf-8")
            checksum = compute_checksum(f)
            try:
                with conn.transaction():
                    with conn.cursor() as cur:
                        if sql_content.strip():
                            cur.execute(sql_content)
                        cur.execute(
                            "INSERT INTO schema_migrations (version, checksum, applied_at) VALUES (%s, %s, now())",
                            (f.name, checksum),
                        )
                print(f"Applied migration: {f.name}")
            except Exception as err:
                print(f"ERROR applying migration '{f.name}': {err}")
                print("Transaction rolled back. Stopping execution.")
                sys.exit(1)

        print("All pending migrations applied successfully.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run SQL database migrations.")
    parser.add_argument(
        "--status",
        action="store_true",
        help="List applied and pending migrations without executing them.",
    )
    args = parser.parse_args()
    run_migrations(status_only=args.status)


if __name__ == "__main__":
    main()
