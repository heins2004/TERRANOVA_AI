from typing import Any
from fastapi import HTTPException, status

from app.core.place_validation import validate_place_data
from app.schemas.site_changes import SiteChangeRequestCreate


def validate_site_change_request(
    project: dict[str, Any],
    payload: SiteChangeRequestCreate,
) -> tuple[str | None, str | None]:
    """
    Validate site change request:
    - If the project has no stored circle, circle is required.
    - If city or city_name is provided, validate like project creation.
    Returns (normalized_city, normalized_city_name).
    """
    has_project_circle = (
        project.get("site_area_lat") is not None
        and project.get("site_area_lng") is not None
        and project.get("site_area_radius_km") is not None
    )
    has_new_circle = (
        payload.circle_lat is not None
        and payload.circle_lng is not None
        and payload.circle_radius_km is not None
    )

    if not has_project_circle and not has_new_circle:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A circular site area (centre and radius) is required because this project has no existing site area.",
        )

    norm_city = payload.city
    norm_city_name = payload.city_name

    if norm_city is not None or norm_city_name is not None:
        place_data: dict[str, Any] = {}
        if norm_city is not None:
            place_data["city"] = norm_city
        if norm_city_name is not None:
            place_data["city_name"] = norm_city_name
        # validate using project creation rules (without stage lock check)
        validate_place_data(place_data, existing=None)
        norm_city = place_data.get("city")
        norm_city_name = place_data.get("city_name")

    return norm_city, norm_city_name
