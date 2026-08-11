import hashlib
import hmac
import secrets

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
    salt, stored_hash = password_hash.split("$", maxsplit=1)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return hmac.compare_digest(derived_key.hex(), stored_hash)


def create_session_token() -> str:
    return secrets.token_urlsafe(32)
