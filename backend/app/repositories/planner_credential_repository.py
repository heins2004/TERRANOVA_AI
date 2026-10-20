from typing import Any
from psycopg import Connection


def get_by_user_id(connection: Connection, user_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT user_id, registration_number, body_name, document_path,
                   document_original_name, document_mime, document_size,
                   status, rejection_reason, submitted_at, reviewed_at,
                   reviewed_by, is_backfilled, created_at, updated_at
            FROM planner_credentials
            WHERE user_id = %s
            """,
            (user_id,),
        )
        return cursor.fetchone()


def create_unsubmitted_row(connection: Connection, *, user_id: int) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO planner_credentials (user_id, status, created_at, updated_at)
            VALUES (%s, 'Unsubmitted', NOW(), NOW())
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id,),
        )


def upsert_submission(
    connection: Connection,
    *,
    user_id: int,
    registration_number: str,
    body_name: str | None,
    document_path: str,
    document_original_name: str,
    document_mime: str,
    document_size: int,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO planner_credentials (
                user_id, registration_number, body_name, document_path,
                document_original_name, document_mime, document_size,
                status, rejection_reason, submitted_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending', NULL, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                registration_number = EXCLUDED.registration_number,
                body_name = EXCLUDED.body_name,
                document_path = EXCLUDED.document_path,
                document_original_name = EXCLUDED.document_original_name,
                document_mime = EXCLUDED.document_mime,
                document_size = EXCLUDED.document_size,
                status = 'Pending',
                rejection_reason = NULL,
                submitted_at = NOW(),
                reviewed_at = NULL,
                reviewed_by = NULL,
                updated_at = NOW()
            RETURNING user_id, registration_number, body_name, document_path,
                      document_original_name, document_mime, document_size,
                      status, rejection_reason, submitted_at, reviewed_at,
                      reviewed_by, is_backfilled, created_at, updated_at
            """,
            (
                user_id,
                registration_number,
                body_name,
                document_path,
                document_original_name,
                document_mime,
                document_size,
            ),
        )
        return cursor.fetchone()


def list_for_admin(
    connection: Connection,
    *,
    status_filter: str | None = None,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    where_sql = ""
    params: list[Any] = []
    if status_filter:
        where_sql = "WHERE pc.status = %s"
        params.append(status_filter)

    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT count(*) as total
            FROM planner_credentials pc
            JOIN users u ON u.id = pc.user_id
            {where_sql}
            """,
            params,
        )
        total = cursor.fetchone()["total"]

        cursor.execute(
            f"""
            SELECT pc.user_id, u.full_name, u.email, pc.registration_number, pc.body_name,
                   pc.document_original_name, pc.document_size, pc.status, pc.submitted_at,
                   pc.reviewed_at, pc.rejection_reason
            FROM planner_credentials pc
            JOIN users u ON u.id = pc.user_id
            {where_sql}
            ORDER BY
                CASE WHEN pc.status = 'Pending' THEN 0 ELSE 1 END,
                pc.submitted_at DESC NULLS LAST,
                pc.updated_at DESC
            LIMIT %s OFFSET %s
            """,
            params + [limit, offset],
        )
        rows = cursor.fetchall()
    return rows, total


def verify_credentials(
    connection: Connection,
    *,
    user_id: int,
    admin_id: int,
) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE planner_credentials
            SET status = 'Verified',
                reviewed_at = NOW(),
                reviewed_by = %s,
                rejection_reason = NULL,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING user_id, status, registration_number, reviewed_at, reviewed_by
            """,
            (admin_id, user_id),
        )
        return cursor.fetchone()


def reject_credentials(
    connection: Connection,
    *,
    user_id: int,
    admin_id: int,
    reason: str,
) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE planner_credentials
            SET status = 'Rejected',
                rejection_reason = %s,
                reviewed_at = NOW(),
                reviewed_by = %s,
                updated_at = NOW()
            WHERE user_id = %s
            RETURNING user_id, status, registration_number, rejection_reason, reviewed_at, reviewed_by
            """,
            (reason, admin_id, user_id),
        )
        return cursor.fetchone()
