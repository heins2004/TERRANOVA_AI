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


def list_complaints_for_user(connection: Connection, user_id: int, *, project_id: int | None = None) -> list[dict]:
    clause = " AND project_id = %s" if project_id is not None else ""
    params = (user_id, project_id) if project_id is not None else (user_id,)
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM complaints WHERE submitted_by = %s{clause} ORDER BY created_at DESC", params)
        return cursor.fetchall()


def list_all_complaints(connection: Connection, *, project_id: int | None = None) -> list[dict]:
    where = " WHERE project_id = %s" if project_id is not None else ""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM complaints{where} ORDER BY created_at DESC", (project_id,) if project_id is not None else ())
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
