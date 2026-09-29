from fastapi import APIRouter, Depends, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.candidate_sites import (
    CandidateSiteCreate,
    CandidateSiteResponse,
    CandidateSiteUpdate,
)
from app.schemas.study_areas import StudyAreaCreate, StudyAreaResponse
from app.services import candidate_site_service, study_area_service

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")

router = APIRouter(tags=["study_areas"])


@router.post("/api/study-areas", response_model=StudyAreaResponse, status_code=status.HTTP_201_CREATED)
def create_study_area(
    payload: StudyAreaCreate,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    return study_area_service.create_study_area(
        payload=payload,
        created_by=user.id,
        connection=connection,
    )


@router.get("/api/study-areas", response_model=list[StudyAreaResponse])
def list_study_areas(
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> list[dict]:
    return study_area_service.list_study_areas(connection=connection)


@router.get("/api/study-areas/{id}", response_model=StudyAreaResponse)
def get_study_area(
    id: int,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    return study_area_service.get_study_area(study_area_id=id, connection=connection)


@router.post(
    "/api/study-areas/{id}/candidate-sites",
    response_model=CandidateSiteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_candidate_site(
    id: int,
    payload: CandidateSiteCreate,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    return candidate_site_service.create_candidate_site(
        study_area_id=id,
        payload=payload,
        created_by=user.id,
        connection=connection,
    )


@router.get(
    "/api/study-areas/{id}/candidate-sites",
    response_model=list[CandidateSiteResponse],
)
def list_candidate_sites_for_study_area(
    id: int,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> list[dict]:
    return candidate_site_service.list_candidate_sites_for_study_area(
        study_area_id=id,
        connection=connection,
    )


@router.patch("/api/candidate-sites/{id}", response_model=CandidateSiteResponse)
def update_candidate_site(
    id: int,
    payload: CandidateSiteUpdate,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    return candidate_site_service.update_candidate_site(
        candidate_site_id=id,
        payload=payload,
        connection=connection,
    )
