import json
from psycopg import Connection


def create_study_area(
    connection: Connection,
    *,
    name: str,
    city: str | None,
    boundary_geojson: dict,
    created_by: int,
) -> dict:
    boundary_json = json.dumps(boundary_geojson)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO study_areas (name, city, boundary, created_by)
            VALUES (%s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), %s)
            RETURNING id, name, city, ST_AsGeoJSON(boundary)::json AS boundary, created_by, created_at
            """,
            (name, city, boundary_json, created_by),
        )
        row = cursor.fetchone()
    connection.commit()
    return row


def list_study_areas(connection: Connection) -> list[dict]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, city, ST_AsGeoJSON(boundary)::json AS boundary, created_by, created_at
            FROM study_areas
            ORDER BY created_at DESC
            """
        )
        return cursor.fetchall()


def get_study_area(connection: Connection, study_area_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, city, ST_AsGeoJSON(boundary)::json AS boundary, created_by, created_at
            FROM study_areas
            WHERE id = %s
            """,
            (study_area_id,),
        )
        return cursor.fetchone()
