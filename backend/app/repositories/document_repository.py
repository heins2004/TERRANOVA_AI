from psycopg import Connection


DOCUMENT_SELECT = """
SELECT planning_documents.*, users.full_name AS uploaded_by_name
FROM planning_documents
JOIN users ON users.id = planning_documents.uploaded_by
"""


def create_document_record(connection: Connection, *, title: str, description: str | None, category: str | None, project_id: int | None, original_filename: str, stored_filename: str, file_size_bytes: int, content_type: str, uploaded_by: int) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO planning_documents
               (title, description, category, project_id, original_filename, stored_filename, file_size_bytes, content_type, uploaded_by)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING *""",
            (title, description, category, project_id, original_filename, stored_filename, file_size_bytes, content_type, uploaded_by),
        )
        document = cursor.fetchone()
    connection.commit()
    return document


def list_documents(connection: Connection, *, project_id: int | None = None) -> list[dict]:
    where = " WHERE planning_documents.project_id = %s" if project_id is not None else ""
    with connection.cursor() as cursor:
        cursor.execute(f"{DOCUMENT_SELECT}{where} ORDER BY planning_documents.created_at DESC", (project_id,) if project_id is not None else ())
        return cursor.fetchall()


def get_document_by_id(connection: Connection, document_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(f"{DOCUMENT_SELECT} WHERE planning_documents.id = %s", (document_id,))
        return cursor.fetchone()


def delete_document_record(connection: Connection, document_id: int) -> bool:
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM planning_documents WHERE id = %s", (document_id,))
        deleted = cursor.rowcount > 0
    connection.commit()
    return deleted
