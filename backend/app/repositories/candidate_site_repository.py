from decimal import Decimal
import json
from psycopg import Connection


def create_candidate_site(
    connection: Connection,
    *,
    study_area_id: int,
    name: str,
    location_geojson: dict,
    created_by: int,
    area_size_acres: Decimal | float | None = None,
    land_use: str | None = None,
    suitability_status: str = "RequiresReview",
    availability_status: str = "VerificationRequired",
    ownership_type: str = "Unknown",
    flood_risk: str = "Unknown",
    notes: str | None = None,
) -> dict:
    location_json = json.dumps(location_geojson)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO candidate_sites (
                study_area_id, name, location, area_size_acres, land_use,
                suitability_status, availability_status, ownership_type,
                flood_risk, notes, created_by
            )
            VALUES (%s, %s, ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326), %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, study_area_id, name, ST_AsGeoJSON(location)::json AS location,
                      area_size_acres, land_use, suitability_status, availability_status,
                      ownership_type, flood_risk, notes, promoted_project_id, created_by, created_at
            """,
            (
                study_area_id,
                name,
                location_json,
                area_size_acres,
                land_use,
                suitability_status,
                availability_status,
                ownership_type,
                flood_risk,
                notes,
                created_by,
            ),
        )
        row = cursor.fetchone()
    connection.commit()
    return row


def list_candidate_sites_for_study_area(
    connection: Connection,
    study_area_id: int,
) -> list[dict]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, study_area_id, name, ST_AsGeoJSON(location)::json AS location,
                   area_size_acres, land_use, suitability_status, availability_status,
                   ownership_type, flood_risk, notes, promoted_project_id, created_by, created_at
            FROM candidate_sites
            WHERE study_area_id = %s
            ORDER BY created_at ASC
            """,
            (study_area_id,),
        )
        return cursor.fetchall()


def get_candidate_site(connection: Connection, candidate_site_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, study_area_id, name, ST_AsGeoJSON(location)::json AS location,
                   area_size_acres, land_use, suitability_status, availability_status,
                   ownership_type, flood_risk, notes, promoted_project_id, created_by, created_at
            FROM candidate_sites
            WHERE id = %s
            """,
            (candidate_site_id,),
        )
        return cursor.fetchone()


def update_candidate_site(
    connection: Connection,
    candidate_site_id: int,
    updates: dict,
) -> dict | None:
    if not updates:
        return get_candidate_site(connection, candidate_site_id)

    assignments = []
    params = []
    for field, val in updates.items():
        if field == "location":
            assignments.append("location = ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)")
            params.append(json.dumps(val))
        else:
            assignments.append(f"{field} = %s")
            params.append(val)

    params.append(candidate_site_id)
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            UPDATE candidate_sites
            SET {', '.join(assignments)}
            WHERE id = %s
            RETURNING id, study_area_id, name, ST_AsGeoJSON(location)::json AS location,
                      area_size_acres, land_use, suitability_status, availability_status,
                      ownership_type, flood_risk, notes, promoted_project_id, created_by, created_at
            """,
            params,
        )
        row = cursor.fetchone()
    connection.commit()
    return row
