from datetime import datetime, timezone
from typing import Any
from psycopg import Connection


def create_notification(
    connection: Connection,
    *,
    user_id: int,
    project_id: int,
    event_id: int | None = None,
    kind: str,
    message: str,
    auto_commit: bool = True,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO notifications (user_id, project_id, event_id, kind, message, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id, user_id, project_id, event_id, kind, message, created_at, read_at
            """,
            (user_id, project_id, event_id, kind, message),
        )
        row = cursor.fetchone()
    if auto_commit:
        connection.commit()
    return row


def create_notifications_batch(
    connection: Connection,
    notifications: list[dict[str, Any]],
    auto_commit: bool = True,
) -> None:
    if not notifications:
        return
    with connection.cursor() as cursor:
        for notif in notifications:
            cursor.execute(
                """
                INSERT INTO notifications (user_id, project_id, event_id, kind, message, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                """,
                (
                    notif["user_id"],
                    notif["project_id"],
                    notif.get("event_id"),
                    notif["kind"],
                    notif["message"],
                ),
            )
    if auto_commit:
        connection.commit()


def get_notifications_for_user(
    connection: Connection,
    *,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, project_id, kind, message, created_at, read_at
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT %s OFFSET %s
            """,
            (user_id, limit, offset),
        )
        rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT COUNT(*) AS unread_count
            FROM notifications
            WHERE user_id = %s AND read_at IS NULL
            """,
            (user_id,),
        )
        count_row = cursor.fetchone()
        unread_count = count_row["unread_count"] if count_row else 0

    return rows, unread_count


def mark_notification_read(
    connection: Connection,
    *,
    notification_id: int,
    user_id: int,
    auto_commit: bool = True,
) -> bool:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE notifications
            SET read_at = COALESCE(read_at, NOW())
            WHERE id = %s AND user_id = %s
            RETURNING id
            """,
            (notification_id, user_id),
        )
        row = cursor.fetchone()
    if auto_commit:
        connection.commit()
    return row is not None


def mark_all_notifications_read(
    connection: Connection,
    *,
    user_id: int,
    auto_commit: bool = True,
) -> int:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE notifications
            SET read_at = NOW()
            WHERE user_id = %s AND read_at IS NULL
            """,
            (user_id,),
        )
        affected = cursor.rowcount
    if auto_commit:
        connection.commit()
    return affected


def get_notification_by_id(
    connection: Connection,
    *,
    notification_id: int,
) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM notifications
            WHERE id = %s
            """,
            (notification_id,),
        )
        return cursor.fetchone()


def get_project_follower_user_ids(
    connection: Connection,
    project_id: int,
) -> list[int]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT user_id
            FROM project_follows
            WHERE project_id = %s
            """,
            (project_id,),
        )
        rows = cursor.fetchall()
        return [r["user_id"] for r in rows]

