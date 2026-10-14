import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from psycopg import Connection

from app.core.config import get_settings
from app.core.rate_limit import get_client_ip
from app.core.security import require_authenticated_user
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.profile import (
    ChangePasswordRequest,
    FollowingProjectsResponse,
    ProfileResponse,
    UserCommentsResponse,
)
from app.services import profile_service

router = APIRouter(prefix="/api/me", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
def get_my_profile(
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_authenticated_user()),
) -> ProfileResponse:
    return profile_service.get_profile(connection, current_user)


@router.patch("/profile", response_model=ProfileResponse)
async def patch_my_profile(
    request: Request,
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_authenticated_user()),
) -> ProfileResponse:
    try:
        payload_dict = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid JSON payload.",
        )

    if not isinstance(payload_dict, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payload must be a JSON object.",
        )

    return profile_service.update_profile(connection, current_user, payload_dict)


@router.post("/password")
def change_my_password(
    request: Request,
    payload: ChangePasswordRequest,
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_authenticated_user()),
) -> dict[str, str]:
    settings = get_settings()
    session_token = request.cookies.get(settings.session_cookie_name)
    client_ip = get_client_ip(request)

    return profile_service.change_password(
        connection=connection,
        current_user=current_user,
        payload=payload,
        current_session_token=session_token,
        client_ip=client_ip,
    )


@router.get("/following", response_model=FollowingProjectsResponse)
def get_my_following(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_authenticated_user()),
) -> FollowingProjectsResponse:
    return profile_service.get_following_projects(
        connection=connection,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )


@router.get("/comments", response_model=UserCommentsResponse)
def get_my_comments(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_authenticated_user()),
) -> UserCommentsResponse:
    return profile_service.get_user_comments(
        connection=connection,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )
