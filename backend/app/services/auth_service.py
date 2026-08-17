from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response, status
from psycopg import Connection

from app.core.config import get_settings
from app.core.security import create_session_token, hash_password, verify_password
from app.repositories.auth_repository import (
    create_user,
    delete_session_by_token,
    get_authenticated_user_by_session_token,
    get_user_by_email,
    replace_user_session,
)
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse


def _serialize_user(user_row: dict) -> UserResponse:
    return UserResponse(
        id=user_row["id"],
        full_name=user_row["full_name"],
        email=user_row["email"],
        role=user_row["role"],
        created_at=user_row["created_at"].isoformat(),
    )


def _set_session_cookie(response: Response, session_token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        samesite=settings.session_cookie_samesite,
        secure=settings.session_cookie_secure,
        max_age=settings.session_max_age_seconds,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        httponly=True,
        samesite=settings.session_cookie_samesite,
        secure=settings.session_cookie_secure,
    )


def _create_session(connection: Connection, user_id: int) -> str:
    settings = get_settings()
    session_token = create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.session_max_age_seconds)
    replace_user_session(
        connection,
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at,
    )
    return session_token


def register_user(
    *,
    payload: RegisterRequest,
    response: Response,
    connection: Connection,
) -> AuthResponse:
    existing_user = get_user_by_email(connection, payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    created_user = create_user(
        connection,
        full_name=payload.full_name,
        email=payload.email,
        role="Citizen",
        password_hash=hash_password(payload.password),
    )
    session_token = _create_session(connection, created_user["id"])
    _set_session_cookie(response, session_token)

    return AuthResponse(
        message="Registration completed successfully.",
        user=_serialize_user(created_user),
    )


def login_user(
    *,
    payload: LoginRequest,
    response: Response,
    connection: Connection,
) -> AuthResponse:
    user_row = get_user_by_email(connection, payload.email)
    if not user_row or not verify_password(payload.password, user_row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    session_token = _create_session(connection, user_row["id"])
    _set_session_cookie(response, session_token)

    return AuthResponse(
        message="Login successful.",
        user=_serialize_user(user_row),
    )


def get_current_authenticated_user(
    *,
    request: Request,
    connection: Connection,
) -> UserResponse | None:
    settings = get_settings()
    session_token = request.cookies.get(settings.session_cookie_name)
    if not session_token:
        return None

    user_row = get_authenticated_user_by_session_token(connection, session_token)
    if not user_row:
        return None

    return _serialize_user(user_row)


def logout_user(
    *,
    request: Request,
    response: Response,
    connection: Connection,
) -> Response:
    settings = get_settings()
    session_token = request.cookies.get(settings.session_cookie_name)

    if session_token:
        delete_session_by_token(connection, session_token)

    _clear_session_cookie(response)
    response.status_code = 200
    return response
