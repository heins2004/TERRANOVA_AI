from fastapi import APIRouter, Depends, HTTPException, Request, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.consultations import ConsultationCreate, ConsultationResponse, ConsultationUpdate, FeedbackCreate, FeedbackResponse
from app.services import consultation_service
from app.services.auth_service import get_current_authenticated_user

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
router = APIRouter(prefix="/api/consultations", tags=["consultations"])


def current_user(request: Request, connection: Connection = Depends(get_db)) -> UserResponse:
    user = get_current_authenticated_user(request=request, connection=connection)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(payload: ConsultationCreate, connection: Connection = Depends(get_db), user: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> dict:
    return consultation_service.create_consultation(payload=payload, created_by=user.id, connection=connection)


@router.get("", response_model=list[ConsultationResponse])
def list_consultations(project_id: int | None = None, connection: Connection = Depends(get_db), _: UserResponse = Depends(current_user)) -> list[dict]:
    return consultation_service.list_consultations(project_id=project_id, connection=connection)


@router.patch("/{consultation_id}", response_model=ConsultationResponse)
def update_consultation(consultation_id: int, payload: ConsultationUpdate, connection: Connection = Depends(get_db), _: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> dict:
    return consultation_service.update_consultation(consultation_id=consultation_id, payload=payload, connection=connection)


@router.post("/{consultation_id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(consultation_id: int, payload: FeedbackCreate, connection: Connection = Depends(get_db), user: UserResponse = Depends(current_user)) -> dict:
    return consultation_service.create_feedback(consultation_id=consultation_id, submitted_by=user.id, payload=payload, connection=connection)


@router.get("/{consultation_id}/feedback", response_model=list[FeedbackResponse])
def list_feedback(consultation_id: int, connection: Connection = Depends(get_db), user: UserResponse = Depends(current_user)) -> list[dict]:
    return consultation_service.list_feedback(consultation_id=consultation_id, user_id=user.id, user_role=user.role, connection=connection)
