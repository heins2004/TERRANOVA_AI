from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import project_repository
from app.core.place_validation import validate_place_data
from app.schemas.auth import UserResponse
from app.schemas.projects import (
    ProjectCreate,
    ProjectUpdate,
)
from app.services import project_date_rules


def _not_found(resource: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} not found.")


def _validate_coordinate_pair(values: dict) -> None:
    has_latitude = "location_lat" in values
    has_longitude = "location_lng" in values
    if has_latitude != has_longitude:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Latitude and longitude must be provided together.")
    if has_latitude and ((values["location_lat"] is None) != (values["location_lng"] is None)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Latitude and longitude must be provided together.")


def create_project(*, payload: ProjectCreate, created_by: int, connection: Connection) -> dict:
    values = payload.model_dump()
    validate_place_data(values)
    _validate_coordinate_pair(values)
    project_date_rules.validate_create_dates(values)
    return project_repository.create_project(connection, created_by=created_by, **values)


def get_project(*, project_id: int, connection: Connection) -> dict:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project: _not_found("Project")
    return project


def list_projects(*, connection: Connection, status_filter: str | None, category: str | None, city: str | None) -> list[dict]:
    return project_repository.list_projects(connection, status=status_filter, category=category, city=city)


def update_project(
    *,
    project_id: int,
    payload: ProjectUpdate,
    connection: Connection,
    user: UserResponse | None = None,
    existing: dict | None = None,
) -> dict:
    if existing is None:
        existing = project_repository.get_project_by_id(connection, project_id)
        if not existing:
            _not_found("Project")

    values = payload.model_dump(exclude_unset=True)
    validate_place_data(values, existing)
    _validate_coordinate_pair(values)
    project_date_rules.validate_update_dates(values, existing)

    area_keys = {"site_area_lat", "site_area_lng", "site_area_radius_km"}
    if area_keys.intersection(values):
        # 1. Only owning official can set them
        if not user or user.role != "Government Official" or existing.get("created_by") != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owning official can set or modify the site area.",
            )

        # 2. Only in Draft and Planner invited. In every other stage return 409
        if existing.get("stage") not in ("Draft", "Planner invited"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Site area can only be modified in Draft or Planner invited stages (current stage is '{existing.get('stage')}').",
            )

        # 3. Do not allow clearing the area once a planner is invited
        is_clearing = values.get("site_area_lat") is None or values.get("site_area_radius_km") is None
        if existing.get("stage") == "Planner invited" and is_clearing:
            if existing.get("site_area_lat") is not None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Cannot clear the site area once a planner has been invited.",
                )

    project = project_repository.update_project(connection, project_id, values)
    if not project:
        _not_found("Project")
    return project


def delete_project(*, project_id: int, connection: Connection) -> None:
    if not project_repository.delete_project(connection, project_id): _not_found("Project")


