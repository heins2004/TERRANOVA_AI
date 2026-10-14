from typing import Any
from psycopg import Connection
from psycopg.rows import dict_row


def escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


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
        SELECT id, full_name, email, role, city, is_active, is_demo, created_at
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

    for r in rows:
        r["name"] = r["full_name"]
        r["last_login_at"] = None

    return rows, total


def get_user_by_id(connection: Connection, user_id: int) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "SELECT id, full_name, email, role, city, is_active, is_demo, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        if row:
            row["name"] = row["full_name"]
            row["last_login_at"] = None
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
        row["name"] = row["full_name"]
        row["last_login_at"] = None
        return row


def set_user_active_status(connection: Connection, user_id: int, is_active: bool) -> dict[str, Any] | None:
    with connection.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE users SET is_active = %s WHERE id = %s
            RETURNING id, full_name, email, role, city, is_active, is_demo, created_at
            """,
            (is_active, user_id),
        )
        row = cur.fetchone()
        if row:
            row["name"] = row["full_name"]
            row["last_login_at"] = None
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

    return {
        "users_by_role": users_by_role,
        "active_vs_inactive": active_vs_inactive,
        "deployed_projects_by_stage": deployed_projects_by_stage,
        "comments_last_7_days": comments_last_7_days,
        "logins_last_7_days": None,
        "logins_tracking_status": "Logins are not tracked in this system.",
    }
