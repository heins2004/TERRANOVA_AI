import logging
import math
from psycopg import Connection

from app.repositories import osm_layer_repository
from app.services.proximity_service import query_overpass_bbox

logger = logging.getLogger(__name__)

GRID_SIZE = 0.01  # degrees (~1.1 km)
MAX_CELLS = 25  # Limit to 5x5 cells to prevent abusive queries when zoomed out
VALID_LAYER_TYPES = {"road", "school", "hospital"}


def quantize_coord(val: float) -> float:
    """Floor value to the nearest 0.01 grid boundary."""
    return round(math.floor(val / GRID_SIZE) * GRID_SIZE, 2)


def get_grid_cells_for_bbox(
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> list[str]:
    """Compute grid cell keys covering the given bounding box.

    Returns cell keys formatted as 'min_lat,min_lng,max_lat,max_lng'
    rounded to 2 decimal places.
    """
    start_lat = quantize_coord(min_lat)
    end_lat = quantize_coord(max_lat)
    start_lng = quantize_coord(min_lng)
    end_lng = quantize_coord(max_lng)

    lat_steps = int(round((end_lat - start_lat) / GRID_SIZE)) + 1
    lng_steps = int(round((end_lng - start_lng) / GRID_SIZE)) + 1

    total_cells = lat_steps * lng_steps
    if total_cells > MAX_CELLS:
        raise ValueError(
            f"Viewport area is too large ({total_cells} cells, max {MAX_CELLS}). "
            "Please zoom in to view reference layers."
        )

    cells: list[str] = []
    for i in range(lat_steps):
        c_min_lat = round(start_lat + i * GRID_SIZE, 2)
        c_max_lat = round(c_min_lat + GRID_SIZE, 2)
        for j in range(lng_steps):
            c_min_lng = round(start_lng + j * GRID_SIZE, 2)
            c_max_lng = round(c_min_lng + GRID_SIZE, 2)
            cells.append(f"{c_min_lat:.2f},{c_min_lng:.2f},{c_max_lat:.2f},{c_max_lng:.2f}")

    return cells


def parse_cell_key(cell_key: str) -> tuple[float, float, float, float]:
    """Extract (min_lat, min_lng, max_lat, max_lng) from cell key string."""
    parts = [float(p.strip()) for p in cell_key.split(",")]
    return parts[0], parts[1], parts[2], parts[3]


def get_layers_for_viewport(
    connection: Connection,
    *,
    min_lng: float,
    min_lat: float,
    max_lng: float,
    max_lat: float,
    layer_types: list[str],
) -> dict[str, dict]:
    """Retrieve OSM reference layers for a viewport, using Postgres cache and Overpass proxy.

    Args:
        connection: Active database connection.
        min_lng: Bounding box west.
        min_lat: Bounding box south.
        max_lng: Bounding box east.
        max_lat: Bounding box north.
        layer_types: Filter list of layer types ('road', 'school', 'hospital').

    Returns:
        dict mapping layer_type -> GeoJSON FeatureCollection dict
    """
    valid_types = [t for t in layer_types if t in VALID_LAYER_TYPES]
    if not valid_types:
        return {}

    # Normalize bounds
    b_min_lat = min(min_lat, max_lat)
    b_max_lat = max(min_lat, max_lat)
    b_min_lng = min(min_lng, max_lng)
    b_max_lng = max(min_lng, max_lng)

    cell_keys = get_grid_cells_for_bbox(b_min_lat, b_min_lng, b_max_lat, b_max_lng)
    results: dict[str, dict] = {}

    for layer_type in valid_types:
        # 1. Fetch cached cells from PostgreSQL
        cached = osm_layer_repository.get_cached_cells(
            connection, cell_keys, layer_type, max_age_days=30
        )

        # 2. Query Overpass for any missing cells in a single batched query per layer
        missing_keys = [k for k in cell_keys if k not in cached]
        if missing_keys:
            parsed_cells = [parse_cell_key(k) for k in missing_keys]
            m_min_lat = min(c[0] for c in parsed_cells)
            m_min_lng = min(c[1] for c in parsed_cells)
            m_max_lat = max(c[2] for c in parsed_cells)
            m_max_lng = max(c[3] for c in parsed_cells)

            logger.info(
                "Fetching %d missing Overpass cells in single query: layer_type=%s bbox=(%s,%s,%s,%s)",
                len(missing_keys), layer_type, m_min_lat, m_min_lng, m_max_lat, m_max_lng
            )
            batch_result = query_overpass_bbox(
                layer_type, m_min_lat, m_min_lng, m_max_lat, m_max_lng
            )
            raw_features = batch_result.get("features", [])

            # Distribute features to each grid cell and persist to Postgres
            for key in missing_keys:
                c_min_lat, c_min_lng, c_max_lat, c_max_lng = parse_cell_key(key)
                cell_feats = []
                for feat in raw_features:
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates")
                    g_type = geom.get("type")
                    if g_type == "Point" and coords:
                        if c_min_lng <= coords[0] <= c_max_lng and c_min_lat <= coords[1] <= c_max_lat:
                            cell_feats.append(feat)
                    elif g_type == "LineString" and coords:
                        if any(c_min_lng <= pt[0] <= c_max_lng and c_min_lat <= pt[1] <= c_max_lat for pt in coords):
                            cell_feats.append(feat)
                    elif g_type == "Polygon" and coords and coords[0]:
                        if any(c_min_lng <= pt[0] <= c_max_lng and c_min_lat <= pt[1] <= c_max_lat for pt in coords[0]):
                            cell_feats.append(feat)

                cell_geojson = {"type": "FeatureCollection", "features": cell_feats}
                try:
                    osm_layer_repository.upsert_cell(connection, key, layer_type, cell_geojson)
                except Exception as exc:
                    logger.error("Failed to cache cell %s: %s", key, exc)
                cached[key] = cell_geojson

        all_features: list[dict] = []
        seen_feature_ids: set[str] = set()

        for key in cell_keys:
            cell_geojson = cached.get(key, {"type": "FeatureCollection", "features": []})
            for feat in cell_geojson.get("features", []):
                fid = feat.get("id")
                if fid:
                    if fid in seen_feature_ids:
                        continue
                    seen_feature_ids.add(fid)
                all_features.append(feat)

        results[layer_type] = {
            "type": "FeatureCollection",
            "features": all_features,
        }

    return results
