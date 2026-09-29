"""Candidate site routes — Phase 2 additions.

Routes defined here:
  GET  /api/candidate-sites/{id}          — full detail + proximity
  PATCH /api/candidate-sites/{id}/status  — partial status field update
  POST  /api/candidate-sites/{id}/proximity/refresh — force re-compute proximity
  POST  /api/candidate-sites/{id}/promote — promote to project

The general PATCH /api/candidate-sites/{id} (for non-status fields) continues to
live in study_areas.py to avoid disrupting existing behaviour.
"""

from fastapi import APIRouter, Depends, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.candidate_sites import (
    CandidateSiteDetailResponse,
    ProximityItem,
    PromoteToProjectRequest,
    PromoteToProjectResponse,
    StatusUpdateRequest,
)
from app.services import candidate_site_service

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
VIEWER_ROLES = ("Urban Planner", "Government Official", "Administrator")

router = APIRouter(prefix="/api/candidate-sites", tags=["candidate_sites"])


@router.get(
    "/{candidate_site_id}",
    response_model=CandidateSiteDetailResponse,
)
def get_candidate_site_detail(
    candidate_site_id: int,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*VIEWER_ROLES)),
) -> dict:
    """Full candidate site detail including proximity data.

    Proximity is computed on first access (or when stale); subsequent calls
    within 30 days return cached data.
    """
    return candidate_site_service.get_site_detail(
        candidate_site_id=candidate_site_id,
        connection=connection,
    )


@router.patch(
    "/{candidate_site_id}/status",
    response_model=CandidateSiteDetailResponse,
)
def update_candidate_site_status(
    candidate_site_id: int,
    payload: StatusUpdateRequest,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    """Partially update status fields (suitability, availability, ownership, flood risk).

    All fields are optional — only supplied fields are updated.
    Returns the full updated site (without proximity, for speed).
    """
    fields = payload.model_dump(exclude_none=True)
    site = candidate_site_service.update_status(
        candidate_site_id=candidate_site_id,
        fields=fields,
        connection=connection,
    )
    # Attach an empty proximity list so the response validates against CandidateSiteDetailResponse
    return {**site, "proximity": []}


@router.post(
    "/{candidate_site_id}/proximity/refresh",
    response_model=list[ProximityItem],
)
def refresh_proximity(
    candidate_site_id: int,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> list[dict]:
    """Force-recompute proximity data for a candidate site from Overpass API."""
    return candidate_site_service.refresh_proximity(
        candidate_site_id=candidate_site_id,
        connection=connection,
    )


@router.post(
    "/{candidate_site_id}/promote",
    response_model=PromoteToProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def promote_to_project(
    candidate_site_id: int,
    payload: PromoteToProjectRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    """Promote a candidate site to a Project.

    Creates a new Project record populated from the site's data.
    Sets the site's suitability_status to 'Promoted'.
    Returns the new project_id for frontend redirect to /projects/{id}.
    """
    project = candidate_site_service.promote_to_project(
        candidate_site_id=candidate_site_id,
        project_fields=payload.model_dump(exclude_none=True),
        created_by=user.id,
        connection=connection,
    )
    return {"project_id": project["id"]}
