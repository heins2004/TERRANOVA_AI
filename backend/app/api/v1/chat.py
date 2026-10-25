from fastapi import APIRouter, Depends, Query
from psycopg import Connection

from app.core.security import require_authenticated_user
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatPinResponse,
    ChatProjectItem,
    ChatUnreadCountResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/unread-count", response_model=ChatUnreadCountResponse)
def get_unread_count_endpoint(
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> ChatUnreadCountResponse:
    return chat_service.get_user_total_unread_count(connection, user)


@router.get("/projects", response_model=list[ChatProjectItem])
def get_chat_projects_endpoint(
    q: str | None = Query(default=None),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> list[ChatProjectItem]:
    return chat_service.get_user_chat_projects(connection, user, q=q)


@router.get("/projects/{project_id}/messages", response_model=list[ChatMessageResponse])
def get_messages_endpoint(
    project_id: int,
    after_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> list[ChatMessageResponse]:
    return chat_service.get_project_messages(
        connection,
        project_id,
        user,
        after_id=after_id,
        limit=limit,
    )


@router.post("/projects/{project_id}/messages", response_model=ChatMessageResponse)
def post_message_endpoint(
    project_id: int,
    payload: ChatMessageCreate,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> ChatMessageResponse:
    return chat_service.post_project_message(
        connection,
        project_id,
        user,
        payload.body,
    )


@router.put("/projects/{project_id}/pin", response_model=ChatPinResponse)
def pin_project_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> ChatPinResponse:
    return chat_service.pin_project(connection, project_id, user)


@router.delete("/projects/{project_id}/pin", response_model=ChatPinResponse)
def unpin_project_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> ChatPinResponse:
    return chat_service.unpin_project(connection, project_id, user)
