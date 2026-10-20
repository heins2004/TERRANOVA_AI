from typing import Annotated
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.planner_credential import PlannerCredentialResponse
from app.schemas.workflow import PlannerInviteResponse
from app.services import planner_credential_service, workflow_service

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


@router.get("/credentials", response_model=PlannerCredentialResponse)
def get_my_credentials(
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> PlannerCredentialResponse:
    return planner_credential_service.get_planner_credentials(connection, user=user)


@router.put("/credentials", response_model=PlannerCredentialResponse)
async def submit_my_credentials(
    registration_number: Annotated[str, Form(...)],
    file: Annotated[UploadFile, File(...)],
    body_name: Annotated[str | None, Form()] = None,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> PlannerCredentialResponse:
    return await planner_credential_service.submit_planner_credentials(
        connection,
        user=user,
        registration_number=registration_number,
        body_name=body_name,
        file=file,
    )


@router.get("/credentials/document")
def download_my_credential_document(
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> FileResponse:
    return planner_credential_service.get_planner_document_response(
        connection,
        user_id=user.id,
    )
