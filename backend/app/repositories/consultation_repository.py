from psycopg import Connection


CONSULTATION_SELECT = """
SELECT c.*, p.title AS project_title
FROM consultations c
LEFT JOIN projects p ON p.id = c.project_id
"""


def create_consultation(connection: Connection, *, created_by: int, **values: object) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO consultations (title, description, project_id, scheduled_at, location, created_by)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
            (values["title"], values["description"], values.get("project_id"), values["scheduled_at"], values.get("location"), created_by),
        )
        consultation = cursor.fetchone()
    connection.commit()
    return get_consultation_by_id(connection, consultation["id"])


def get_consultation_by_id(connection: Connection, consultation_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(f"{CONSULTATION_SELECT} WHERE c.id = %s", (consultation_id,))
        return cursor.fetchone()


def list_consultations(connection: Connection, *, project_id: int | None = None) -> list[dict]:
    where = " WHERE c.project_id = %s" if project_id is not None else ""
    with connection.cursor() as cursor:
        cursor.execute(f"{CONSULTATION_SELECT}{where} ORDER BY c.scheduled_at ASC", (project_id,) if project_id is not None else ())
        return cursor.fetchall()


def update_consultation(connection: Connection, consultation_id: int, values: dict) -> dict | None:
    if not values:
        return get_consultation_by_id(connection, consultation_id)
    assignments = ", ".join(f"{field} = %s" for field in values)
    with connection.cursor() as cursor:
        cursor.execute(f"UPDATE consultations SET {assignments} WHERE id = %s RETURNING id", (*values.values(), consultation_id))
        updated = cursor.fetchone()
    connection.commit()
    return get_consultation_by_id(connection, consultation_id) if updated else None


def create_feedback(connection: Connection, *, consultation_id: int, submitted_by: int, comment: str) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO consultation_feedback (consultation_id, submitted_by, comment) VALUES (%s, %s, %s) RETURNING id",
            (consultation_id, submitted_by, comment),
        )
        feedback = cursor.fetchone()
    connection.commit()
    return get_feedback_by_id(connection, feedback["id"])


def get_feedback_by_id(connection: Connection, feedback_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute("""SELECT f.*, u.full_name AS submitted_by_name FROM consultation_feedback f
                        JOIN users u ON u.id = f.submitted_by WHERE f.id = %s""", (feedback_id,))
        return cursor.fetchone()


def list_feedback_for_consultation(connection: Connection, consultation_id: int, submitted_by: int | None = None) -> list[dict]:
    clause = " AND f.submitted_by = %s" if submitted_by is not None else ""
    params = (consultation_id, submitted_by) if submitted_by is not None else (consultation_id,)
    with connection.cursor() as cursor:
        cursor.execute(f"""SELECT f.*, u.full_name AS submitted_by_name FROM consultation_feedback f
                           JOIN users u ON u.id = f.submitted_by WHERE f.consultation_id = %s{clause}
                           ORDER BY f.created_at ASC""", params)
        return cursor.fetchall()
