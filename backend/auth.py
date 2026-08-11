from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from psycopg import Connection

from backend.config import get_settings
from backend.database import get_db
from backend.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from backend.security import create_session_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["authentication"])


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

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
        cursor.execute(
            """
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s)
            """,
            (user_id, session_token, expires_at),
        )

    connection.commit()
    return session_token


def _get_authenticated_user(connection: Connection, session_token: str | None) -> dict | None:
    if not session_token:
        return None

    with connection.cursor() as cursor:
        cursor.execute("DELETE FROM user_sessions WHERE expires_at <= NOW()")
        cursor.execute(
            """
            SELECT users.id, users.full_name, users.email, users.role, users.created_at
            FROM user_sessions
            JOIN users ON users.id = user_sessions.user_id
            WHERE user_sessions.session_token = %s
              AND user_sessions.expires_at > NOW()
            """,
            (session_token,),
        )
        user_row = cursor.fetchone()

    connection.commit()
    return user_row


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    connection: Connection = Depends(get_db),
) -> AuthResponse:
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        password_hash = hash_password(payload.password)
        cursor.execute(
            """
            INSERT INTO users (full_name, email, role, password_hash)
            VALUES (%s, %s, %s, %s)
            RETURNING id, full_name, email, role, created_at
            """,
            (payload.full_name, payload.email, "Citizen", password_hash),
        )
        created_user = cursor.fetchone()
        connection.commit()

    session_token = _create_session(connection, created_user["id"])
    _set_session_cookie(response, session_token)

    return AuthResponse(
        message="Registration completed successfully.",
        user=_serialize_user(created_user),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    connection: Connection = Depends(get_db),
) -> AuthResponse:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, role, password_hash, created_at
            FROM users
            WHERE email = %s
            """,
            (payload.email,),
        )
        user_row = cursor.fetchone()

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


@router.get("/me", response_model=UserResponse)
def me(request: Request, connection: Connection = Depends(get_db)) -> UserResponse:
    settings = get_settings()
    session_token = request.cookies.get(settings.session_cookie_name)
    user_row = _get_authenticated_user(connection, session_token)

    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return _serialize_user(user_row)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    connection: Connection = Depends(get_db),
) -> Response:
    settings = get_settings()
    session_token = request.cookies.get(settings.session_cookie_name)

    if session_token:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM user_sessions WHERE session_token = %s", (session_token,))
        connection.commit()

    _clear_session_cookie(response)
    return response
