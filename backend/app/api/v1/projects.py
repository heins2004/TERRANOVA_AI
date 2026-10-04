from fastapi import APIRouter, Depends, Query, Response, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services import project_service

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
projects_router = APIRouter(prefix="/api/projects", tags=["projects"])


@projects_router.get("", response_model=list[ProjectResponse])
def list_projects(status_filter: str | None = Query(None, alias="status"), category: str | None = None, city: str | None = None, connection: Connection = Depends(get_db)) -> list[dict]:
    return project_service.list_projects(connection=connection, status_filter=status_filter, category=category, city=city)


@projects_router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, connection: Connection = Depends(get_db)) -> dict:
    return project_service.get_project(project_id=project_id, connection=connection)


@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, connection: Connection = Depends(get_db), user: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> dict:
    return project_service.create_project(payload=payload, created_by=user.id, connection=connection)


@projects_router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, payload: ProjectUpdate, connection: Connection = Depends(get_db), _: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> dict:
    return project_service.update_project(project_id=project_id, payload=payload, connection=connection)


@projects_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, connection: Connection = Depends(get_db), _: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> Response:
    project_service.delete_project(project_id=project_id, connection=connection)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


