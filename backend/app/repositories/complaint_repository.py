from psycopg import Connection


def create_complaint(connection: Connection, *, submitted_by: int, project_id: int | None, subject: str, description: str) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO complaints (submitted_by, project_id, subject, description)
               VALUES (%s, %s, %s, %s) RETURNING *""",
            (submitted_by, project_id, subject, description),
        )
        complaint = cursor.fetchone()
    connection.commit()
    return complaint


def get_complaint_by_id(connection: Connection, complaint_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM complaints WHERE id = %s", (complaint_id,))
        return cursor.fetchone()


def list_complaints_for_user(connection: Connection, user_id: int) -> list[dict]:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM complaints WHERE submitted_by = %s ORDER BY created_at DESC", (user_id,))
        return cursor.fetchall()


def list_all_complaints(connection: Connection) -> list[dict]:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM complaints ORDER BY created_at DESC")
        return cursor.fetchall()


def update_complaint_status(connection: Connection, complaint_id: int, status: str) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE complaints SET status = %s, updated_at = NOW() WHERE id = %s RETURNING *",
            (status, complaint_id),
        )
        complaint = cursor.fetchone()
    connection.commit()
    return complaint
