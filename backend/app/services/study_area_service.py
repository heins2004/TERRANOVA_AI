from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import study_area_repository
from app.schemas.study_areas import StudyAreaCreate


def _validate_polygon_geometry(geometry: dict) -> None:
    if not isinstance(geometry, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Boundary must be a GeoJSON object.",
        )
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if geom_type != "Polygon" or not isinstance(coordinates, list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Boundary must be a valid GeoJSON Polygon.",
        )
    if not coordinates or not isinstance(coordinates[0], list) or len(coordinates[0]) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Polygon boundary coordinates must have at least 4 positions for a closed ring.",
        )


def create_study_area(
    *,
    payload: StudyAreaCreate,
    created_by: int,
    connection: Connection,
) -> dict:
    _validate_polygon_geometry(payload.boundary)
    try:
        return study_area_repository.create_study_area(
            connection,
            name=payload.name,
            city=payload.city,
            boundary_geojson=payload.boundary,
            created_by=created_by,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create study area geometry: {exc}",
        ) from exc


def list_study_areas(*, connection: Connection) -> list[dict]:
    return study_area_repository.list_study_areas(connection)


def get_study_area(*, study_area_id: int, connection: Connection) -> dict:
    area = study_area_repository.get_study_area(connection, study_area_id)
    if not area:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study area not found.",
        )
    return area
