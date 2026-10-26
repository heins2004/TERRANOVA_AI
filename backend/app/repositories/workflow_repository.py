from datetime import datetime
from typing import Any
from psycopg import Connection


def search_planners(connection: Connection, *, q: str, limit: int = 10) -> list[dict[str, Any]]:
    clean_q = q.strip()
    pattern = f"%{clean_q}%"
    with connection.cursor() as cursor:
        if clean_q.isdigit():
            cursor.execute(
                """
                SELECT u.id, u.full_name, u.city
                FROM users u
                WHERE u.role = 'Urban Planner'
                  AND u.is_active = true
                  AND u.is_demo = false
                  AND (u.id = %s OR u.full_name ILIKE %s)
                ORDER BY u.id
                LIMIT %s
                """,
                (int(clean_q), pattern, limit),
            )
        else:
            cursor.execute(
                """
                SELECT u.id, u.full_name, u.city
                FROM users u
                WHERE u.role = 'Urban Planner'
                  AND u.is_active = true
                  AND u.is_demo = false
                  AND u.full_name ILIKE %s
                ORDER BY u.id
                LIMIT %s
                """,
                (pattern, limit),
            )
        rows = cursor.fetchall()
    return [{"id": r["id"], "name": r["full_name"], "city": r.get("city")} for r in rows]


def get_user_by_id(connection: Connection, user_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, role, is_active, is_demo, city
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        return cursor.fetchone()


def get_active_project_invite(connection: Connection, project_id: int) -> dict[str, Any] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM project_invites
            WHERE project_id = %s AND status = 'pending'
            ORDER BY id DESC
            LIMIT 1
            """,
            (project_id,),
        )
        return cursor.fetchone()


def create_project_invite(
    connection: Connection,
    *,
    project_id: int,
    planner_id: int,
    invited_by: int,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO project_invites (project_id, planner_id, invited_by, status)
            VALUES (%s, %s, %s, 'pending')
            RETURNING *
            """,
            (project_id, planner_id, invited_by),
        )
        row = cursor.fetchone()
    connection.commit()
    return row


def update_invite_status(connection: Connection, invite_id: int, status: str) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE project_invites
            SET status = %s, responded_at = NOW()
            WHERE id = %s
            RETURNING *
            """,
            (status, invite_id),
        )
        row = cursor.fetchone()
    connection.commit()
    return row


def create_project_event(
    connection: Connection,
    *,
    project_id: int,
    actor_id: int,
    from_stage: str,
    to_stage: str,
    note: str | None = None,
    auto_commit: bool = True,
) -> dict[str, Any]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO project_events (project_id, actor_id, from_stage, to_stage, note)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (project_id, actor_id, from_stage, to_stage, note),
        )
        row = cursor.fetchone()
    if auto_commit:
        connection.commit()
    return row


def get_project_events(connection: Connection, project_id: int) -> list[dict[str, Any]]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT *
            FROM project_events
            WHERE project_id = %s
            ORDER BY created_at ASC
            """,
            (project_id,),
        )
        return cursor.fetchall()


def update_project_fields(
    connection: Connection,
    project_id: int,
    updates: dict[str, Any],
    auto_commit: bool = True,
) -> dict[str, Any]:
    assignments = [f"{field} = %s" for field in updates]
    assignments.append("updated_at = NOW()")
    sql = f"UPDATE projects SET {', '.join(assignments)} WHERE id = %s RETURNING *"
    params = (*updates.values(), project_id)
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
    if auto_commit:
        connection.commit()
    return row


def get_projects_for_user(
    connection: Connection,
    *,
    user_id: int,
    role: str,
    status_filter: str | None = None,
    category: str | None = None,
    city: str | None = None,
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if role == "Government Official":
        clauses.append("p.created_by = %s")
        params.append(user_id)
    elif role == "Urban Planner":
        clauses.append("p.planner_id = %s")
        params.append(user_id)
    elif role == "Administrator":
        clauses.append("p.stage = ANY(%s)")
        params.append(["OpenForResponse", "InProgress", "Completed", "Halted"])
    else:
        # Citizens see none via this internal management endpoint
        return []

    if status_filter:
        clauses.append("p.status = %s")
        params.append(status_filter)
    if category:
        clauses.append("p.category = %s")
        params.append(category)
    if city:
        clauses.append("p.city = %s")
        params.append(city)

    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    sql = f"""
        SELECT p.*,
               u.full_name AS official_name,
               u.email AS official_email,
               u.organization AS official_organization,
               u.designation AS official_designation
        FROM projects p
        LEFT JOIN users u ON u.id = p.created_by
        {where}
        ORDER BY p.created_at DESC
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        if role == "Administrator":
            for row in rows:
                row["created_by"] = None
        return rows


def get_pending_invites_for_planner(
    connection: Connection,
    planner_id: int,
) -> list[dict[str, Any]]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                pi.project_id,
                p.title,
                p.city,
                u.full_name AS official_name,
                p.planner_deadline,
                pi.created_at AS invited_at
            FROM project_invites pi
            JOIN projects p ON p.id = pi.project_id
            LEFT JOIN users u ON u.id = pi.invited_by
            WHERE pi.planner_id = %s
              AND pi.status = 'pending'
              AND p.stage = 'Planner invited'
            ORDER BY pi.created_at DESC
            """,
            (planner_id,),
        )
        return cursor.fetchall()
