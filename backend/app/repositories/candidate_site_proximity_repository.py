from psycopg import Connection


def get_cached(connection: Connection, candidate_site_id: int) -> list[dict]:
    """Return all cached proximity rows for a given candidate site."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, candidate_site_id, amenity_type, name, distance_meters, computed_at
            FROM candidate_site_proximity
            WHERE candidate_site_id = %s
            ORDER BY amenity_type, distance_meters
            """,
            (candidate_site_id,),
        )
        return cursor.fetchall()


def replace_all(
    connection: Connection,
    candidate_site_id: int,
    results: list[dict],
) -> list[dict]:
    """Delete existing proximity rows for this site and insert fresh ones.

    Each dict in `results` must have keys: amenity_type, name (nullable), distance_meters.
    Returns the newly inserted rows.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM candidate_site_proximity WHERE candidate_site_id = %s",
            (candidate_site_id,),
        )
        if results:
            cursor.executemany(
                """
                INSERT INTO candidate_site_proximity (candidate_site_id, amenity_type, name, distance_meters)
                VALUES (%s, %s, %s, %s)
                """,
                [
                    (
                        candidate_site_id,
                        row["amenity_type"],
                        row.get("name"),
                        row["distance_meters"],
                    )
                    for row in results
                ],
            )
    connection.commit()
    return get_cached(connection, candidate_site_id)
