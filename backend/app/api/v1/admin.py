from typing import Any
from fastapi import APIRouter, Depends, Query, Response, status
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUsersResponse,
    CreateOfficialRequest,
    UserRoleUpdate,
    UserStatusUpdate,
)
from app.schemas.auth import UserResponse
from app.services import admin_service, user_admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
def list_users(
    response: Response,
    q: str | None = Query(None, description="Search by name, email, or city"),
    role: str | None = Query(None, description="Filter by role"),
    status: str | None = Query(None, description="Filter by active/inactive status"),
    limit: int | None = Query(None, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    include_demo: bool = Query(False, description="Whether to include demo accounts"),
    envelope: bool = Query(False, description="Return enveloped items and total"),
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> Any:
    rows, total = admin_service.list_admin_users(
        connection,
        q=q,
        role=role,
        status_filter=status,
        limit=limit,
        offset=offset,
        include_demo=include_demo,
    )
    response.headers["X-Total-Count"] = str(total)
    if envelope:
        return AdminUsersResponse(
            items=rows,
            total=total,
            limit=limit if limit is not None else len(rows),
            offset=offset,
        )
    return rows


@router.post("/officials", response_model=AdminUserItem, status_code=status.HTTP_201_CREATED)
def create_official(
    payload: CreateOfficialRequest,
    connection: Connection = Depends(get_db),
    admin_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return admin_service.create_government_official(
        connection,
        payload=payload,
        admin_user=admin_user,
    )


@router.post("/users/{user_id}/deactivate", response_model=AdminUserItem)
def deactivate_user(
    user_id: int,
    connection: Connection = Depends(get_db),
    admin_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return admin_service.deactivate_user(
        connection,
        user_id=user_id,
        admin_user=admin_user,
    )


@router.post("/users/{user_id}/reactivate", response_model=AdminUserItem)
def reactivate_user(
    user_id: int,
    connection: Connection = Depends(get_db),
    admin_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return admin_service.reactivate_user(
        connection,
        user_id=user_id,
        admin_user=admin_user,
    )


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return admin_service.get_stats(connection)


# Backward compatibility for existing suite tests
@router.patch("/users/{user_id}/role", response_model=AdminUserItem)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return user_admin_service.update_user_role(
        user_id=user_id,
        new_role=payload.role,
        current_user_id=current_user.id,
        connection=connection,
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserItem)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    connection: Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return user_admin_service.update_user_active_status(
        user_id=user_id,
        is_active=payload.is_active,
        current_user_id=current_user.id,
        connection=connection,
    )
