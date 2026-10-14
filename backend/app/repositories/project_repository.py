from psycopg import Connection


FIELDS = (
    "title", "description", "status", "category", "city",
    "location_lat", "location_lng", "budget", "start_date", "end_date",
    "candidate_site_id", "stage", "planner_id", "planner_deadline",
    "site_area_lat", "site_area_lng", "site_area_radius_km",
)


def create_project(connection: Connection, *, created_by: int, **values: object) -> dict:
    columns = ", ".join((*FIELDS, "created_by"))
    placeholders = ", ".join(["%s"] * (len(FIELDS) + 1))
    with connection.cursor() as cursor:
        cursor.execute(f"INSERT INTO projects ({columns}) VALUES ({placeholders}) RETURNING *", (*[values.get(field) for field in FIELDS], created_by))
        row = cursor.fetchone()
    connection.commit()
    return row


def create_from_candidate_site(
    connection: Connection,
    *,
    created_by: int,
    candidate_site_id: int,
    title: str,
    city: str | None,
    # GeoJSON Point coordinates are [lng, lat] — caller must pass already-converted lat/lng
    location_lat: float | None,
    location_lng: float | None,
    description: str | None = None,
    status: str = "Proposed",
    category: str | None = None,
    budget: object = None,
    start_date: object = None,
    end_date: object = None,
) -> dict:
    """Create a project row linked back to the originating candidate site."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO projects (
                title, description, status, category, city,
                location_lat, location_lng, budget, start_date, end_date,
                candidate_site_id, created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                title, description, status, category, city,
                location_lat, location_lng, budget, start_date, end_date,
                candidate_site_id, created_by,
            ),
        )
        row = cursor.fetchone()
    connection.commit()
    return row



def get_project_by_id(connection: Connection, project_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
        return cursor.fetchone()


def list_projects(connection: Connection, *, status: str | None = None, category: str | None = None, city: str | None = None) -> list[dict]:
    clauses, params = [], []
    if status:
        clauses.append("status = %s"); params.append(status)
    if category:
        clauses.append("category = %s"); params.append(category)
    if city:
        clauses.append("city = %s"); params.append(city)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM projects{where} ORDER BY created_at DESC", params)
        return cursor.fetchall()


def update_project(connection: Connection, project_id: int, values: dict) -> dict | None:
    assignments = [f"{field} = %s" for field in values]
    if not assignments:
        return get_project_by_id(connection, project_id)
    with connection.cursor() as cursor:
        cursor.execute(f"UPDATE projects SET {', '.join(assignments)}, updated_at = NOW() WHERE id = %s RETURNING *", (*values.values(), project_id))
        row = cursor.fetchone()
    connection.commit()
    return row


def delete_project(connection: Connection, project_id: int) -> bool:
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
        deleted = cursor.rowcount > 0
    connection.commit()
    return deleted
