import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from psycopg import Connection

from app.repositories import admin_repository, notification_repository, planner_credential_repository
from app.schemas.auth import UserResponse
from app.schemas.planner_credential import (
    AdminPlannerCredentialsResponse,
    PlannerCredentialResponse,
)

MAX_CREDENTIAL_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIMES = {
    ".pdf": {"application/pdf"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".png": {"image/png"},
}
MAGIC_BYTES = {
    ".pdf": b"%PDF-",
    ".jpg": b"\xff\xd8\xff",
    ".jpeg": b"\xff\xd8\xff",
    ".png": b"\x89PNG\r\n\x1a\n",
}
REG_NUMBER_REGEX = re.compile(r"^[a-zA-Z0-9/\-\s]{5,60}$")

# Rate limit tracker: user_id -> list of timestamps
_upload_rate_limits: dict[int, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 3600
RATE_LIMIT_MAX_UPLOADS = 5


def get_credentials_storage_dir() -> Path:
    custom_dir = os.environ.get("PLANNER_CREDENTIALS_STORAGE_DIR")
    if custom_dir:
        dir_path = Path(custom_dir)
    else:
        # Default: C:\Users\hp\Desktop\Programs\terranova_private_storage\planner_credentials
        repo_root = Path(__file__).resolve().parents[3]
        dir_path = repo_root.parent / "terranova_private_storage" / "planner_credentials"
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def check_upload_rate_limit(user_id: int) -> None:
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    history = [t for t in _upload_rate_limits.get(user_id, []) if t > cutoff]
    if len(history) >= RATE_LIMIT_MAX_UPLOADS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Upload rate limit reached: maximum 5 credential submissions per hour. Please try again later.",
        )


def record_upload(user_id: int) -> None:
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    history = [t for t in _upload_rate_limits.get(user_id, []) if t > cutoff]
    history.append(now)
    _upload_rate_limits[user_id] = history


def reset_rate_limits_for_user(user_id: int) -> None:
    _upload_rate_limits.pop(user_id, None)


def get_planner_credentials(connection: Connection, *, user: UserResponse) -> PlannerCredentialResponse:
    row = planner_credential_repository.get_by_user_id(connection, user.id)
    if not row:
        return PlannerCredentialResponse(status="Unsubmitted")
    return PlannerCredentialResponse(**row)


async def submit_planner_credentials(
    connection: Connection,
    *,
    user: UserResponse,
    registration_number: str,
    body_name: str | None,
    file: UploadFile,
) -> PlannerCredentialResponse:
    check_upload_rate_limit(user.id)

    clean_reg = (registration_number or "").strip()
    if not clean_reg or not REG_NUMBER_REGEX.match(clean_reg):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Registration number must be 5 to 60 characters and contain only letters, numbers, spaces, slashes (/), and hyphens (-).",
        )

    clean_body = body_name.strip() if body_name and body_name.strip() else None
    if clean_body and len(clean_body) > 120:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Professional body name must not exceed 120 characters.",
        )

    # Sanitize and extract display filename
    raw_name = file.filename or "credentials"
    safe_name = Path(raw_name.replace("\\", "/")).name[:150]
    if not safe_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid filename is required.",
        )

    ext = Path(safe_name).suffix.lower()
    allowed_mimes = ALLOWED_MIMES.get(ext)
    declared_mime = (file.content_type or "").lower()
    if not allowed_mimes or declared_mime not in allowed_mimes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid file type. Only PDF, JPG, and PNG files are accepted.",
        )

    content = await file.read()
    file_size = len(content)
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document file cannot be empty.",
        )
    if file_size > MAX_CREDENTIAL_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File size exceeds the 5 MB limit.",
        )

    # Magic bytes check
    expected_magic = MAGIC_BYTES.get(ext)
    if not expected_magic or not content.startswith(expected_magic):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File content does not match the declared extension (magic bytes mismatch).",
        )

    storage_dir = get_credentials_storage_dir()
    stored_filename = f"{uuid4().hex}{ext}"
    target_path = storage_dir / stored_filename

    # Delete previous stored file if present
    existing_row = planner_credential_repository.get_by_user_id(connection, user.id)
    if existing_row and existing_row.get("document_path"):
        old_path = Path(existing_row["document_path"])
        if old_path.exists() and old_path.is_file():
            try:
                old_path.unlink()
            except OSError:
                pass

    with open(target_path, "wb") as f_out:
        f_out.write(content)

    record_upload(user.id)

    updated_row = planner_credential_repository.upsert_submission(
        connection,
        user_id=user.id,
        registration_number=clean_reg,
        body_name=clean_body,
        document_path=str(target_path),
        document_original_name=safe_name,
        document_mime=declared_mime,
        document_size=file_size,
    )
    connection.commit()
    return PlannerCredentialResponse(**updated_row)


