from psycopg import Connection

FIELDS = ("project_id", "name", "asset_type", "condition", "city", "location_lat", "location_lng", "last_inspected_at")


def create_infrastructure_asset(connection: Connection, **values: object) -> dict:
    columns = ", ".join(FIELDS); placeholders = ", ".join(["%s"] * len(FIELDS))
    with connection.cursor() as cursor:
        cursor.execute(f"INSERT INTO infrastructure_assets ({columns}) VALUES ({placeholders}) RETURNING *", [values.get(field) for field in FIELDS])
        row = cursor.fetchone()
    connection.commit(); return row


def get_infrastructure_asset_by_id(connection: Connection, asset_id: int) -> dict | None:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM infrastructure_assets WHERE id = %s", (asset_id,))
        return cursor.fetchone()


def list_infrastructure_assets(connection: Connection, *, condition: str | None = None, project_id: int | None = None, city: str | None = None) -> list[dict]:
    clauses, params = [], []
    if condition: clauses.append("condition = %s"); params.append(condition)
    if project_id is not None: clauses.append("project_id = %s"); params.append(project_id)
    if city: clauses.append("city = %s"); params.append(city)
    where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM infrastructure_assets{where} ORDER BY created_at DESC", params)
        return cursor.fetchall()


def update_infrastructure_asset(connection: Connection, asset_id: int, values: dict) -> dict | None:
    if not values: return get_infrastructure_asset_by_id(connection, asset_id)
    assignments = ", ".join(f"{field} = %s" for field in values)
    with connection.cursor() as cursor:
        cursor.execute(f"UPDATE infrastructure_assets SET {assignments} WHERE id = %s RETURNING *", (*values.values(), asset_id))
        row = cursor.fetchone()
    connection.commit(); return row


def delete_infrastructure_asset(connection: Connection, asset_id: int) -> bool:
    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM infrastructure_assets WHERE id = %s", (asset_id,))
        deleted = cursor.rowcount > 0
    connection.commit(); return deleted
