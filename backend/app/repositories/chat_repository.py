from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row


def get_project_for_chat(connection: Connection, project_id: int) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT p.id, p.title, p.stage, p.city_name, p.created_by, p.planner_id,
                   (SELECT pi.planner_id FROM project_invites pi 
                    WHERE pi.project_id = p.id AND pi.status = 'pending' LIMIT 1) as invited_planner_id
            FROM projects p
            WHERE p.id = %s
            """,
            (project_id,),
        )
        return cur.fetchone()


def get_chat_projects(
    connection: Connection,
    user_id: int,
    q: str | None = None,
) -> list[dict[str, Any]]:
    query = """
        WITH last_messages AS (
            SELECT DISTINCT ON (project_id)
                   project_id, id, sender_id, body, created_at
            FROM chat_messages
            ORDER BY project_id, id DESC
        ),
        unread_counts AS (
            SELECT m.project_id, COUNT(m.id) AS unread
            FROM chat_messages m
            LEFT JOIN chat_reads r ON r.project_id = m.project_id AND r.user_id = %(user_id)s
            WHERE m.sender_id != %(user_id)s
              AND m.id > COALESCE(r.last_read_message_id, 0)
            GROUP BY m.project_id
        )
        SELECT p.id,
               p.title,
               p.stage,
               p.city_name,
               lm.body AS last_message_text,
               lm.created_at AS last_message_time,
               lm.sender_id AS last_message_sender_id,
               u.full_name AS last_message_sender_name,
               u.role AS last_message_sender_role,
               COALESCE(uc.unread, 0)::int AS unread_count,
               (cp.user_id IS NOT NULL) AS is_pinned,
               cp.pinned_at
        FROM projects p
        LEFT JOIN last_messages lm ON lm.project_id = p.id
        LEFT JOIN users u ON u.id = lm.sender_id
        LEFT JOIN unread_counts uc ON uc.project_id = p.id
        LEFT JOIN chat_pins cp ON cp.project_id = p.id AND cp.user_id = %(user_id)s
        WHERE p.planner_id IS NOT NULL
          AND (p.created_by = %(user_id)s OR p.planner_id = %(user_id)s)
    """
    params: dict[str, Any] = {"user_id": user_id}
    if q and q.strip():
        query += " AND p.title ILIKE %(pattern)s"
        params["pattern"] = f"%{q.strip()}%"

    query += """
        ORDER BY (CASE WHEN cp.pinned_at IS NOT NULL THEN 0 ELSE 1 END),
                 cp.pinned_at DESC,
                 COALESCE(lm.created_at, p.created_at) DESC
    """

    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(query, params)
        return cur.fetchall()


def get_messages(
    connection: Connection,
    project_id: int,
    after_id: int | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    with connection.cursor(row_factory=dict_row) as cur:
        if after_id is not None:
            cur.execute(
                """
                SELECT m.id, m.project_id, m.sender_id, u.full_name AS sender_name,
                       u.role AS sender_role, m.body, m.created_at
                FROM chat_messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.project_id = %s AND m.id > %s
                ORDER BY m.id ASC
                LIMIT %s
                """,
                (project_id, after_id, limit),
            )
            return cur.fetchall()
        else:
            cur.execute(
                """
                SELECT id, project_id, sender_id, sender_name, sender_role, body, created_at
                FROM (
                    SELECT m.id, m.project_id, m.sender_id, u.full_name AS sender_name,
                           u.role AS sender_role, m.body, m.created_at
                    FROM chat_messages m
                    JOIN users u ON u.id = m.sender_id
                    WHERE m.project_id = %s
                    ORDER BY m.id DESC
                    LIMIT %s
                ) sub
                ORDER BY id ASC
                """,
                (project_id, limit),
            )
            return cur.fetchall()


def mark_as_read(
    connection: Connection,
    user_id: int,
    project_id: int,
    message_id: int,
) -> None:
    with connection.cursor() as cur:
        cur.execute(
            """
            INSERT INTO chat_reads (user_id, project_id, last_read_message_id, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (user_id, project_id)
            DO UPDATE SET last_read_message_id = GREATEST(chat_reads.last_read_message_id, EXCLUDED.last_read_message_id),
                          updated_at = NOW()
            """,
            (user_id, project_id, message_id),
        )


def create_message(
    connection: Connection,
    project_id: int,
    sender_id: int,
    body: str,
) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO chat_messages (project_id, sender_id, body, created_at)
            VALUES (%s, %s, %s, NOW())
            RETURNING id, project_id, sender_id, body, created_at
            """,
            (project_id, sender_id, body),
        )
        msg = cur.fetchone()
        cur.execute("SELECT full_name, role FROM users WHERE id = %s", (sender_id,))
        user_row = cur.fetchone()
        msg["sender_name"] = user_row["full_name"] if user_row else ""
        msg["sender_role"] = user_row["role"] if user_row else ""
        return msg


def has_unread_chat_notification(
    connection: Connection,
    user_id: int,
    project_id: int,
) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM notifications
            WHERE user_id = %s AND project_id = %s AND kind = 'chat' AND read_at IS NULL
            LIMIT 1
            """,
            (user_id, project_id),
        )
        return cur.fetchone() is not None


def create_chat_notification(
    connection: Connection,
    user_id: int,
    project_id: int,
    message: str,
) -> None:
    with connection.cursor() as cur:
        cur.execute(
            """
            INSERT INTO notifications (user_id, project_id, event_id, kind, message, created_at)
            VALUES (%s, %s, NULL, 'chat', %s, NOW())
            """,
            (user_id, project_id, message),
        )


def get_pin_count(connection: Connection, user_id: int) -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM chat_pins WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        return row[0] if row else 0


def is_pinned(connection: Connection, user_id: int, project_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM chat_pins WHERE user_id = %s AND project_id = %s",
            (user_id, project_id),
        )
        return cur.fetchone() is not None


def pin_project(connection: Connection, user_id: int, project_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute(
            """
            INSERT INTO chat_pins (user_id, project_id, pinned_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (user_id, project_id) DO NOTHING
            """,
            (user_id, project_id),
        )


def unpin_project(connection: Connection, user_id: int, project_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM chat_pins WHERE user_id = %s AND project_id = %s",
            (user_id, project_id),
        )


def get_total_unread_count(connection: Connection, user_id: int) -> int:
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(COUNT(m.id), 0)
            FROM chat_messages m
            JOIN projects p ON p.id = m.project_id
            LEFT JOIN chat_reads r ON r.project_id = m.project_id AND r.user_id = %s
            WHERE p.planner_id IS NOT NULL
              AND (p.created_by = %s OR p.planner_id = %s)
              AND m.sender_id != %s
              AND m.id > COALESCE(r.last_read_message_id, 0)
            """,
            (user_id, user_id, user_id, user_id),
        )
        row = cur.fetchone()
        return int(row[0]) if row else 0
