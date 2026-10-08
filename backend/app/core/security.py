import hashlib
import hmac
import secrets
from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from app.schemas.auth import UserResponse

LEGACY_PASSWORD_ITERATIONS = 100_000
NEW_PASSWORD_ITERATIONS = 600_000
PASSWORD_ITERATIONS = NEW_PASSWORD_ITERATIONS


def hash_password(password: str, iterations: int = NEW_PASSWORD_ITERATIONS) -> str:
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"{iterations}${salt}${derived_key.hex()}"


def get_hash_iterations(password_hash: str) -> int | None:
    if not password_hash or not isinstance(password_hash, str) or "$" not in password_hash:
        return None
    parts = password_hash.split("$")
    try:
        if len(parts) == 2:
            return LEGACY_PASSWORD_ITERATIONS
        elif len(parts) == 3:
            return int(parts[0])
        elif len(parts) == 4 and parts[0] in ("pbkdf2", "pbkdf2_sha256"):
            return int(parts[1])
    except (ValueError, TypeError):
        return None
    return None


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash or not isinstance(password_hash, str) or "$" not in password_hash:
        return False
    parts = password_hash.split("$")
    try:
        if len(parts) == 2:
            salt, stored_hash = parts
            iterations = LEGACY_PASSWORD_ITERATIONS
        elif len(parts) == 3:
            iter_str, salt, stored_hash = parts
            iterations = int(iter_str)
        elif len(parts) == 4 and parts[0] in ("pbkdf2", "pbkdf2_sha256"):
            _, iter_str, salt, stored_hash = parts
            iterations = int(iter_str)
        else:
            return False

        if not salt or not stored_hash or iterations <= 0:
            return False

        # Ensure valid hex strings
        int(salt, 16)
        int(stored_hash, 16)

        derived_key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(derived_key.hex(), stored_hash)
    except Exception:
        return False


def needs_rehash(password_hash: str) -> bool:
    iters = get_hash_iterations(password_hash)
    if iters is None or iters < NEW_PASSWORD_ITERATIONS:
        return True
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


def require_authenticated_user():
    """Return a dependency that enforces any authenticated active user."""
    def dependency(
        request: Request,
        connection = Depends(_get_db),
    ) -> UserResponse:
        from app.services.auth_service import get_current_authenticated_user

        user = get_current_authenticated_user(request=request, connection=connection)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        return user

    return dependency


from contextvars import ContextVar
_current_request_cv: ContextVar[Request | None] = ContextVar("_current_request_cv", default=None)


def set_current_request(request: Request | None):
    return _current_request_cv.set(request)


def reset_current_request(token) -> None:
    _current_request_cv.reset(token)


def get_current_request() -> Request | None:
    return _current_request_cv.get()

