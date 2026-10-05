from typing import Any
import psycopg
from psycopg.rows import dict_row

from app.repositories.public_project_repository import PUBLIC_STAGES


def get_public_comments_for_project(
    conn: psycopg.Connection,
    project_id: int,
    *,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], int]:
    """
    Fetch top-level comments and their replies along with author information.
    Returns (top_level_comments, replies, total_top_level_count).
    """
    count_sql = """
        SELECT count(*) AS total
        FROM comments
        WHERE project_id = %s AND parent_id IS NULL;
    """

    top_level_sql = """
        SELECT
            c.id,
            c.project_id,
            c.parent_id,
            c.stance,
            c.body,
            c.created_at,
            u.id AS author_id,
            u.full_name AS author_full_name,
            u.role AS author_role,
            p.created_by AS project_created_by
        FROM comments c
        JOIN users u ON u.id = c.user_id
        JOIN projects p ON p.id = c.project_id
        WHERE c.project_id = %s AND c.parent_id IS NULL
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT %s OFFSET %s;
    """

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(count_sql, (project_id,))
        total_row = cur.fetchone()
        total = total_row["total"] if total_row else 0

        cur.execute(top_level_sql, (project_id, limit, offset))
        top_comments = cur.fetchall()

        if not top_comments:
            return [], [], total

        parent_ids = [c["id"] for c in top_comments]
        replies_sql = """
            SELECT
                c.id,
                c.project_id,
                c.parent_id,
                c.stance,
                c.body,
                c.created_at,
                u.id AS author_id,
                u.full_name AS author_full_name,
                u.role AS author_role,
                p.created_by AS project_created_by
            FROM comments c
            JOIN users u ON u.id = c.user_id
            JOIN projects p ON p.id = c.project_id
            WHERE c.project_id = %s AND c.parent_id = ANY(%s)
            ORDER BY c.created_at ASC, c.id ASC;
        """
        cur.execute(replies_sql, (project_id, parent_ids))
        replies = cur.fetchall()

    return top_comments, replies, total


def get_comment_by_id(
    conn: psycopg.Connection,
    comment_id: int,
) -> dict[str, Any] | None:
    query = """
        SELECT
            c.id,
            c.project_id,
            c.user_id,
            c.parent_id,
            c.stance,
            c.body,
            c.created_at,
            p.created_by AS project_owner_id,
            u.role AS user_role,
            u.full_name AS user_full_name
        FROM comments c
        JOIN projects p ON p.id = c.project_id
        JOIN users u ON u.id = c.user_id
        WHERE c.id = %s;
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, (comment_id,))
        return cur.fetchone()


def get_user_comment_count_in_window(
    conn: psycopg.Connection,
    user_id: int,
    window_minutes: int = 10,
) -> int:
    query = """
        SELECT count(*) AS cnt
        FROM comments
        WHERE user_id = %s AND created_at >= now() - make_interval(mins => %s);
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, (user_id, window_minutes))
        row = cur.fetchone()
        return row["cnt"] if row else 0


def has_duplicate_comment(
    conn: psycopg.Connection,
    user_id: int,
    project_id: int,
    body: str,
    window_minutes: int = 10,
) -> bool:
    query = """
        SELECT 1
        FROM comments
        WHERE user_id = %s
          AND project_id = %s
          AND body = %s
          AND created_at >= now() - make_interval(mins => %s)
        LIMIT 1;
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, (user_id, project_id, body, window_minutes))
        return cur.fetchone() is not None


def insert_comment(
    conn: psycopg.Connection,
    *,
    project_id: int,
    user_id: int,
    parent_id: int | None,
    stance: str | None,
    body: str,
) -> dict[str, Any]:
    query = """
        INSERT INTO comments (
            project_id, user_id, parent_id, stance, body, is_demo, created_at
        ) VALUES (
            %s, %s, %s, %s, %s, false, now()
        )
        RETURNING id, created_at;
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, (project_id, user_id, parent_id, stance, body))
        row = cur.fetchone()
    conn.commit()
    return row


def delete_comment_by_id(
    conn: psycopg.Connection,
    comment_id: int,
) -> None:
    with conn.cursor() as cur:
        cur.execute("DELETE FROM comments WHERE id = %s;", (comment_id,))
    conn.commit()


def add_project_follow(
    conn: psycopg.Connection,
    user_id: int,
    project_id: int,
) -> None:
    query = """
        INSERT INTO project_follows (user_id, project_id, created_at)
        VALUES (%s, %s, now())
        ON CONFLICT (user_id, project_id) DO NOTHING;
    """
    with conn.cursor() as cur:
        cur.execute(query, (user_id, project_id))
    conn.commit()


def remove_project_follow(
    conn: psycopg.Connection,
    user_id: int,
    project_id: int,
) -> None:
    query = "DELETE FROM project_follows WHERE user_id = %s AND project_id = %s;"
    with conn.cursor() as cur:
        cur.execute(query, (user_id, project_id))
    conn.commit()


def get_user_followed_project_ids(
    conn: psycopg.Connection,
    user_id: int,
) -> list[int]:
    query = """
        SELECT pf.project_id
        FROM project_follows pf
        JOIN projects p ON p.id = pf.project_id
        WHERE pf.user_id = %s AND p.stage = ANY(%s)
        ORDER BY pf.project_id;
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, (user_id, list(PUBLIC_STAGES)))
        rows = cur.fetchall()
        return [r["project_id"] for r in rows]
