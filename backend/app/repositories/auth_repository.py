from datetime import datetime

from psycopg import Connection


def get_user_by_email(connection: Connection, email: str) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, role, is_active, password_hash, created_at, avatar_key, must_change_password
            FROM users
            WHERE email = %s
            """,
            (email,),
        )
        return cursor.fetchone()


def create_user(
    connection: Connection,
    *,
    full_name: str,
    email: str,
    role: str,
    password_hash: str,
) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO users (full_name, email, role, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING id, full_name, email, role, is_active, created_at, avatar_key, must_change_password
            """,
            (full_name, email, role, password_hash),
        )
        created_user = cursor.fetchone()
    connection.commit()
    return created_user


def replace_user_session(
    connection: Connection,
    *,
    user_id: int,
    session_token: str,
    expires_at: datetime,
) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM user_sessions WHERE user_id = %s AND expires_at <= NOW()",
            (user_id,),
        )
        cursor.execute(
            """
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, session_token, expires_at),
        )
        cursor.execute(
            """
            DELETE FROM user_sessions
            WHERE id IN (
                SELECT id FROM user_sessions
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
                OFFSET 10
            )
            """,
            (user_id,),
        )
    connection.commit()


def get_authenticated_user_by_session_token(
    connection: Connection,
    session_token: str,
) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_sessions WHERE expires_at <= NOW()")
        cursor.execute(
            """
            SELECT users.id, users.full_name, users.email, users.role, users.is_active, users.created_at, users.avatar_key, users.must_change_password
            FROM user_sessions
            JOIN users ON users.id = user_sessions.user_id
            WHERE user_sessions.session_token = %s
              AND user_sessions.expires_at > NOW()
            """,
            (session_token,),
        )
        user_row = cursor.fetchone()
    connection.commit()
    return user_row


def delete_session_by_token(connection: Connection, session_token: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_sessions WHERE session_token = %s", (session_token,))
    connection.commit()


def update_user_password_hash(
    connection: Connection,
    *,
    user_id: int,
    password_hash: str,
) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (password_hash, user_id),
        )
    connection.commit()
