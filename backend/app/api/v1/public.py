from fastapi import APIRouter, Depends, HTTPException, Query, status
import psycopg

from app.database.connection import get_db
from app.schemas.public import PublicProjectItem, PublicProjectsResponse
from app.services.public_project_service import (
    get_public_project,
    list_public_projects,
)

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/projects", response_model=PublicProjectsResponse)
def get_public_projects_endpoint(
    q: str | None = Query(None, max_length=80, description="Search query across title, city, category"),
    category: str | None = Query(None, max_length=40, description="Exact category filter"),
    past: bool = Query(False, description="Filter active (false) vs completed/halted (true) projects"),
    sort: str = Query("new", pattern="^(new|soon)$", description="Sort order: 'new' or 'soon'"),
    limit: int = Query(24, ge=1, le=50, description="Page size"),
    offset: int = Query(0, ge=0, le=10000, description="Page offset"),
    connection: psycopg.Connection = Depends(get_db),
) -> PublicProjectsResponse:
    return list_public_projects(
        connection,
        q=q,
        category=category,
        past=past,
        sort=sort,
        limit=limit,
        offset=offset,
    )


@router.get("/projects/{project_id}", response_model=PublicProjectItem)
def get_public_project_endpoint(
    project_id: int,
    connection: psycopg.Connection = Depends(get_db),
) -> PublicProjectItem:
    project = get_public_project(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project
