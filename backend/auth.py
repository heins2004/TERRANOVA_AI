from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import Connection

from backend.database import get_db
from backend.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from backend.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])


def _serialize_user(user_row: dict) -> UserResponse:
    return UserResponse(
        id=user_row["id"],
        full_name=user_row["full_name"],
        email=user_row["email"],
        created_at=user_row["created_at"].isoformat(),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, connection: Connection = Depends(get_db)) -> AuthResponse:
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
            INSERT INTO users (full_name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, full_name, email, created_at
            """,
            (payload.full_name, payload.email, password_hash),
        )
        created_user = cursor.fetchone()
        connection.commit()

    return AuthResponse(
        message="Registration completed successfully.",
        access_token=create_access_token(),
        user=_serialize_user(created_user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, connection: Connection = Depends(get_db)) -> AuthResponse:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, full_name, email, password_hash, created_at
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

    return AuthResponse(
        message="Login successful.",
        access_token=create_access_token(),
        user=_serialize_user(user_row),
    )
