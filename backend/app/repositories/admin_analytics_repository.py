from datetime import datetime, timedelta, timezone
from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row


def get_analytics(connection: Connection, days: int) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    today = now.date()
    date_strings = [(today - timedelta(days=i)).isoformat() for i in reversed(range(days))]
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)

    with connection.cursor(row_factory=dict_row) as cur:
        # 1. New users per day
        cur.execute(
            """
            SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, count(*) AS count
            FROM users
            WHERE is_demo = false AND created_at >= %s
            GROUP BY day
            """,
            (start_dt,),
        )
        new_users_map = {r["day"]: r["count"] for r in cur.fetchall()}

        # 2. Comments per day
        cur.execute(
            """
            SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, count(*) AS count
            FROM comments
            WHERE created_at >= %s
            GROUP BY day
            """,
            (start_dt,),
        )
        comments_map = {r["day"]: r["count"] for r in cur.fetchall()}

        # 3. Logins per day
        cur.execute(
            """
            SELECT (logged_in_at AT TIME ZONE 'UTC')::date::text AS day, count(*) AS count
            FROM login_events
            WHERE logged_in_at >= %s
            GROUP BY day
            """,
            (start_dt,),
        )
        logins_map = {r["day"]: r["count"] for r in cur.fetchall()}

        # 4. Projects by stage (deployed stages only)
        cur.execute(
            """
            SELECT stage, count(*) AS count
            FROM projects
            WHERE stage IN ('OpenForResponse', 'InProgress', 'Completed', 'Halted', 'Recalled')
            GROUP BY stage
            """
        )
        stage_rows = cur.fetchall()
        projects_by_stage: dict[str, int] = {
            "OpenForResponse": 0,
            "InProgress": 0,
            "Completed": 0,
            "Halted": 0,
            "Recalled": 0,
        }
        for s in stage_rows:
            projects_by_stage[s["stage"]] = s["count"]

        # 5. Users by role
        cur.execute(
            """
            SELECT role, count(*) AS count
            FROM users
            WHERE is_demo = false
            GROUP BY role
            """
        )
        role_rows = cur.fetchall()
        users_by_role: dict[str, int] = {
            "Citizen": 0,
            "Urban Planner": 0,
            "Government Official": 0,
            "Administrator": 0,
        }
        for r in role_rows:
            users_by_role[r["role"]] = r["count"]

        # 6. Top 10 Government Officials with most projects
        cur.execute(
            """
            SELECT u.id, u.full_name AS name, count(p.id) AS count
            FROM users u
            JOIN projects p ON p.created_by = u.id
            WHERE u.role = 'Government Official'
            GROUP BY u.id, u.full_name
            ORDER BY count DESC, u.full_name ASC
            LIMIT 10
            """
        )
        top_officials_by_projects = cur.fetchall()

        # 7. Top 10 Urban Planners with most projects
        cur.execute(
            """
            SELECT u.id, u.full_name AS name, count(p.id) AS count
            FROM users u
            JOIN projects p ON p.planner_id = u.id
            WHERE u.role = 'Urban Planner'
            GROUP BY u.id, u.full_name
            ORDER BY count DESC, u.full_name ASC
            LIMIT 10
            """
        )
        top_planners_by_projects = cur.fetchall()

        # 8. Top 10 Users with most comments
        cur.execute(
            """
            SELECT u.id, u.full_name AS name, u.role, count(c.id) AS count
            FROM users u
            JOIN comments c ON c.user_id = u.id
            GROUP BY u.id, u.full_name, u.role
            ORDER BY count DESC, u.full_name ASC
            LIMIT 10
            """
        )
        top_users_by_comments = cur.fetchall()

    daily_series = [
        {
            "date": d,
            "new_users": new_users_map.get(d, 0),
            "comments": comments_map.get(d, 0),
            "logins": logins_map.get(d, 0),
        }
        for d in date_strings
    ]

    return {
        "days": days,
        "daily_series": daily_series,
        "projects_by_stage": projects_by_stage,
        "users_by_role": users_by_role,
        "top_officials_by_projects": top_officials_by_projects,
        "top_planners_by_projects": top_planners_by_projects,
        "top_users_by_comments": top_users_by_comments,
    }
