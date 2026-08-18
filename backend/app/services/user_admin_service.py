from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import user_repository

KNOWN_ROLES = ("Citizen", "Urban Planner", "Government Official", "Administrator")


def list_users(*, connection: Connection) -> list[dict]:
    return user_repository.list_users(connection)


def _ensure_not_self(*, user_id: int, current_user_id: int) -> None:
    if user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot modify your own account",
        )


def update_user_role(*, user_id: int, new_role: str, current_user_id: int, connection: Connection) -> dict:
    _ensure_not_self(user_id=user_id, current_user_id=current_user_id)
    if new_role not in KNOWN_ROLES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid user role.")
    user = user_repository.update_user_role(connection, user_id, new_role)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def update_user_active_status(*, user_id: int, is_active: bool, current_user_id: int, connection: Connection) -> dict:
    _ensure_not_self(user_id=user_id, current_user_id=current_user_id)
    user = user_repository.update_user_active_status(connection, user_id, is_active)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user
