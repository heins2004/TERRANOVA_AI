from typing import Any
from fastapi import APIRouter, Depends, status
import psycopg

from app.core.security import require_authenticated_user
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.project_consultation import (
    ConsultationCancelRequest,
    ConsultationCreateRequest,
    ConsultationResponseItem,
    ConsultationUpdateRequest,
    PublicConsultationItem,
)
from app.services import project_consultation_service as service

router = APIRouter(tags=["project consultations"])
current_user_dep = require_authenticated_user()


@router.post(
    "/api/projects/{id}/consultations",
    response_model=ConsultationResponseItem,
    status_code=status.HTTP_201_CREATED,
)
def create_project_consultation_endpoint(
    id: int,
    payload: ConsultationCreateRequest,
    connection: psycopg.Connection = Depends(get_db),
    user: UserResponse = Depends(current_user_dep),
) -> dict[str, Any]:
    return service.create_consultation(
        connection,
        project_id=id,
        user=user,
        payload=payload,
    )


@router.patch(
    "/api/projects/{id}/consultations/{cid}",
    response_model=ConsultationResponseItem,
)
def update_project_consultation_endpoint(
    id: int,
    cid: int,
    payload: ConsultationUpdateRequest,
    connection: psycopg.Connection = Depends(get_db),
    user: UserResponse = Depends(current_user_dep),
) -> dict[str, Any]:
    return service.update_consultation(
        connection,
        project_id=id,
        consultation_id=cid,
        user=user,
        payload=payload,
    )


@router.post(
    "/api/projects/{id}/consultations/{cid}/cancel",
    response_model=ConsultationResponseItem,
)
def cancel_project_consultation_endpoint(
    id: int,
    cid: int,
    payload: ConsultationCancelRequest,
    connection: psycopg.Connection = Depends(get_db),
    user: UserResponse = Depends(current_user_dep),
) -> dict[str, Any]:
    return service.cancel_consultation(
        connection,
        project_id=id,
        consultation_id=cid,
        user=user,
        payload=payload,
    )


@router.get(
    "/api/projects/{id}/consultations",
    response_model=list[ConsultationResponseItem],
)
def list_project_consultations_authenticated_endpoint(
    id: int,
    connection: psycopg.Connection = Depends(get_db),
    user: UserResponse = Depends(current_user_dep),
) -> list[dict[str, Any]]:
    return service.get_consultations_authenticated(
        connection,
        project_id=id,
        user=user,
    )


@router.get(
    "/api/public/projects/{id}/consultations",
    response_model=list[PublicConsultationItem],
)
def list_public_project_consultations_endpoint(
    id: int,
    connection: psycopg.Connection = Depends(get_db),
) -> list[dict[str, Any]]:
    return service.get_public_consultations(
        connection,
        project_id=id,
    )
