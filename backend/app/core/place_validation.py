import re
from fastapi import HTTPException, status
from app.core.cities import CITIES

LEGACY_CITIES = {c["slug"]: c["name"] for c in CITIES}
LEGACY_COORDS = {c["slug"]: (c["lat"], c["lng"]) for c in CITIES}
SLUG_REGEX = re.compile(r"^[a-z0-9-]{2,120}$")


def validate_place_data(values: dict, existing: dict | None = None) -> None:
    """Validate and normalize city slug, city_name, and coordinates."""
    # Check locked city after Planner invited stage
    if existing:
        current_stage = existing.get("stage")
        if current_stage not in ("Draft", "Planner invited"):
            if "city" in values and values["city"] is not None and values["city"] != existing.get("city"):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="City cannot be modified after the Planner invited stage.",
                )
            if "city_name" in values and values["city_name"] is not None and values["city_name"] != existing.get("city_name"):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="City cannot be modified after the Planner invited stage.",
                )

    city_slug = values.get("city")
    city_name = values.get("city_name")

    if city_slug is not None:
        city_slug_str = str(city_slug).strip().lower()
        if not SLUG_REGEX.match(city_slug_str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="City slug must match ^[a-z0-9-]{2,120}$.",
            )
        values["city"] = city_slug_str

        # If legacy slug and city_name not provided, backfill from legacy cities
        if not city_name and city_slug_str in LEGACY_CITIES:
            city_name = LEGACY_CITIES[city_slug_str]
            values["city_name"] = city_name
        elif not city_name:
            # Fallback title-cased slug if city_name was omitted
            city_name = city_slug_str.replace("-", " ").title()
            values["city_name"] = city_name

    if city_name is not None:
        cn_str = str(city_name).strip()
        if len(cn_str) < 2 or len(cn_str) > 150:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="City name must be between 2 and 150 characters.",
            )
        # Cannot be digits-only or lack alphabetic characters
        if cn_str.isdigit() or not re.search(r"[a-zA-Z\u0900-\u0D7F]", cn_str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="City name cannot consist solely of digits.",
            )
        values["city_name"] = cn_str

        # If city slug is not provided, generate from legacy map or name
        if not values.get("city"):
            for slug, name in LEGACY_CITIES.items():
                if name.lower() == cn_str.lower():
                    values["city"] = slug
                    break

    # Validate coordinates inside India
    lat = values.get("location_lat")
    lng = values.get("location_lng")

    # If coordinates are not provided but legacy city is selected, backfill default coords
    if lat is None and lng is None and values.get("city") in LEGACY_COORDS:
        def_lat, def_lng = LEGACY_COORDS[values["city"]]
        values["location_lat"] = def_lat
        values["location_lng"] = def_lng
        lat, lng = def_lat, def_lng

    if lat is not None:
        try:
            f_lat = float(lat)
        except (ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid latitude.")
        if not (6.0 <= f_lat <= 38.0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Latitude must be inside India (between 6.0 and 38.0).",
            )

    if lng is not None:
        try:
            f_lng = float(lng)
        except (ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid longitude.")
        if not (68.0 <= f_lng <= 98.0):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Longitude must be inside India (between 68.0 and 98.0).",
            )
