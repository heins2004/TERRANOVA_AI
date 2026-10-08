import argparse
import getpass
import os
import sys

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings
from app.core.security import hash_password


def create_admin(email: str, allow_dev: bool = False, full_name: str = "Administrator") -> int:
    settings = get_settings()

    # 1. Non-production safety check
    if settings.app_env != "production" and not allow_dev:
        print(
            f"Error: Refusing to create administrator in non-production environment "
            f"('{settings.app_env}') without --allow-dev.",
            file=sys.stderr,
        )
        sys.exit(1)

    # 2. Retrieve password from env var or secure hidden prompt
    password = os.getenv("TERRANOVA_ADMIN_PASSWORD")
    if not password:
        password = getpass.getpass("Enter administrator password: ")

    # 3. Password length validation
    if len(password) < 12:
        print("Error: Administrator password must be at least 12 characters long.", file=sys.stderr)
        sys.exit(1)

    # 4. Connect to database
    with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Check if email exists
            cur.execute("SELECT id FROM users WHERE email = %s;", (email,))
            if cur.fetchone():
                print(f"Error: User with email '{email}' already exists.", file=sys.stderr)
                sys.exit(1)

            # Hash password
            pwd_hash = hash_password(password)

            # Check for is_demo column
            cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users';"
            )
            columns = {row["column_name"] for row in cur.fetchall()}
            if "is_demo" in columns:
                cur.execute(
                    """
                    INSERT INTO users (full_name, email, role, is_active, password_hash, is_demo)
                    VALUES (%s, %s, 'Administrator', true, %s, false)
                    RETURNING id, email, role;
                    """,
                    (full_name, email, pwd_hash),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO users (full_name, email, role, is_active, password_hash)
                    VALUES (%s, %s, 'Administrator', true, %s)
                    RETURNING id, email, role;
                    """,
                    (full_name, email, pwd_hash),
                )

            user_row = cur.fetchone()
            if not user_row:
                print("Error: Failed to insert administrator user.", file=sys.stderr)
                sys.exit(1)
            user_id = user_row["id"]

            # 5. Check if admin_actions table exists and write audit row
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'admin_actions'
                );
                """
            )
            exists_row = cur.fetchone()
            admin_actions_exists = exists_row["exists"] if exists_row else False

            if admin_actions_exists:
                cur.execute(
                    """
                    INSERT INTO admin_actions (admin_id, action, target_user_id, note)
                    VALUES (%s, %s, %s, %s);
                    """,
                    (
                        user_id,
                        "create_admin",
                        user_id,
                        f"Initial administrator {email} created via create_admin CLI",
                    ),
                )

        conn.commit()

    print(f"Administrator successfully created: {email} (id: {user_id}, role: Administrator).")
    return user_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Create the first administrator user.")
    parser.add_argument("--email", required=True, help="Email address of the administrator")
    parser.add_argument(
        "--allow-dev",
        action="store_true",
        default=False,
        help="Allow running in non-production environments (e.g. development)",
    )
    parser.add_argument(
        "--full-name",
        default="Administrator",
        help="Full name of the administrator (default: 'Administrator')",
    )

    args = parser.parse_args()
    create_admin(email=args.email.strip().lower(), allow_dev=args.allow_dev, full_name=args.full_name.strip())


if __name__ == "__main__":
    main()
