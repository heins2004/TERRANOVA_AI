import hashlib
import hmac
import secrets
from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from app.schemas.auth import UserResponse

PASSWORD_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return f"{salt}${derived_key.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash or not isinstance(password_hash, str) or "$" not in password_hash:
        return False
    parts = password_hash.split("$", maxsplit=1)
    if len(parts) != 2:
        return False
    salt, stored_hash = parts
    if not salt or not stored_hash:
        return False
    try:
        derived_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            PASSWORD_ITERATIONS,
        )
        return hmac.compare_digest(derived_key.hex(), stored_hash)
    except Exception:
        return False


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def _get_db() -> Generator:
    """Lazy database dependency to keep core security independent of connection import order."""
    from app.database.connection import get_db

    yield from get_db()


def require_role(*allowed_roles: str):
    """Return a dependency that enforces an authenticated user's role."""
    def dependency(
        request: Request,
        connection = Depends(_get_db),
    ) -> UserResponse:
        # Imported here to avoid the auth-service/security circular import.
        from app.services.auth_service import get_current_authenticated_user

        user = get_current_authenticated_user(request=request, connection=connection)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission for this action.")
        return user

    return dependency
