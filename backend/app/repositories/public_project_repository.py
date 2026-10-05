from typing import Any
import psycopg
from psycopg.rows import dict_row

PUBLIC_STAGES: tuple[str, ...] = ("OpenForResponse", "InProgress", "Completed", "Halted")
ACTIVE_PUBLIC_STAGES: tuple[str, ...] = ("OpenForResponse", "InProgress")
PAST_PUBLIC_STAGES: tuple[str, ...] = ("Completed", "Halted")


def escape_like(text: str) -> str:
    """Escape %, _, and backslash for ILIKE queries."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_public_projects(
    conn: psycopg.Connection,
    *,
    q: str | None = None,
    category: str | None = None,
    past: bool = False,
    sort: str = "new",
    limit: int = 24,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    allowed_stages = list(PAST_PUBLIC_STAGES if past else ACTIVE_PUBLIC_STAGES)

    where_clauses = ["stage = ANY(%s)"]
    params: list[Any] = [allowed_stages]

    if category:
        clean_cat = category.strip()
        if clean_cat:
            where_clauses.append("category ILIKE %s")
            params.append(clean_cat)

    if q:
        clean_q = " ".join(q.strip().split())
        if clean_q:
            escaped_q = escape_like(clean_q)
            pattern = f"%{escaped_q}%"
            where_clauses.append(
                "(title ILIKE %s ESCAPE '\\' OR city ILIKE %s ESCAPE '\\' OR category ILIKE %s ESCAPE '\\')"
            )
            params.extend([pattern, pattern, pattern])

    where_sql = " AND ".join(where_clauses)

    count_sql = f"SELECT count(*) AS total FROM projects WHERE {where_sql};"

    if sort == "soon":
        order_sql = """
            ORDER BY
                CASE WHEN stage = 'OpenForResponse' AND response_deadline IS NOT NULL THEN 0 ELSE 1 END ASC,
                response_deadline ASC,
                deployed_at DESC NULLS LAST,
                id DESC
        """
    else:
        order_sql = "ORDER BY deployed_at DESC NULLS LAST, id DESC"

    select_sql = f"""
        SELECT
            id, title, description, category, city,
            location_lat, location_lng, budget,
            start_date, end_date, stage,
            response_deadline, halt_reason, is_demo
        FROM projects
        WHERE {where_sql}
        {order_sql}
        LIMIT %s OFFSET %s;
    """

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, params)
        total_row = cur.fetchone()
        total = total_row["total"] if total_row else 0

        query_params = list(params) + [limit, offset]
        cur.execute(select_sql, query_params)
        rows = cur.fetchall()

    return rows, total


def get_public_project_by_id(
    conn: psycopg.Connection,
    project_id: int,
) -> dict[str, Any] | None:
    query = """
        SELECT
            id, title, description, category, city,
            location_lat, location_lng, budget,
            start_date, end_date, stage,
            response_deadline, halt_reason, is_demo
        FROM projects
        WHERE id = %s AND stage = ANY(%s);
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, [project_id, list(PUBLIC_STAGES)])
        return cur.fetchone()
