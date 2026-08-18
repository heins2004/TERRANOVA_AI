from psycopg import Connection


USER_COLUMNS = "id, full_name, email, role, is_active, created_at"


def list_users(connection: Connection) -> list[dict]:
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT {USER_COLUMNS} FROM users ORDER BY created_at DESC")
        return cursor.fetchall()


def update_user_role(connection: Connection, user_id: int, new_role: str) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE users SET role = %s WHERE id = %s RETURNING {USER_COLUMNS}",
            (new_role, user_id),
        )
        user = cursor.fetchone()
    connection.commit()
    return user


def update_user_active_status(connection: Connection, user_id: int, is_active: bool) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE users SET is_active = %s WHERE id = %s RETURNING {USER_COLUMNS}",
            (is_active, user_id),
        )
        user = cursor.fetchone()
    connection.commit()
    return user
