from fastapi import APIRouter, Depends
from psycopg import Connection

from app.database.connection import get_db
from app.core.security import require_role
from app.schemas.auth import UserResponse
from app.schemas.workflow import PlannerInviteResponse
from app.services import workflow_service

router = APIRouter(prefix="/api/planner", tags=["planner"])


@router.get("/invites", response_model=list[PlannerInviteResponse])
def get_planner_invites(
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> list[dict]:
    return workflow_service.list_planner_invites(
        connection=connection,
        user=user,
    )
