from fastapi import APIRouter, Depends, HTTPException, Request, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.complaints import ComplaintCreate, ComplaintResponse, ComplaintUpdate
from app.services import complaint_service
from app.services.auth_service import get_current_authenticated_user

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def current_user(request: Request, connection: Connection = Depends(get_db)) -> UserResponse:
    user = get_current_authenticated_user(request=request, connection=connection)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(payload: ComplaintCreate, connection: Connection = Depends(get_db), user: UserResponse = Depends(current_user)) -> dict:
    return complaint_service.create_complaint(payload=payload, submitted_by=user.id, connection=connection)


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(project_id: int | None = None, connection: Connection = Depends(get_db), user: UserResponse = Depends(current_user)) -> list[dict]:
    return complaint_service.list_complaints(user_id=user.id, user_role=user.role, project_id=project_id, connection=connection)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(complaint_id: int, payload: ComplaintUpdate, connection: Connection = Depends(get_db), _: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> dict:
    return complaint_service.update_complaint_status(complaint_id=complaint_id, payload=payload, connection=connection)
