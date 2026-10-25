import math
import threading
import time
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import chat_repository
from app.schemas.auth import UserResponse
from app.schemas.chat import (
    ChatMessageResponse,
    ChatPinResponse,
    ChatProjectItem,
    ChatUnreadCountResponse,
)

_chat_lock = threading.Lock()
_chat_user_history: dict[int, list[float]] = {}
CHAT_RATE_LIMIT_MAX = 20
CHAT_RATE_LIMIT_WINDOW = 60  # seconds


def check_chat_rate_limit(user_id: int) -> None:
    now = time.time()
    with _chat_lock:
        timestamps = _chat_user_history.get(user_id, [])
        cutoff = now - CHAT_RATE_LIMIT_WINDOW
        valid = [t for t in timestamps if t > cutoff]

        if len(valid) >= CHAT_RATE_LIMIT_MAX:
            oldest = valid[0]
            retry_after = max(1, int(math.ceil(oldest + CHAT_RATE_LIMIT_WINDOW - now)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many messages. Maximum 20 messages per minute allowed.",
                headers={"Retry-After": str(retry_after)},
            )

        valid.append(now)
        _chat_user_history[user_id] = valid


def reset_chat_rate_limits() -> None:
    with _chat_lock:
        _chat_user_history.clear()


def validate_project_chat_access(
    connection: Connection,
    project_id: int,
    user: UserResponse,
) -> dict[str, Any]:
    project = chat_repository.get_project_for_chat(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    is_creator = project["created_by"] == user.id
    is_assigned = project.get("planner_id") == user.id
    is_invited = project.get("invited_planner_id") == user.id

    if not (is_creator or is_assigned or is_invited):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not authorized to access this project's chat.",
        )

    if project.get("planner_id") is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chat starts when the planner accepts the invitation.",
        )

    return project


def get_user_chat_projects(
    connection: Connection,
    user: UserResponse,
    q: str | None = None,
) -> list[ChatProjectItem]:
    rows = chat_repository.get_chat_projects(connection, user.id, q=q)
    return [ChatProjectItem(**r) for r in rows if r.get("stage") != "Draft"]


def get_project_messages(
    connection: Connection,
    project_id: int,
    user: UserResponse,
    after_id: int | None = None,
    limit: int = 50,
) -> list[ChatMessageResponse]:
    validate_project_chat_access(connection, project_id, user)
    rows = chat_repository.get_messages(
        connection,
        project_id,
        after_id=after_id,
        limit=limit,
    )

    if rows:
        latest_id = max(r["id"] for r in rows)
        chat_repository.mark_as_read(connection, user.id, project_id, latest_id)
        connection.commit()

    return [ChatMessageResponse(**r) for r in rows]


def post_project_message(
    connection: Connection,
    project_id: int,
    user: UserResponse,
    body: str,
) -> ChatMessageResponse:
    project = validate_project_chat_access(connection, project_id, user)

    if project["stage"] in ("Completed", "Halted", "Recalled"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This project is completed or halted. The chat is read-only.",
        )

    check_chat_rate_limit(user.id)

    other_user_id = (
        project["planner_id"] if user.id == project["created_by"] else project["created_by"]
    )

    # Insert message, create notification if no unread notification exists, and mark sender as read
    # all within one transaction
    with connection.transaction():
        msg = chat_repository.create_message(connection, project_id, user.id, body)
        if not chat_repository.has_unread_chat_notification(connection, other_user_id, project_id):
            notif_msg = f"New message in {project['title']}"
            chat_repository.create_chat_notification(
                connection,
                other_user_id,
                project_id,
                notif_msg,
            )
        chat_repository.mark_as_read(connection, user.id, project_id, msg["id"])

    return ChatMessageResponse(**msg)


def pin_project(
    connection: Connection,
    project_id: int,
    user: UserResponse,
) -> ChatPinResponse:
    validate_project_chat_access(connection, project_id, user)

    if chat_repository.is_pinned(connection, user.id, project_id):
        return ChatPinResponse(message="Project pinned successfully", is_pinned=True)

    current_pins = chat_repository.get_pin_count(connection, user.id)
    if current_pins >= 5:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Maximum 5 pinned chats allowed. Unpin another project first.",
        )

    chat_repository.pin_project(connection, user.id, project_id)
    connection.commit()
    return ChatPinResponse(message="Project pinned successfully", is_pinned=True)


def unpin_project(
    connection: Connection,
    project_id: int,
    user: UserResponse,
) -> ChatPinResponse:
    validate_project_chat_access(connection, project_id, user)
    chat_repository.unpin_project(connection, user.id, project_id)
    connection.commit()
    return ChatPinResponse(message="Project unpinned successfully", is_pinned=False)


def get_user_total_unread_count(
    connection: Connection,
    user: UserResponse,
) -> ChatUnreadCountResponse:
    count = chat_repository.get_total_unread_count(connection, user.id)
    return ChatUnreadCountResponse(unread_count=count)
