from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.core.rate_limit import record_login_failure
from app.core.security import hash_password, verify_password
from app.repositories import profile_repository
from app.schemas.auth import UserResponse
from app.schemas.profile import (
    ChangePasswordRequest,
    FollowingProjectItem,
    FollowingProjectsResponse,
    ProfileResponse,
    UserCommentItem,
    UserCommentsResponse,
)
from app.services.profile_validation import validate_profile_patch
from app.services.public_project_service import compute_days_left, resolve_city_name


def get_profile(connection: Connection, current_user: UserResponse) -> ProfileResponse:
    user_row = profile_repository.get_user_profile_by_id(connection, current_user.id)
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    counts = profile_repository.get_user_counts_by_role(connection, current_user.id, user_row["role"])

    created_at = (
        user_row["created_at"].isoformat()
        if hasattr(user_row["created_at"], "isoformat")
        else str(user_row["created_at"])
    )

    return ProfileResponse(
        id=user_row["id"],
        name=user_row["name"],
        email=user_row["email"],
        role=user_row["role"],
        phone=user_row["phone"],
        city=user_row["city"],
        created_at=created_at,
        organization=user_row["organization"],
        designation=user_row["designation"],
        expertise=user_row["expertise"],
        avatar_key=user_row["avatar_key"] or "avatar-01",
        counts=counts,
    )


def update_profile(
    connection: Connection,
    current_user: UserResponse,
    payload_dict: dict[str, Any],
) -> ProfileResponse:
    updates = validate_profile_patch(current_user.role, payload_dict)

    updated_row = profile_repository.update_user_profile(connection, current_user.id, updates)
    if not updated_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    counts = profile_repository.get_user_counts_by_role(connection, current_user.id, updated_row["role"])
    created_at = (
        updated_row["created_at"].isoformat()
        if hasattr(updated_row["created_at"], "isoformat")
        else str(updated_row["created_at"])
    )

    return ProfileResponse(
        id=updated_row["id"],
        name=updated_row["name"],
        email=updated_row["email"],
        role=updated_row["role"],
        phone=updated_row["phone"],
        city=updated_row["city"],
        created_at=created_at,
        organization=updated_row["organization"],
        designation=updated_row["designation"],
        expertise=updated_row["expertise"],
        avatar_key=updated_row["avatar_key"] or "avatar-01",
        counts=counts,
    )


def change_password(
    connection: Connection,
    current_user: UserResponse,
    payload: ChangePasswordRequest,
    current_session_token: str | None,
    client_ip: str,
) -> dict[str, str]:
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters long.",
        )

    if payload.new_password == payload.current_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be different from current password.",
        )

    stored_hash = profile_repository.get_user_password_hash(connection, current_user.id)
    if not stored_hash or not verify_password(payload.current_password, stored_hash):
        record_login_failure(ip=client_ip, email=current_user.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    new_hash = hash_password(payload.new_password, iterations=600_000)
    profile_repository.update_user_password(connection, current_user.id, new_hash)

    if current_session_token:
        profile_repository.delete_other_user_sessions(connection, current_user.id, current_session_token)

    return {"message": "Password changed successfully."}


def get_following_projects(
    connection: Connection,
    current_user: UserResponse,
    limit: int = 20,
    offset: int = 0,
) -> FollowingProjectsResponse:
    safe_limit = max(1, min(100, limit))
    safe_offset = max(0, offset)

    rows, total = profile_repository.get_following_projects(
        connection,
        current_user.id,
        limit=safe_limit,
        offset=safe_offset,
    )

    items: list[FollowingProjectItem] = []
    for r in rows:
        stage = r["stage"]
        response_deadline = r.get("response_deadline")
        days_left = compute_days_left(stage, response_deadline)
        halt_reason = r.get("halt_reason") if stage == "Halted" else None
        city_name = resolve_city_name(r.get("city"))
        followed_at = (
            r["followed_at"].isoformat()
            if hasattr(r["followed_at"], "isoformat")
            else str(r["followed_at"])
        )

        items.append(
            FollowingProjectItem(
                id=r["id"],
                title=r["title"],
                category=r.get("category"),
                city_name=city_name,
                stage=stage,
                days_left=days_left,
                halt_reason=halt_reason,
                followed_at=followed_at,
            )
        )

    return FollowingProjectsResponse(items=items, total=total)


def get_user_comments(
    connection: Connection,
    current_user: UserResponse,
    limit: int = 20,
    offset: int = 0,
) -> UserCommentsResponse:
    safe_limit = max(1, min(100, limit))
    safe_offset = max(0, offset)

    rows, total = profile_repository.get_user_comments(
        connection,
        current_user.id,
        limit=safe_limit,
        offset=safe_offset,
    )

    items: list[UserCommentItem] = []
    for r in rows:
        created_at = (
            r["created_at"].isoformat()
            if hasattr(r["created_at"], "isoformat")
            else str(r["created_at"])
        )
        items.append(
            UserCommentItem(
                id=r["id"],
                project_id=r["project_id"],
                project_title=r["project_title"],
                stance=r.get("stance"),
                body=r["body"],
                created_at=created_at,
                can_delete=True,
            )
        )

    return UserCommentsResponse(items=items, total=total)
