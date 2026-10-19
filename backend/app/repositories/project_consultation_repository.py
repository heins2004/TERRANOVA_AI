from datetime import datetime, timezone
from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row


def create_consultation(
    connection: Connection,
    *,
    project_id: int,
    title: str,
    description: str,
    starts_at: datetime,
    duration_minutes: int,
    type: str,
    meeting_url: str | None,
    venue_address: str | None,
    city: str,
    max_attendees: int | None,
    visibility: str,
    created_by: int,
    venue_lat: float | None = None,
    venue_lng: float | None = None,
) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO project_consultations (
                project_id, title, description, starts_at, duration_minutes,
                type, meeting_url, venue_address, city, max_attendees,
                visibility, status, created_by, venue_lat, venue_lng, created_at, updated_at
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, 'Scheduled', %s, %s, %s, now(), now()
            )
            RETURNING *;
            """,
            (
                project_id, title, description, starts_at, duration_minutes,
                type, meeting_url, venue_address, city, max_attendees,
                visibility, created_by, venue_lat, venue_lng
            ),
        )
        return cur.fetchone()


def get_consultation_by_id(connection: Connection, consultation_id: int) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT * FROM project_consultations WHERE id = %s;",
            (consultation_id,),
        )
        return cur.fetchone()


def update_consultation_fields(
    connection: Connection,
    consultation_id: int,
    updates: dict[str, Any],
) -> dict[str, Any]:
    if not updates:
        return get_consultation_by_id(connection, consultation_id)

    set_clauses = []
    params = []
    for k, v in updates.items():
        set_clauses.append(f"{k} = %s")
        params.append(v)
    set_clauses.append("updated_at = now()")
    params.append(consultation_id)

    sql = f"""
        UPDATE project_consultations
        SET {', '.join(set_clauses)}
        WHERE id = %s
        RETURNING *;
    """
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(sql, params)
        return cur.fetchone()


def cancel_consultation(
    connection: Connection,
    consultation_id: int,
    reason: str,
) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE project_consultations
            SET status = 'Cancelled', cancel_reason = %s, updated_at = now()
            WHERE id = %s
            RETURNING *;
            """,
            (reason, consultation_id),
        )
        return cur.fetchone()


def get_active_citizens_by_emails(
    connection: Connection,
    emails: list[str],
) -> dict[str, int]:
    if not emails:
        return {}
    clean_emails = [e.strip().lower() for e in emails]
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, LOWER(email) AS email
            FROM users
            WHERE role = 'Citizen' AND is_active = true AND LOWER(email) = ANY(%s);
            """,
            (clean_emails,),
        )
        rows = cur.fetchall()
        return {r["email"]: r["id"] for r in rows}


def set_consultation_invites(
    connection: Connection,
    consultation_id: int,
    user_ids: list[int],
) -> None:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM project_consultation_invites WHERE consultation_id = %s;",
            (consultation_id,),
        )
        if user_ids:
            for uid in user_ids:
                cur.execute(
                    """
                    INSERT INTO project_consultation_invites (consultation_id, user_id, invited_at)
                    VALUES (%s, %s, now())
                    ON CONFLICT DO NOTHING;
                    """,
                    (consultation_id, uid),
                )


def get_consultation_invite_emails(
    connection: Connection,
    consultation_id: int,
) -> list[str]:
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT u.email
            FROM project_consultation_invites pci
            JOIN users u ON u.id = pci.user_id
            WHERE pci.consultation_id = %s
            ORDER BY u.email ASC;
            """,
            (consultation_id,),
        )
        return [r["email"] if isinstance(r, dict) else r[0] for r in cur.fetchall()]


def get_consultation_invite_user_ids(
    connection: Connection,
    consultation_id: int,
) -> list[int]:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT user_id FROM project_consultation_invites WHERE consultation_id = %s;",
            (consultation_id,),
        )
        return [r["user_id"] if isinstance(r, dict) else r[0] for r in cur.fetchall()]


def get_consultation_invite_count(
    connection: Connection,
    consultation_id: int,
) -> int:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT count(*) FROM project_consultation_invites WHERE consultation_id = %s;",
            (consultation_id,),
        )
        row = cur.fetchone()
        if not row:
            return 0
        return row["count"] if isinstance(row, dict) else row[0]


def is_user_invited_to_consultation(
    connection: Connection,
    consultation_id: int,
    user_id: int,
) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM project_consultation_invites WHERE consultation_id = %s AND user_id = %s LIMIT 1;",
            (consultation_id, user_id),
        )
        return cur.fetchone() is not None


def list_project_consultations_all(
    connection: Connection,
    project_id: int,
) -> list[dict[str, Any]]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT * FROM project_consultations
            WHERE project_id = %s
            ORDER BY starts_at ASC;
            """,
            (project_id,),
        )
        return cur.fetchall()


def list_project_consultations_for_citizen(
    connection: Connection,
    project_id: int,
    user_id: int,
) -> list[dict[str, Any]]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT pc.*
            FROM project_consultations pc
            LEFT JOIN project_consultation_invites pci
                ON pci.consultation_id = pc.id AND pci.user_id = %s
            WHERE pc.project_id = %s
              AND (pc.visibility = 'Public' OR pci.user_id IS NOT NULL)
            ORDER BY pc.starts_at ASC;
            """,
            (user_id, project_id),
        )
        return cur.fetchall()


def list_project_consultations_public_only(
    connection: Connection,
    project_id: int,
) -> list[dict[str, Any]]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT * FROM project_consultations
            WHERE project_id = %s AND visibility = 'Public'
            ORDER BY starts_at ASC;
            """,
            (project_id,),
        )
        return cur.fetchall()
