from typing import Any
from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import FileResponse
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminLoginLogResponse,
    AdminStatsResponse,
    AdminUserItem,
    AdminUsersResponse,
    CreateOfficialRequest,
    UserStatusUpdate,
)
from app.schemas.auth import UserResponse
from app.schemas.planner_credential import (
    AdminPlannerCredentialsResponse,
    RejectCredentialRequest,
)
from app.services import admin_service, planner_credential_service, user_admin_service

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


@router.get("/users/export")
def export_users(
    q: str | None = Query(None, description="Search by name, email, or city"),
    role: str | None = Query(None, description="Filter by role"),
    status: str | None = Query(None, description="Filter by active/inactive status"),
    format: str = Query("xlsx", description="File format: xlsx or csv"),
    include_demo: bool = Query(False, description="Whether to include demo accounts"),
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> Response:
    content, media_type, filename = admin_service.export_users_data(
        connection,
        q=q,
        role=role,
        status_filter=status,
        format_type=format,
        include_demo=include_demo,
    )
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_analytics(
    days: int = Query(7, description="Number of days: 7, 30, or 90"),
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return admin_service.get_analytics(connection, days=days)


@router.get("/login-log", response_model=AdminLoginLogResponse)
def get_login_log(
    limit: int = Query(25, ge=1, le=100, description="Page limit (max 100)"),
    offset: int = Query(0, ge=0, description="Page offset"),
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    rows, total = admin_service.get_login_log(connection, limit=limit, offset=offset)
    return {
        "items": rows,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# Backward compatibility for existing suite tests
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


@router.get("/planner-credentials", response_model=AdminPlannerCredentialsResponse)
def list_planner_credentials(
    status: str | None = Query(None, description="Filter by status (Unsubmitted, Pending, Verified, Rejected)"),
    limit: int = Query(25, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> AdminPlannerCredentialsResponse:
    return planner_credential_service.list_credentials_for_admin(
        connection,
        status_filter=status,
        limit=limit,
        offset=offset,
    )


@router.get("/planner-credentials/{user_id}/document")
def download_planner_credential_document(
    user_id: int,
    connection: Connection = Depends(get_db),
    _: UserResponse = Depends(require_role("Administrator")),
) -> FileResponse:
    return planner_credential_service.get_planner_document_response(
        connection,
        user_id=user_id,
    )


@router.post("/planner-credentials/{user_id}/verify")
def verify_planner_credentials_endpoint(
    user_id: int,
    connection: Connection = Depends(get_db),
    admin_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return planner_credential_service.verify_planner_credentials(
        connection,
        user_id=user_id,
        admin_user=admin_user,
    )


@router.post("/planner-credentials/{user_id}/reject")
def reject_planner_credentials_endpoint(
    user_id: int,
    payload: RejectCredentialRequest,
    connection: Connection = Depends(get_db),
    admin_user: UserResponse = Depends(require_role("Administrator")),
) -> dict[str, Any]:
    return planner_credential_service.reject_planner_credentials(
        connection,
        user_id=user_id,
        admin_user=admin_user,
        reason=payload.reason,
    )

