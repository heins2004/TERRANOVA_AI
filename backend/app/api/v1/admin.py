from fastapi import APIRouter, Depends
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.admin import AdminUserResponse, UserRoleUpdate, UserStatusUpdate
from app.schemas.auth import UserResponse
from app.services import user_admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(connection: Connection = Depends(get_db), _: UserResponse = Depends(require_role("Administrator"))) -> list[dict]:
    return user_admin_service.list_users(connection=connection)


@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(user_id: int, payload: UserRoleUpdate, connection: Connection = Depends(get_db), current_user: UserResponse = Depends(require_role("Administrator"))) -> dict:
    return user_admin_service.update_user_role(user_id=user_id, new_role=payload.role, current_user_id=current_user.id, connection=connection)


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def update_user_status(user_id: int, payload: UserStatusUpdate, connection: Connection = Depends(get_db), current_user: UserResponse = Depends(require_role("Administrator"))) -> dict:
    return user_admin_service.update_user_active_status(user_id=user_id, is_active=payload.is_active, current_user_id=current_user.id, connection=connection)
