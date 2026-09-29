"""Extended candidate site service for Phase 2:
- Status field validation + partial update
- Site detail with proximity data
- Promote-to-project action
"""

from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import candidate_site_repository, study_area_repository, project_repository
from app.schemas.candidate_sites import CandidateSiteCreate, CandidateSiteUpdate
from app.services import proximity_service


# ---------------------------------------------------------------------------
# Confirmed valid value sets for each status field (enforced in service layer;
# DB columns are free-text VARCHAR so the DB itself does not constrain them).
# ---------------------------------------------------------------------------
VALID_STATUS_VALUES: dict[str, list[str]] = {
    "suitability_status": [
        "RequiresReview",
        "Suitable",
        "Unsuitable",
        "ConditionallyApproved",
        "Promoted",  # Set automatically when promoting to project
    ],
    "availability_status": [
        "VerificationRequired",
        "Available",
        "Unavailable",
        "UnderNegotiation",
    ],
    "ownership_type": [
        "Unknown",
        "Government",
        "Private",
        "Mixed",
    ],
    "flood_risk": [
        "Unknown",
        "Low",
        "Medium",
        "High",
        "VeryHigh",
    ],
}

STATUS_FIELDS = set(VALID_STATUS_VALUES.keys())


def _validate_point_geometry(geometry: dict) -> None:
    if not isinstance(geometry, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location must be a GeoJSON object.",
        )
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geom_type != "Point" or not isinstance(coordinates, list) or len(coordinates) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location must be a valid GeoJSON Point with [longitude, latitude] coordinates.",
        )


def create_candidate_site(
    *,
    study_area_id: int,
    payload: CandidateSiteCreate,
    created_by: int,
    connection: Connection,
) -> dict:
    study_area = study_area_repository.get_study_area(connection, study_area_id)
    if not study_area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study area not found.",
        )

    _validate_point_geometry(payload.location)
    values = payload.model_dump()
    location_geojson = values.pop("location")
    try:
        return candidate_site_repository.create_candidate_site(
            connection,
            study_area_id=study_area_id,
            location_geojson=location_geojson,
            created_by=created_by,
            **values,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create candidate site geometry: {exc}",
        ) from exc


def list_candidate_sites_for_study_area(
    *,
    study_area_id: int,
    connection: Connection,
) -> list[dict]:
    study_area = study_area_repository.get_study_area(connection, study_area_id)
    if not study_area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study area not found.",
        )
    return candidate_site_repository.list_candidate_sites_for_study_area(
        connection,
        study_area_id=study_area_id,
    )


def get_candidate_site(
    *,
    candidate_site_id: int,
    connection: Connection,
) -> dict:
    site = candidate_site_repository.get_candidate_site(connection, candidate_site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )
    return site


def get_site_detail(
    *,
    candidate_site_id: int,
    connection: Connection,
) -> dict:
    """Return full site info including proximity data (computed if stale)."""
    site = candidate_site_repository.get_candidate_site(connection, candidate_site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )

    # GeoJSON Point: coordinates = [longitude, latitude]
    coords = site["location"]["coordinates"]
    lng, lat = coords[0], coords[1]

    proximity = proximity_service.get_proximity_for_site(
        connection,
        candidate_site_id=candidate_site_id,
        lat=lat,
        lng=lng,
    )

    return {**site, "proximity": proximity}


def update_status(
    *,
    candidate_site_id: int,
    fields: dict,
    connection: Connection,
) -> dict:
    """Validate and apply a partial update to status fields only.

    `fields` is a dict of field_name → value drawn from the request body.
    Only keys present in STATUS_FIELDS are accepted.
    """
    # Filter to only status fields
    status_updates = {k: v for k, v in fields.items() if k in STATUS_FIELDS}
    unknown = set(fields.keys()) - STATUS_FIELDS
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown status fields: {sorted(unknown)}. Allowed: {sorted(STATUS_FIELDS)}",
        )
    if not status_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No status fields provided.",
        )

    # Validate each value
    for field, value in status_updates.items():
        allowed = VALID_STATUS_VALUES[field]
        if value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid value '{value}' for '{field}'. Allowed: {allowed}",
            )

    site = candidate_site_repository.update_candidate_site(
        connection, candidate_site_id, status_updates
    )
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )
    return site


def refresh_proximity(
    *,
    candidate_site_id: int,
    connection: Connection,
) -> list[dict]:
    """Force-recompute proximity data regardless of cache age."""
    site = candidate_site_repository.get_candidate_site(connection, candidate_site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )

    coords = site["location"]["coordinates"]
    lng, lat = coords[0], coords[1]

    return proximity_service.get_proximity_for_site(
        connection,
        candidate_site_id=candidate_site_id,
        lat=lat,
        lng=lng,
        force_refresh=True,
    )


def promote_to_project(
    *,
    candidate_site_id: int,
    project_fields: dict,
    created_by: int,
    connection: Connection,
) -> dict:
    """Convert a candidate site into a Project record.

    Copies: name (→ title), city, location (GeoJSON [lng,lat] → lat/lng).
    Sets candidate site's suitability_status = 'Promoted'.
    Returns the new project dict.

    GeoJSON coordinate note: coordinates = [longitude, latitude].
    Leaflet/project model uses lat/lng separately — the conversion is explicit below.
    """
    site = candidate_site_repository.get_candidate_site(connection, candidate_site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )

    if site.get("promoted_project_id"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This candidate site has already been promoted to a project.",
        )

    # GeoJSON [lng, lat] → lat, lng  (explicit conversion boundary)
    coords = site["location"]["coordinates"]
    site_lng: float = coords[0]
    site_lat: float = coords[1]

    title = project_fields.get("title") or site["name"]
    city = project_fields.get("city") or site.get("city")  # site has no city — may be None
    description = project_fields.get("description")
    category = project_fields.get("category")

    new_project = project_repository.create_from_candidate_site(
        connection,
        created_by=created_by,
        candidate_site_id=candidate_site_id,
        title=title,
        city=city,
        location_lat=site_lat,   # lat from GeoJSON[1]
        location_lng=site_lng,   # lng from GeoJSON[0]
        description=description,
        category=category,
    )

    # Mark the candidate site as promoted
    candidate_site_repository.update_candidate_site(
        connection,
        candidate_site_id,
        {
            "suitability_status": "Promoted",
            "promoted_project_id": new_project["id"],
        },
    )

    return new_project


def update_candidate_site(
    *,
    candidate_site_id: int,
    payload: CandidateSiteUpdate,
    connection: Connection,
) -> dict:
    values = payload.model_dump(exclude_unset=True)
    if "location" in values and values["location"] is not None:
        _validate_point_geometry(values["location"])
    site = candidate_site_repository.update_candidate_site(
        connection,
        candidate_site_id,
        values,
    )
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate site not found.",
        )
    return site
