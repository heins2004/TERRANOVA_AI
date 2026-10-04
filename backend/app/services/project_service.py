from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import project_repository
from app.core.cities import CITY_SLUGS
from app.schemas.projects import (
    ProjectCreate,
    ProjectUpdate,
)


def _not_found(resource: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} not found.")


def _validate_coordinate_pair(values: dict) -> None:
    has_latitude = "location_lat" in values
    has_longitude = "location_lng" in values
    if has_latitude != has_longitude:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Latitude and longitude must be provided together.")
    if has_latitude and ((values["location_lat"] is None) != (values["location_lng"] is None)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Latitude and longitude must be provided together.")


def _validate_city(values: dict) -> None:
    if "city" in values and values["city"] not in CITY_SLUGS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="City must be a supported city slug.")


def create_project(*, payload: ProjectCreate, created_by: int, connection: Connection) -> dict:
    values = payload.model_dump()
    _validate_city(values)
    _validate_coordinate_pair(values)
    return project_repository.create_project(connection, created_by=created_by, **values)


def get_project(*, project_id: int, connection: Connection) -> dict:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project: _not_found("Project")
    return project


def list_projects(*, connection: Connection, status_filter: str | None, category: str | None, city: str | None) -> list[dict]:
    return project_repository.list_projects(connection, status=status_filter, category=category, city=city)


def update_project(*, project_id: int, payload: ProjectUpdate, connection: Connection) -> dict:
    values = payload.model_dump(exclude_unset=True)
    _validate_city(values)
    _validate_coordinate_pair(values)
    project = project_repository.update_project(connection, project_id, values)
    if not project: _not_found("Project")
    return project


def delete_project(*, project_id: int, connection: Connection) -> None:
    if not project_repository.delete_project(connection, project_id): _not_found("Project")


