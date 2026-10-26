from typing import Any
from psycopg import Connection, Cursor


def get_open_site_change(connection: Connection, project_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM project_site_changes
            WHERE project_id = %s
              AND status IN ('requested', 'proposed', 'approved', 'rejected')
            ORDER BY id DESC
            LIMIT 1
            """,
            (project_id,),
        )
        return cursor.fetchone()


def get_latest_site_change(connection: Connection, project_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM project_site_changes
            WHERE project_id = %s
            ORDER BY id DESC
            LIMIT 1
            """,
            (project_id,),
        )
        return cursor.fetchone()


def get_site_change_by_id(connection: Connection, change_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM project_site_changes
            WHERE id = %s
            """,
            (change_id,),
        )
        return cursor.fetchone()


def create_site_change(
    connection: Connection,
    *,
    project_id: int,
    reason: str,
    city: str | None = None,
    city_name: str | None = None,
    circle_lat: float | None = None,
    circle_lng: float | None = None,
    circle_radius_km: float | None = None,
    created_by: int,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO project_site_changes (
                project_id, status, reason,
                city, city_name,
                circle_lat, circle_lng, circle_radius_km,
                created_by, created_at, updated_at
            )
            VALUES (%s, 'requested', %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING *
            """,
            (project_id, reason, city, city_name, circle_lat, circle_lng, circle_radius_km, created_by),
        )
        return cursor.fetchone()


def update_site_change_propose(
    connection: Connection,
    change_id: int,
    *,
    name: str,
    explanation: str,
    lat: float,
    lng: float,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE project_site_changes
            SET status = 'proposed',
                proposed_site_name = %s,
                proposed_site_explanation = %s,
                proposed_site_lat = %s,
                proposed_site_lng = %s,
                rejection_reason = NULL,
                updated_at = NOW()
            WHERE id = %s
            RETURNING *
            """,
            (name, explanation, lat, lng, change_id),
        )
        return cursor.fetchone()


def update_site_change_status(
    connection: Connection,
    change_id: int,
    *,
    status: str,
    rejection_reason: str | None = None,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE project_site_changes
            SET status = %s,
                rejection_reason = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING *
            """,
            (status, rejection_reason, change_id),
        )
        return cursor.fetchone()


def cancel_open_site_change_on_expire(cursor: Cursor, project_id: int) -> int:
    """Invoked by the deadline scheduler to cancel open site changes without modifying project site."""
    cursor.execute(
        """
        UPDATE project_site_changes
        SET status = 'cancelled', updated_at = NOW()
        WHERE project_id = %s
          AND status IN ('requested', 'proposed', 'approved', 'rejected')
        """,
        (project_id,),
    )
    return cursor.rowcount


def check_point_in_circle(
    connection: Connection,
    *,
    center_lat: float,
    center_lng: float,
    radius_km: float,
    point_lat: float,
    point_lng: float,
) -> tuple[bool, float]:
    radius_meters = radius_km * 1000.0
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT ST_DWithin(
                ST_MakePoint(%s, %s)::geography,
                ST_MakePoint(%s, %s)::geography,
                %s
            ) AS is_within,
            ST_Distance(
                ST_MakePoint(%s, %s)::geography,
                ST_MakePoint(%s, %s)::geography
            ) AS distance_meters
            """,
            (
                center_lng, center_lat,
                point_lng, point_lat,
                radius_meters,
                center_lng, center_lat,
                point_lng, point_lat,
            ),
        )
        row = cursor.fetchone()
        is_within = bool(row["is_within"])
        distance_meters = float(row["distance_meters"])
        return is_within, distance_meters


def get_open_site_change_status(connection: Connection, project_id: int) -> str | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT status
            FROM project_site_changes
            WHERE project_id = %s
              AND status IN ('requested', 'proposed', 'approved', 'rejected')
            ORDER BY id DESC
            LIMIT 1
            """,
            (project_id,),
        )
        row = cursor.fetchone()
        return row["status"] if row else None


def get_open_site_changes_statuses(connection: Connection, project_ids: list[int]) -> dict[int, str]:
    if not project_ids:
        return {}
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT DISTINCT ON (project_id) project_id, status
            FROM project_site_changes
            WHERE project_id = ANY(%s)
              AND status IN ('requested', 'proposed', 'approved', 'rejected')
            ORDER BY project_id, id DESC
            """,
            (project_ids,),
        )
        rows = cursor.fetchall()
        return {r["project_id"]: r["status"] for r in rows}

