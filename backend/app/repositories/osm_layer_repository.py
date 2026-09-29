import json
from psycopg import Connection


def get_cached_cells(
    connection: Connection,
    cell_keys: list[str],
    layer_type: str,
    max_age_days: int = 30,
) -> dict[str, dict]:
    """Retrieve non-stale cached GeoJSON feature collections for specified grid cell keys and layer type.

    Returns:
        dict mapping grid_cell_key -> geojson FeatureCollection dict
    """
    if not cell_keys:
        return {}

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT grid_cell_key, geojson
            FROM osm_layer_cache
            WHERE grid_cell_key = ANY(%s)
              AND layer_type = %s
              AND fetched_at >= NOW() - (%s || ' days')::INTERVAL
            """,
            (cell_keys, layer_type, str(max_age_days)),
        )
        rows = cursor.fetchall()
        result = {}
        for row in rows:
            data = row["geojson"]
            if isinstance(data, str):
                data = json.loads(data)
            result[row["grid_cell_key"]] = data
        return result


def upsert_cell(
    connection: Connection,
    cell_key: str,
    layer_type: str,
    geojson: dict,
) -> None:
    """Insert or update cached GeoJSON for a grid cell."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO osm_layer_cache (grid_cell_key, layer_type, geojson, fetched_at)
            VALUES (%s, %s, %s::jsonb, NOW())
            ON CONFLICT (grid_cell_key, layer_type)
            DO UPDATE SET
                geojson = EXCLUDED.geojson,
                fetched_at = NOW()
            """,
            (cell_key, layer_type, json.dumps(geojson)),
        )
    connection.commit()