def get_planner_document_response(connection: Connection, *, user_id: int) -> FileResponse:
    row = planner_credential_repository.get_by_user_id(connection, user_id)
    if not row or not row.get("document_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential document not found.",
        )
    file_path = Path(row["document_path"])
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential document file does not exist on disk.",
        )

    original_name = row.get("document_original_name") or "credential_document"
    mime = row.get("document_mime") or "application/octet-stream"
    headers = {"X-Content-Type-Options": "nosniff"}
    return FileResponse(
        path=str(file_path),
        media_type=mime,
        filename=original_name,
        headers=headers,
    )


def list_credentials_for_admin(
    connection: Connection,
    *,
    status_filter: str | None,
    limit: int,
    offset: int,
) -> AdminPlannerCredentialsResponse:
    rows, total = planner_credential_repository.list_for_admin(
        connection,
        status_filter=status_filter,
        limit=limit,
        offset=offset,
    )
    return AdminPlannerCredentialsResponse(items=rows, total=total, limit=limit, offset=offset)


def verify_planner_credentials(
    connection: Connection,
    *,
    user_id: int,
    admin_user: UserResponse,
) -> dict:
    row = planner_credential_repository.get_by_user_id(connection, user_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planner credentials record not found.")
    if row["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only Pending credentials can be verified (current status: {row['status']}).",
        )

    with connection.transaction():
        updated = planner_credential_repository.verify_credentials(connection, user_id=user_id, admin_id=admin_user.id)
        admin_repository.insert_admin_action(
            connection,
            admin_id=admin_user.id,
            action="verify_planner_credentials",
            target_user_id=user_id,
            note=f"Verified credentials for planner user #{user_id}",
        )
        notification_repository.create_notification(
            connection,
            user_id=user_id,
            project_id=None,
            kind="credentials_verified",
            message="Your professional credentials have been verified. You are now visible for project invitations.",
            auto_commit=False,
        )
    connection.commit()
    return updated


def reject_planner_credentials(
    connection: Connection,
    *,
    user_id: int,
    admin_user: UserResponse,
    reason: str,
) -> dict:
    clean_reason = reason.strip()
    if len(clean_reason) < 10 or len(clean_reason) > 500:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rejection reason must be between 10 and 500 characters.",
        )

    row = planner_credential_repository.get_by_user_id(connection, user_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planner credentials record not found.")
    if row["status"] != "Pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only Pending credentials can be rejected (current status: {row['status']}).",
        )

    with connection.transaction():
        updated = planner_credential_repository.reject_credentials(
            connection, user_id=user_id, admin_id=admin_user.id, reason=clean_reason
        )
        admin_repository.insert_admin_action(
            connection,
            admin_id=admin_user.id,
            action="reject_planner_credentials",
            target_user_id=user_id,
            note=f"Rejected credentials for planner user #{user_id}: {clean_reason}",
        )
        notification_repository.create_notification(
            connection,
            user_id=user_id,
            project_id=None,
            kind="credentials_rejected",
            message=f"Your credential submission was rejected: {clean_reason}",
            auto_commit=False,
        )
    connection.commit()
    return updated
