from fastapi import APIRouter, Depends, HTTPException, Query, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.services import osm_layer_service

ALL_AUTHENTICATED_ROLES = ("Citizen", "Urban Planner", "Government Official", "Administrator")

router = APIRouter(tags=["osm-layers"])


def _handle_osm_layers(
    bbox: str = Query(
        ...,
        description="Bounding box in minLng,minLat,maxLng,maxLat format",
        examples=["77.58,12.96,77.59,12.97"],
    ),
    types: str = Query(
        "road,school,hospital",
        description="Comma-separated list of layer types to fetch",
    ),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*ALL_AUTHENTICATED_ROLES)),
) -> dict:
    parts = bbox.split(",")
    if len(parts) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bbox must be in format 'minLng,minLat,maxLng,maxLat'",
        )

    try:
        min_lng = float(parts[0].strip())
        min_lat = float(parts[1].strip())
        max_lng = float(parts[2].strip())
        max_lat = float(parts[3].strip())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinates in bbox must be valid floating point numbers",
        )

    layer_types = [t.strip().lower() for t in types.split(",") if t.strip()]
    if not layer_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one layer type must be provided in 'types'",
        )

    try:
        layers = osm_layer_service.get_layers_for_viewport(
            connection,
            min_lng=min_lng,
            min_lat=min_lat,
            max_lng=max_lng,
            max_lat=max_lat,
            layer_types=layer_types,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return {"layers": layers}


@router.get("/api/osm-layers")
def get_osm_layers(
    bbox: str = Query(...),
    types: str = Query("road,school,hospital"),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*ALL_AUTHENTICATED_ROLES)),
) -> dict:
    return _handle_osm_layers(bbox=bbox, types=types, connection=connection, user=user)
