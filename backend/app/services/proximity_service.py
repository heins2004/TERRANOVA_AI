"""Proximity service — queries the Overpass API for amenities near a given point.

This module is intentionally self-contained so Phase 3 can import
`query_overpass_amenities` directly without re-implementing the Overpass logic.
"""

import math
import urllib.request
import json
import logging
from datetime import datetime, timedelta, timezone
from psycopg import Connection

from app.repositories import candidate_site_proximity_repository

logger = logging.getLogger(__name__)

_OVERPASS_URL = "https://overpass-api.de/api/interpreter"
_RADIUS_METERS = 2000
_CACHE_TTL_DAYS = 30

# Amenity types to query and how they map to Overpass tags
_AMENITY_QUERIES: list[dict] = [
    {
        "type": "hospital",
        "overpass_filter": '["amenity"~"^(hospital|clinic|doctors)$"]',
    },
    {
        "type": "school",
        "overpass_filter": '["amenity"~"^(school|college|university)$"]',
    },
    {
        "type": "road",
        # Nearest highway of any significant type within the radius
        "overpass_filter": '["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"]',
        "element": "way",
    },
]
_MAX_RESULTS_PER_TYPE = 5


def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return approximate distance in metres between two WGS84 points."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def query_overpass_amenities(lat: float, lng: float) -> list[dict]:
    """Query Overpass API for amenities near (lat, lng) within the configured radius.

    Returns a list of dicts with keys: amenity_type, name (nullable), distance_meters.
    Raises on network/parse errors — callers should handle exceptions gracefully.

    Reusable by Phase 3: import this function directly rather than re-implementing.
    """
    results: list[dict] = []

    for spec in _AMENITY_QUERIES:
        element_type = spec.get("element", "node")
        amenity_filter = spec["overpass_filter"]
        amenity_type = spec["type"]

        # Build QL query — union of node and way for hospitals/schools, way only for roads
        if element_type == "way":
            ql = f"""
[out:json][timeout:10];
way(around:{_RADIUS_METERS},{lat},{lng}){amenity_filter};
out center {_MAX_RESULTS_PER_TYPE};
"""
        else:
            ql = f"""
[out:json][timeout:10];
(
  node(around:{_RADIUS_METERS},{lat},{lng}){amenity_filter};
  way(around:{_RADIUS_METERS},{lat},{lng}){amenity_filter};
);
out center {_MAX_RESULTS_PER_TYPE};
"""

        try:
            data = ql.encode("utf-8")
            req = urllib.request.Request(
                _OVERPASS_URL,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "TERRANOVA-AI/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            logger.warning("Overpass query failed for type=%s: %s", amenity_type, exc)
            continue

        elements = payload.get("elements", [])
        for element in elements[:_MAX_RESULTS_PER_TYPE]:
            name = element.get("tags", {}).get("name") or element.get("tags", {}).get("ref")
            # Use center coords for ways; direct lat/lng for nodes
            if "center" in element:
                elem_lat = element["center"]["lat"]
                elem_lng = element["center"]["lon"]
            else:
                elem_lat = element.get("lat")
                elem_lng = element.get("lon")

            if elem_lat is None or elem_lng is None:
                continue

            dist = _haversine_meters(lat, lng, elem_lat, elem_lng)
            results.append(
                {
                    "amenity_type": amenity_type,
                    "name": name,
                    "distance_meters": round(dist, 1),
                }
            )

    # Sort by amenity_type then distance
    results.sort(key=lambda r: (r["amenity_type"], r["distance_meters"]))
    return results


def query_overpass_bbox(
    layer_type: str,
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> dict:
    """Query Overpass API for features within a bounding box, returning a GeoJSON FeatureCollection.

    Args:
        layer_type: One of 'road', 'school', 'hospital'.
        min_lat: Minimum latitude (south).
        min_lng: Minimum longitude (west).
        max_lat: Maximum latitude (north).
        max_lng: Maximum longitude (east).

    Returns:
        GeoJSON FeatureCollection dict:
        {"type": "FeatureCollection", "features": [...]}
    """
    if layer_type == "road":
        ql = f"""
[out:json][timeout:10];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]({min_lat},{min_lng},{max_lat},{max_lng});
);
out geom;
"""
    elif layer_type == "school":
        ql = f"""
[out:json][timeout:10];
(
  node["amenity"~"^(school|college|university)$"]({min_lat},{min_lng},{max_lat},{max_lng});
  way["amenity"~"^(school|college|university)$"]({min_lat},{min_lng},{max_lat},{max_lng});
);
out center;
"""
    elif layer_type == "hospital":
        ql = f"""
[out:json][timeout:10];
(
  node["amenity"~"^(hospital|clinic|doctors)$"]({min_lat},{min_lng},{max_lat},{max_lng});
  way["amenity"~"^(hospital|clinic|doctors)$"]({min_lat},{min_lng},{max_lat},{max_lng});
);
out center;
"""
    else:
        raise ValueError(f"Unsupported layer_type: {layer_type}")

    _ENDPOINTS = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]

    payload = None
    data = ql.encode("utf-8")
    for endpoint in _ENDPOINTS:
        try:
            req = urllib.request.Request(
                endpoint,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "TERRANOVA-AI/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))
                break
        except Exception as exc:
            logger.warning(
                "Overpass bbox query failed on %s for layer_type=%s bbox=(%s,%s,%s,%s): %s",
                endpoint, layer_type, min_lat, min_lng, max_lat, max_lng, exc
            )

    if not payload:
        return {"type": "FeatureCollection", "features": []}

    features = []
    elements = payload.get("elements", [])

    for element in elements:
        tags = element.get("tags", {})
        elem_id = element.get("id")
        elem_type = element.get("type", "feature")

        if layer_type == "road":
            geom_points = element.get("geometry", [])
            coords = [
                [pt["lon"], pt["lat"]]
                for pt in geom_points
                if "lat" in pt and "lon" in pt
            ]
            if len(coords) < 2:
                continue
            features.append({
                "type": "Feature",
                "id": f"{elem_type}/{elem_id}",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords,
                },
                "properties": {
                    "id": elem_id,
                    "name": tags.get("name") or tags.get("ref") or "",
                    "highway": tags.get("highway", "road"),
                    "layer_type": "road",
                },
            })
        else:
            # school or hospital
            if "center" in element:
                pt_lat = element["center"].get("lat")
                pt_lon = element["center"].get("lon")
            else:
                pt_lat = element.get("lat")
                pt_lon = element.get("lon")

            if pt_lat is None or pt_lon is None:
                continue

            default_name = "School" if layer_type == "school" else "Hospital"
            features.append({
                "type": "Feature",
                "id": f"{elem_type}/{elem_id}",
                "geometry": {
                    "type": "Point",
                    "coordinates": [pt_lon, pt_lat],
                },
                "properties": {
                    "id": elem_id,
                    "name": tags.get("name") or default_name,
                    "amenity": tags.get("amenity", layer_type),
                    "layer_type": layer_type,
                },
            })

    return {"type": "FeatureCollection", "features": features}



def _is_cache_stale(rows: list[dict]) -> bool:
    """Return True if the cache is missing or older than TTL."""
    if not rows:
        return True
    # All rows for the same site share the same computed_at batch
    latest: datetime = max(r["computed_at"] for r in rows)
    if latest.tzinfo is None:
        latest = latest.replace(tzinfo=timezone.utc)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=_CACHE_TTL_DAYS)
    return latest < cutoff


def get_proximity_for_site(
    connection: Connection,
    *,
    candidate_site_id: int,
    lat: float,
    lng: float,
    force_refresh: bool = False,
) -> list[dict]:
    """Return proximity data for a candidate site, computing it if stale or forced.

    Args:
        candidate_site_id: The site to look up / cache for.
        lat: Site latitude (WGS84).
        lng: Site longitude (WGS84).
        force_refresh: Skip the cache check and recompute unconditionally.

    Returns:
        List of proximity dicts (amenity_type, name, distance_meters, computed_at).
        Returns an empty list if the Overpass query fails — callers should handle this gracefully.
    """
    cached = candidate_site_proximity_repository.get_cached(connection, candidate_site_id)

    if not force_refresh and not _is_cache_stale(cached):
        return cached

    try:
        fresh = query_overpass_amenities(lat, lng)
    except Exception as exc:
        logger.error("Failed to compute proximity for site %d: %s", candidate_site_id, exc)
        # Return stale cache rather than crashing, if available
        return cached

    return candidate_site_proximity_repository.replace_all(connection, candidate_site_id, fresh)
