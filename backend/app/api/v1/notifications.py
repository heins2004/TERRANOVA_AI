from fastapi import APIRouter, Depends, Query
from psycopg import Connection

from app.core.security import require_authenticated_user
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.notification import (
    NotificationListResponse,
    NotificationReadResponse,
)
from app.services import notification_service

router = APIRouter(prefix="/api/me/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def get_my_notifications_endpoint(
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> NotificationListResponse:
    return notification_service.get_my_notifications(
        connection=connection,
        user=user,
        limit=limit,
        offset=offset,
    )


@router.post("/{notification_id}/read", response_model=NotificationReadResponse)
def mark_read_endpoint(
    notification_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> NotificationReadResponse:
    return notification_service.mark_notification_as_read(
        connection=connection,
        user=user,
        notification_id=notification_id,
    )


@router.post("/read-all", response_model=dict[str, str])
def mark_all_read_endpoint(
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> dict[str, str]:
    return notification_service.mark_all_as_read(
        connection=connection,
        user=user,
    )
