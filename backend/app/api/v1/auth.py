from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from psycopg import Connection

from app.database.connection import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import (
    get_current_authenticated_user,
    login_user,
    logout_user,
    register_user,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    connection: Connection = Depends(get_db),
) -> AuthResponse:
    return register_user(payload=payload, response=response, connection=connection)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    connection: Connection = Depends(get_db),
) -> AuthResponse:
    return login_user(payload=payload, response=response, connection=connection)


@router.get("/me", response_model=UserResponse)
def me(request: Request, connection: Connection = Depends(get_db)) -> UserResponse:
    user = get_current_authenticated_user(request=request, connection=connection)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    connection: Connection = Depends(get_db),
) -> Response:
    return logout_user(request=request, response=response, connection=connection)
