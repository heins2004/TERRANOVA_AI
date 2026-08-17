from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import infrastructure_repository, project_repository
from app.schemas.projects import (
    InfrastructureAssetCreate,
    InfrastructureAssetUpdate,
    ProjectCreate,
    ProjectUpdate,
)


def _not_found(resource: str) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} not found.")


def create_project(*, payload: ProjectCreate, created_by: int, connection: Connection) -> dict:
    return project_repository.create_project(connection, created_by=created_by, **payload.model_dump())


def get_project(*, project_id: int, connection: Connection) -> dict:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project: _not_found("Project")
    return project


def list_projects(*, connection: Connection, status_filter: str | None, category: str | None) -> list[dict]:
    return project_repository.list_projects(connection, status=status_filter, category=category)


def update_project(*, project_id: int, payload: ProjectUpdate, connection: Connection) -> dict:
    project = project_repository.update_project(connection, project_id, payload.model_dump(exclude_unset=True))
    if not project: _not_found("Project")
    return project


def delete_project(*, project_id: int, connection: Connection) -> None:
    if not project_repository.delete_project(connection, project_id): _not_found("Project")


def create_infrastructure_asset(*, payload: InfrastructureAssetCreate, connection: Connection) -> dict:
    return infrastructure_repository.create_infrastructure_asset(connection, **payload.model_dump())


def get_infrastructure_asset(*, asset_id: int, connection: Connection) -> dict:
    asset = infrastructure_repository.get_infrastructure_asset_by_id(connection, asset_id)
    if not asset: _not_found("Infrastructure asset")
    return asset


def list_infrastructure_assets(*, connection: Connection, condition: str | None, project_id: int | None) -> list[dict]:
    return infrastructure_repository.list_infrastructure_assets(connection, condition=condition, project_id=project_id)


def update_infrastructure_asset(*, asset_id: int, payload: InfrastructureAssetUpdate, connection: Connection) -> dict:
    asset = infrastructure_repository.update_infrastructure_asset(connection, asset_id, payload.model_dump(exclude_unset=True))
    if not asset: _not_found("Infrastructure asset")
    return asset


def delete_infrastructure_asset(*, asset_id: int, connection: Connection) -> None:
    if not infrastructure_repository.delete_infrastructure_asset(connection, asset_id): _not_found("Infrastructure asset")
