from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row

PUBLIC_STAGES: tuple[str, ...] = ("OpenForResponse", "InProgress", "Completed", "Halted")


def get_user_profile_by_id(connection: Connection, user_id: int) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT id, full_name AS name, email, role, phone, city, created_at,
                   organization, designation, expertise, avatar_key
            FROM users
            WHERE id = %s AND is_active = true
            """,
            (user_id,),
        )
        return cursor.fetchone()


def get_user_counts_by_role(connection: Connection, user_id: int, role: str) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cursor:
        if role == "Citizen":
            cursor.execute(
                "SELECT count(*) AS count FROM project_follows WHERE user_id = %s",
                (user_id,),
            )
            follows_row = cursor.fetchone()
            follows_count = follows_row["count"] if follows_row else 0

            cursor.execute(
                "SELECT count(*) AS count FROM comments WHERE user_id = %s",
                (user_id,),
            )
            comments_row = cursor.fetchone()
            comments_count = comments_row["count"] if comments_row else 0

            return {
                "follows": follows_count,
                "comments": comments_count,
            }

        elif role == "Urban Planner":
            cursor.execute(
                """
                SELECT count(*) AS count
                FROM project_invites pi
                JOIN projects p ON p.id = pi.project_id
                WHERE pi.planner_id = %s AND pi.status = 'pending' AND p.stage = 'Planner invited'
                """,
                (user_id,),
            )
            invites_row = cursor.fetchone()
            pending_invites = invites_row["count"] if invites_row else 0

            cursor.execute(
                """
                SELECT stage, count(*) AS count
                FROM projects
                WHERE planner_id = %s
                GROUP BY stage
                ORDER BY stage ASC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            assigned_by_stage = {r["stage"]: r["count"] for r in rows}

            return {
                "pending_invites": pending_invites,
                "assigned_projects_by_stage": assigned_by_stage,
            }

        elif role == "Government Official":
            cursor.execute(
                """
                SELECT stage, count(*) AS count
                FROM projects
                WHERE created_by = %s
                GROUP BY stage
                ORDER BY stage ASC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()
            own_by_stage = {r["stage"]: r["count"] for r in rows}

            return {
                "own_projects_by_stage": own_by_stage,
            }

        elif role == "Administrator":
            return None

        return None


def update_user_profile(
    connection: Connection,
    user_id: int,
    updates: dict[str, Any],
) -> dict[str, Any] | None:
    if not updates:
        return get_user_profile_by_id(connection, user_id)

    set_clauses: list[str] = []
    params: list[Any] = []

    for col, val in updates.items():
        set_clauses.append(f"{col} = %s")
        params.append(val)

    params.append(user_id)
    set_sql = ", ".join(set_clauses)

    query = f"""
        UPDATE users
        SET {set_sql}
        WHERE id = %s
        RETURNING id, full_name AS name, email, role, phone, city, created_at,
                  organization, designation, expertise, avatar_key
    """

    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(query, params)
        updated_row = cursor.fetchone()
    connection.commit()
    return updated_row


def get_user_password_hash(connection: Connection, user_id: int) -> str | None:
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            "SELECT password_hash FROM users WHERE id = %s",
            (user_id,),
        )
        row = cursor.fetchone()
        return row["password_hash"] if row else None


def update_user_password(connection: Connection, user_id: int, new_hash: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, user_id),
        )
    connection.commit()


def delete_other_user_sessions(
    connection: Connection,
    user_id: int,
    current_session_token: str,
) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM user_sessions WHERE user_id = %s AND session_token != %s",
            (user_id, current_session_token),
        )
    connection.commit()


def get_following_projects(
    connection: Connection,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    stages = list(PUBLIC_STAGES)
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT count(*) AS total
            FROM project_follows pf
            JOIN projects p ON p.id = pf.project_id
            WHERE pf.user_id = %s AND p.stage = ANY(%s)
            """,
            (user_id, stages),
        )
        total_row = cursor.fetchone()
        total = total_row["total"] if total_row else 0

        cursor.execute(
            """
            SELECT p.id, p.title, p.category, p.city, p.stage, p.response_deadline, p.halt_reason, pf.created_at AS followed_at
            FROM project_follows pf
            JOIN projects p ON p.id = pf.project_id
            WHERE pf.user_id = %s AND p.stage = ANY(%s)
            ORDER BY pf.created_at DESC, p.id DESC
            LIMIT %s OFFSET %s
            """,
            (user_id, stages, limit, offset),
        )
        rows = cursor.fetchall()

    return rows, total


def get_user_comments(
    connection: Connection,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    stages = list(PUBLIC_STAGES)
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute(
            """
            SELECT count(*) AS total
            FROM comments c
            JOIN projects p ON p.id = c.project_id
            WHERE c.user_id = %s AND p.stage = ANY(%s)
            """,
            (user_id, stages),
        )
        total_row = cursor.fetchone()
        total = total_row["total"] if total_row else 0

        cursor.execute(
            """
            SELECT c.id, c.project_id, p.title AS project_title, c.stance, c.body, c.created_at
            FROM comments c
            JOIN projects p ON p.id = c.project_id
            WHERE c.user_id = %s AND p.stage = ANY(%s)
            ORDER BY c.created_at DESC, c.id DESC
            LIMIT %s OFFSET %s
            """,
            (user_id, stages, limit, offset),
        )
        rows = cursor.fetchall()

    return rows, total
