from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.database.connection import get_connection
from app.services.osm_layer_service import (
    get_grid_cells_for_bbox,
    parse_cell_key,
    MAX_CELLS,
)
from app.repositories import osm_layer_repository
from app.core.security import hash_password, create_session_token

client = TestClient(app)


def test_quantization_logic():
    # Exactly one cell
    cells = get_grid_cells_for_bbox(12.962, 77.581, 12.968, 77.589)
    assert cells == ["12.96,77.58,12.97,77.59"]

    # Parsing the key
    lat_min, lng_min, lat_max, lng_max = parse_cell_key(cells[0])
    assert lat_min == 12.96
    assert lng_min == 77.58
    assert lat_max == 12.97
    assert lng_max == 77.59

    # Viewport exceeding max cells raises ValueError
    with pytest.raises(ValueError, match="too large"):
        get_grid_cells_for_bbox(10.0, 70.0, 20.0, 80.0)


def test_repository_cache_and_ttl():
    test_key = "99.00,99.00,99.01,99.01"
    sample_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "node/1",
                "geometry": {"type": "Point", "coordinates": [99.005, 99.005]},
                "properties": {"name": "Test School", "layer_type": "school"},
            }
        ],
    }

    with get_connection() as conn:
        # Upsert cell
        osm_layer_repository.upsert_cell(conn, test_key, "school", sample_geojson)

        # Retrieve cell
        cached = osm_layer_repository.get_cached_cells(conn, [test_key], "school")
        assert test_key in cached
        assert len(cached[test_key]["features"]) == 1
        assert cached[test_key]["features"][0]["properties"]["name"] == "Test School"


def test_osm_layers_unauthenticated():
    res = client.get("/api/osm-layers?bbox=77.58,12.96,77.59,12.97&types=school")
    assert res.status_code == 401

    # /api/v1/osm-layers route was removed, returns 404
    res_removed = client.get("/api/v1/osm-layers?bbox=77.58,12.96,77.59,12.97&types=school")
    assert res_removed.status_code == 404


def test_osm_layers_authenticated_citizen_and_planner():
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Create a test citizen and planner if not existing
            pwd = hash_password("TestPass123!")

            # 1. Citizen
            cur.execute("SELECT id FROM users WHERE email = %s", ("test_citizen_osm@test.com",))
            row = cur.fetchone()
            if row:
                citizen_id = row["id"]
            else:
                cur.execute(
                    "INSERT INTO users (full_name, email, role, password_hash) VALUES (%s, %s, %s, %s) RETURNING id",
                    ("Citizen Test", "test_citizen_osm@test.com", "Citizen", pwd),
                )
                citizen_id = cur.fetchone()["id"]

            citizen_token = create_session_token()
            cur.execute(
                "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                (citizen_id, citizen_token, datetime.now(timezone.utc) + timedelta(days=1)),
            )

            # 2. Urban Planner
            cur.execute("SELECT id FROM users WHERE email = %s", ("test_planner_osm@test.com",))
            row = cur.fetchone()
            if row:
                planner_id = row["id"]
            else:
                cur.execute(
                    "INSERT INTO users (full_name, email, role, password_hash) VALUES (%s, %s, %s, %s) RETURNING id",
                    ("Planner Test", "test_planner_osm@test.com", "Urban Planner", pwd),
                )
                planner_id = cur.fetchone()["id"]

            planner_token = create_session_token()
            cur.execute(
                "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                (planner_id, planner_token, datetime.now(timezone.utc) + timedelta(days=1)),
            )
        conn.commit()

    # Pre-cache a cell for this test bbox so we test the cached flow without needing an external network call
    pre_key = "12.96,77.58,12.97,77.59"
    pre_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": "node/999",
                "geometry": {"type": "Point", "coordinates": [77.585, 12.965]},
                "properties": {"name": "Cached Test Hospital", "layer_type": "hospital"},
            }
        ],
    }
    with get_connection() as conn:
        osm_layer_repository.upsert_cell(conn, pre_key, "hospital", pre_geojson)

    from app.core.config import get_settings
    cookie_name = get_settings().session_cookie_name

    # Citizen accessing endpoint with session cookie
    client.cookies.set(cookie_name, citizen_token)
    res_citizen = client.get("/api/osm-layers?bbox=77.58,12.96,77.59,12.97&types=hospital")
    assert res_citizen.status_code == 200, res_citizen.text
    data = res_citizen.json()
    assert "layers" in data
    assert "hospital" in data["layers"]
    features = data["layers"]["hospital"]["features"]
    assert any(f["properties"]["name"] == "Cached Test Hospital" for f in features)

    # Planner accessing endpoint
    client.cookies.set(cookie_name, planner_token)
    res_planner = client.get("/api/osm-layers?bbox=77.58,12.96,77.59,12.97&types=hospital")
    assert res_planner.status_code == 200
    data_planner = res_planner.json()
    assert "hospital" in data_planner["layers"]

    # Viewport too large error test (400)
    res_large = client.get("/api/osm-layers?bbox=70.0,10.0,80.0,20.0&types=hospital")
    assert res_large.status_code == 400
    assert "too large" in res_large.json()["detail"]

    # Invalid bbox format error test (400)
    res_bad = client.get("/api/osm-layers?bbox=invalid,bbox&types=hospital")
    assert res_bad.status_code == 400
