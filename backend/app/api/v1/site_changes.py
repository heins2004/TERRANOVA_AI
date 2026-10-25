from fastapi import APIRouter, Depends, Path, status
from psycopg import Connection

from app.core.security import require_authenticated_user
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.site_changes import (
    SiteChangeProposeRequest,
    SiteChangeRejectRequest,
    SiteChangeRequestCreate,
    SiteChangeResponse,
)
from app.services import site_change_service

router = APIRouter(prefix="/api/projects/{project_id}/site-change", tags=["site-changes"])


@router.post("", response_model=SiteChangeResponse, status_code=status.HTTP_201_CREATED)
def request_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    payload: SiteChangeRequestCreate = ...,
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.request_site_change(
        conn,
        user=user,
        project_id=project_id,
        payload=payload,
    )
    return SiteChangeResponse.model_validate(row)


@router.get("", response_model=SiteChangeResponse)
def get_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.get_site_change(
        conn,
        user=user,
        project_id=project_id,
    )
    return SiteChangeResponse.model_validate(row)


@router.post("/propose", response_model=SiteChangeResponse)
def propose_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    payload: SiteChangeProposeRequest = ...,
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.propose_new_site(
        conn,
        user=user,
        project_id=project_id,
        payload=payload,
    )
    return SiteChangeResponse.model_validate(row)


@router.post("/reject", response_model=SiteChangeResponse)
def reject_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    payload: SiteChangeRejectRequest = ...,
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.reject_proposal(
        conn,
        user=user,
        project_id=project_id,
        payload=payload,
    )
    return SiteChangeResponse.model_validate(row)


@router.post("/approve", response_model=SiteChangeResponse)
def approve_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.approve_proposal(
        conn,
        user=user,
        project_id=project_id,
    )
    return SiteChangeResponse.model_validate(row)


@router.post("/redeploy", response_model=SiteChangeResponse)
def redeploy_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.redeploy_project(
        conn,
        user=user,
        project_id=project_id,
    )
    return SiteChangeResponse.model_validate(row)


@router.post("/cancel", response_model=SiteChangeResponse)
def cancel_site_change_endpoint(
    project_id: int = Path(..., description="ID of the project"),
    user: UserResponse = Depends(require_authenticated_user()),
    conn: Connection = Depends(get_db),
) -> SiteChangeResponse:
    row = site_change_service.cancel_site_change(
        conn,
        user=user,
        project_id=project_id,
    )
    return SiteChangeResponse.model_validate(row)
