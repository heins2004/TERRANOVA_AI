from datetime import datetime, timedelta, timezone
from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row


def escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _enrich_user(r: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
    if now is None:
        now = datetime.now(timezone.utc)
    r["name"] = r.get("full_name") or ""
    last_login = r.get("last_login_at")
    created = r.get("created_at") or now
    ref_time = last_login if last_login is not None else created
    diff = now - ref_time
    inactive_days = max(0, int(diff.total_seconds() // 86400))
    r["inactive_days"] = inactive_days
    is_flagged = bool(r.get("is_active", False) and not r.get("is_demo", False) and inactive_days >= 20)
    r["is_inactive"] = is_flagged
    r["inactive_flag"] = is_flagged
    return r



def list_users(
    connection: Connection,
    *,
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    limit: int | None = None,
    offset: int = 0,
    include_demo: bool = False,
) -> tuple[list[dict[str, Any]], int]:
    where_clauses: list[str] = []
    params: list[Any] = []

    if not include_demo:
        where_clauses.append("is_demo = false")

    if role:
        where_clauses.append("role = %s")
        params.append(role.strip())

    if status:
        normalized_status = status.strip().lower()
        if normalized_status == "active":
            where_clauses.append("is_active = true")
        elif normalized_status == "inactive":
            where_clauses.append("is_active = false")

    if q:
        clean_q = " ".join(q.strip().split())
        if clean_q:
            escaped = escape_like(clean_q)
            pattern = f"%{escaped}%"
            where_clauses.append("(full_name ILIKE %s ESCAPE '\\' OR email ILIKE %s ESCAPE '\\' OR city ILIKE %s ESCAPE '\\')")
            params.extend([pattern, pattern, pattern])

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    count_sql = f"SELECT count(*) AS total FROM users {where_sql}"

    select_sql = f"""
        SELECT id, full_name, email, role, city, is_active, is_demo, created_at,
               (SELECT max(logged_in_at) FROM login_events le WHERE le.user_id = users.id) AS last_login_at
        FROM users
        {where_sql}
        ORDER BY created_at DESC, id DESC
    """
    query_params = list(params)
    if limit is not None:
        select_sql += " LIMIT %s OFFSET %s"
        query_params.extend([limit, offset])
    elif offset > 0:
        select_sql += " OFFSET %s"
        query_params.append(offset)

    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = total_row["total"] if total_row else 0

        cur.execute(select_sql, query_params)
        rows = cur.fetchall()

    now = datetime.now(timezone.utc)
    for r in rows:
        _enrich_user(r, now)

    return rows, total


def get_user_by_id(connection: Connection, user_id: int) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT id, full_name, email, role, city, is_active, is_demo, created_at,
                   (SELECT max(logged_in_at) FROM login_events le WHERE le.user_id = users.id) AS last_login_at
            FROM users WHERE id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
        if row:
            _enrich_user(row)
        return row


def get_user_by_email(connection: Connection, email: str) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT id, full_name, email, role, is_active FROM users WHERE email = %s", (email.strip().lower(),))
        return cur.fetchone()


def count_active_admins(connection: Connection) -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT count(*) FROM users WHERE role = 'Administrator' AND is_active = true")
        row = cur.fetchone()
        return row[0] if row else 0


def create_official_user(
    connection: Connection,
    *,
    full_name: str,
    email: str,
    password_hash: str,
    phone: str | None,
    city: str | None,
    role: str = "Government Official",
) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO users (full_name, email, role, password_hash, is_active, is_demo, city, phone, must_change_password)
            VALUES (%s, %s, %s, %s, true, false, %s, %s, true)
            RETURNING id, full_name, email, role, city, is_active, is_demo, created_at, must_change_password
            """,
            (full_name.strip(), email.strip().lower(), role, password_hash, city, phone),
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError("Failed to insert official user.")
        _enrich_user(row)
        return row


def set_user_active_status(connection: Connection, user_id: int, is_active: bool) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE users SET is_active = %s WHERE id = %s
            RETURNING id, full_name, email, role, city, is_active, is_demo, created_at,
                      (SELECT max(logged_in_at) FROM login_events le WHERE le.user_id = %s) AS last_login_at
            """,
            (is_active, user_id, user_id),
        )
        row = cur.fetchone()
        if row:
            _enrich_user(row)
        return row


def delete_user_sessions(connection: Connection, user_id: int) -> int:
    with connection.cursor() as cur:
        cur.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
        return cur.rowcount


def insert_admin_action(
    connection: Connection,
    *,
    admin_id: int,
    action: str,
    target_user_id: int | None,
    note: str | None = None,
) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO admin_actions (admin_id, action, target_user_id, note)
            VALUES (%s, %s, %s, %s)
            RETURNING id, admin_id, action, target_user_id, note, created_at
            """,
            (admin_id, action, target_user_id, note),
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError("Failed to insert admin action.")
        return row


def get_admin_stats(connection: Connection) -> dict[str, Any]:
    with connection.cursor(row_factory=dict_row) as cur:
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

        cur.execute(
            """
            SELECT
                count(*) FILTER (WHERE is_active = true) AS active,
                count(*) FILTER (WHERE is_active = false) AS inactive
            FROM users
            WHERE is_demo = false
            """
        )
        status_row = cur.fetchone() or {"active": 0, "inactive": 0}
        active_vs_inactive = {
            "active": status_row["active"] or 0,
            "inactive": status_row["inactive"] or 0,
        }

        cur.execute(
            """
            SELECT stage, count(*) AS count
            FROM projects
            WHERE stage IN ('OpenForResponse', 'InProgress', 'Completed', 'Halted', 'Recalled')
            GROUP BY stage
            """
        )
        stage_rows = cur.fetchall()
        deployed_projects_by_stage: dict[str, int] = {
            "OpenForResponse": 0,
            "InProgress": 0,
            "Completed": 0,
            "Halted": 0,
            "Recalled": 0,
        }
        for s in stage_rows:
            deployed_projects_by_stage[s["stage"]] = s["count"]

        cur.execute("SELECT count(*) AS count FROM comments WHERE created_at >= now() - interval '7 days'")
        comment_row = cur.fetchone() or {"count": 0}
        comments_last_7_days = comment_row["count"] or 0

        cur.execute("SELECT count(*) AS count FROM login_events WHERE logged_in_at >= now() - interval '7 days'")
        login_row = cur.fetchone() or {"count": 0}
        logins_last_7_days = login_row["count"] or 0

    return {
        "users_by_role": users_by_role,
        "active_vs_inactive": active_vs_inactive,
        "deployed_projects_by_stage": deployed_projects_by_stage,
        "comments_last_7_days": comments_last_7_days,
        "logins_last_7_days": logins_last_7_days,
        "logins_tracking_status": "Active",
    }


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
    }


def get_login_log(
    connection: Connection,
    *,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT count(*) AS total FROM login_events")
        total = (cur.fetchone() or {"total": 0})["total"]

        cur.execute(
            """
            SELECT
                le.id,
                le.user_id,
                u.full_name,
                u.role,
                le.logged_in_at,
                le.browser
            FROM login_events le
            JOIN users u ON u.id = le.user_id
            ORDER BY le.logged_in_at DESC, le.id DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        )
        rows = cur.fetchall()

    return rows, total

