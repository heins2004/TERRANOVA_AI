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

    where_clauses = ["p.stage = ANY(%s)"]
    params: list[Any] = [allowed_stages]

    if category:
        clean_cat = category.strip()
        if clean_cat:
            where_clauses.append("p.category ILIKE %s")
            params.append(clean_cat)

    if q:
        clean_q = " ".join(q.strip().split())
        if clean_q:
            escaped_q = escape_like(clean_q)
            pattern = f"%{escaped_q}%"
            where_clauses.append(
                "(p.title ILIKE %s ESCAPE '\\' OR p.city ILIKE %s ESCAPE '\\' OR p.category ILIKE %s ESCAPE '\\')"
            )
            params.extend([pattern, pattern, pattern])

    where_sql = " AND ".join(where_clauses)

    count_sql = f"SELECT count(*) AS total FROM projects p WHERE {where_sql};"

    if sort == "talk":
        order_sql = "ORDER BY participants DESC, p.deployed_at DESC NULLS LAST, p.id DESC"
    elif sort == "soon":
        order_sql = """
            ORDER BY
                CASE WHEN p.stage = 'OpenForResponse' AND p.response_deadline IS NOT NULL THEN 0 ELSE 1 END ASC,
                p.response_deadline ASC,
                p.deployed_at DESC NULLS LAST,
                p.id DESC
        """
    else:
        order_sql = "ORDER BY p.deployed_at DESC NULLS LAST, p.id DESC"

    select_sql = f"""
        SELECT
            p.id, p.title, p.description, p.category, p.city,
            p.location_lat, p.location_lng, p.budget,
            p.start_date, p.end_date, p.stage,
            p.response_deadline, p.halt_reason, p.is_demo,
            COALESCE(stats.support_count, 0) AS support_count,
            COALESCE(stats.concern_count, 0) AS concern_count,
            COALESCE(stats.neutral_count, 0) AS neutral_count,
            COALESCE(part.participants, 0) AS participants
        FROM projects p
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) FILTER (WHERE latest.stance = 'Support') AS support_count,
                COUNT(*) FILTER (WHERE latest.stance = 'Concern') AS concern_count,
                COUNT(*) FILTER (WHERE latest.stance = 'Neutral') AS neutral_count
            FROM (
                SELECT DISTINCT ON (c.user_id) c.user_id, c.stance
                FROM comments c
                WHERE c.project_id = p.id AND c.parent_id IS NULL AND c.stance IS NOT NULL
                ORDER BY c.user_id, c.created_at DESC, c.id DESC
            ) latest
        ) stats ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(DISTINCT c2.user_id) AS participants
            FROM comments c2
            WHERE c2.project_id = p.id
        ) part ON true
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
            p.id, p.title, p.description, p.category, p.city,
            p.location_lat, p.location_lng, p.budget,
            p.start_date, p.end_date, p.stage,
            p.response_deadline, p.halt_reason, p.is_demo, p.created_by,
            COALESCE(stats.support_count, 0) AS support_count,
            COALESCE(stats.concern_count, 0) AS concern_count,
            COALESCE(stats.neutral_count, 0) AS neutral_count,
            COALESCE(part.participants, 0) AS participants
        FROM projects p
        LEFT JOIN LATERAL (
            SELECT
                COUNT(*) FILTER (WHERE latest.stance = 'Support') AS support_count,
                COUNT(*) FILTER (WHERE latest.stance = 'Concern') AS concern_count,
                COUNT(*) FILTER (WHERE latest.stance = 'Neutral') AS neutral_count
            FROM (
                SELECT DISTINCT ON (c.user_id) c.user_id, c.stance
                FROM comments c
                WHERE c.project_id = p.id AND c.parent_id IS NULL AND c.stance IS NOT NULL
                ORDER BY c.user_id, c.created_at DESC, c.id DESC
            ) latest
        ) stats ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(DISTINCT c2.user_id) AS participants
            FROM comments c2
            WHERE c2.project_id = p.id
        ) part ON true
        WHERE p.id = %s AND p.stage = ANY(%s);
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, [project_id, list(PUBLIC_STAGES)])
        return cur.fetchone()
