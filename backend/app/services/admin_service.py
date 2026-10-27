import re
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.core.security import hash_password
from app.repositories import admin_analytics_repository, admin_repository, planner_credential_repository
from app.schemas.admin import CreateOfficialRequest
from app.schemas.auth import UserResponse

INDIAN_PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")


def validate_indian_phone(phone: str | None) -> str | None:
    if not phone or not phone.strip():
        return None
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    if not INDIAN_PHONE_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone number must be a valid 10-digit Indian number starting with 6-9.",
        )
    return cleaned


def list_admin_users(
    connection: Connection,
    *,
    q: str | None = None,
    role: str | None = None,
    status_filter: str | None = None,
    limit: int | None = None,
    offset: int = 0,
    include_demo: bool = False,
) -> tuple[list[dict[str, Any]], int]:
    return admin_repository.list_users(
        connection,
        q=q,
        role=role,
        status=status_filter,
        limit=limit,
        offset=offset,
        include_demo=include_demo,
    )


def create_government_official(
    connection: Connection,
    *,
    payload: CreateOfficialRequest,
    admin_user: UserResponse,
) -> dict[str, Any]:
    # 1. Name validation: no digits, min 2 characters
    clean_name = payload.name.strip()
    if len(clean_name) < 2 or any(ch.isdigit() for ch in clean_name):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Official name cannot contain digits and must be at least 2 characters.",
        )

    # 2. Role validation (allowlist: only "Official" and "Planner"; default "Official")
    req_role = payload.role
    if req_role is None or req_role == "":
        req_role = "Official"
    if req_role not in ("Official", "Planner"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role '{payload.role}'. Role must be 'Official' or 'Planner'.",
        )

    db_role = "Urban Planner" if req_role == "Planner" else "Government Official"
    action_name = "create_planner" if req_role == "Planner" else "create_official"
    role_display = "Urban Planner" if req_role == "Planner" else "Government Official"

    # 3. Email uniqueness check
    existing = admin_repository.get_user_by_email(connection, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    # 4. Phone validation if given
    clean_phone = validate_indian_phone(payload.phone)

    # 5. Password validation: min 8 characters
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters long.",
        )

    pwd_hash = hash_password(payload.password)

    with connection.transaction():
        user = admin_repository.create_official_user(
            connection,
            full_name=clean_name,
            email=payload.email,
            password_hash=pwd_hash,
            phone=clean_phone,
            city=payload.city.strip() if payload.city else None,
            role=db_role,
        )
        if db_role == "Urban Planner":
            planner_credential_repository.create_unsubmitted_row(connection, user_id=user["id"])
        admin_repository.insert_admin_action(
            connection,
            admin_id=admin_user.id,
            action=action_name,
            target_user_id=user["id"],
            note=f"Created {role_display} {user['email']}",
        )

    return user


def deactivate_user(
    connection: Connection,
    *,
    user_id: int,
    admin_user: UserResponse,
) -> dict[str, Any]:
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Administrators cannot deactivate their own account.",
        )

    target = admin_repository.get_user_by_id(connection, user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target["role"] == "Administrator" and target["is_active"]:
        active_admins = admin_repository.count_active_admins(connection)
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot deactivate the last active administrator.",
            )

    with connection.transaction():
        updated = admin_repository.set_user_active_status(connection, user_id, False)
        admin_repository.delete_user_sessions(connection, user_id)
        admin_repository.insert_admin_action(
            connection,
            admin_id=admin_user.id,
            action="deactivate_user",
            target_user_id=user_id,
            note=f"Deactivated user {target['email']}",
        )

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return updated


def reactivate_user(
    connection: Connection,
    *,
    user_id: int,
    admin_user: UserResponse,
) -> dict[str, Any]:
    target = admin_repository.get_user_by_id(connection, user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    with connection.transaction():
        updated = admin_repository.set_user_active_status(connection, user_id, True)
        admin_repository.insert_admin_action(
            connection,
            admin_id=admin_user.id,
            action="reactivate_user",
            target_user_id=user_id,
            note=f"Reactivated user {target['email']}",
        )

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return updated


def get_stats(connection: Connection) -> dict[str, Any]:
    return admin_repository.get_admin_stats(connection)


def get_analytics(connection: Connection, days: int) -> dict[str, Any]:
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query parameter 'days' must be one of: 7, 30, 90.",
        )
    return admin_analytics_repository.get_analytics(connection, days)


def get_login_log(
    connection: Connection,
    *,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    if limit > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Limit cannot exceed 100.",
        )
    return admin_repository.get_login_log(connection, limit=limit, offset=offset)


def export_users_data(
    connection: Connection,
    *,
    q: str | None = None,
    role: str | None = None,
    status_filter: str | None = None,
    format_type: str = "xlsx",
    include_demo: bool = False,
) -> tuple[bytes, str, str]:
    from app.utils.excel_export import generate_csv, generate_xlsx

    rows, _ = admin_repository.list_users(
        connection,
        q=q,
        role=role,
        status=status_filter,
        limit=None,
        offset=0,
        include_demo=include_demo,
    )
    headers = [
        "User ID",
        "Full Name",
        "Email",
        "Role",
        "City",
        "Status",
        "Inactive Days",
        "Created At",
        "Last Login",
    ]
    data_rows = []
    for r in rows:
        status_label = "Active" if r.get("is_active") else "Inactive"
        created = r["created_at"].isoformat() if r.get("created_at") else ""
        last_login = r["last_login_at"].isoformat() if r.get("last_login_at") else "Never"
        data_rows.append([
            r.get("id"),
            r.get("name") or r.get("full_name") or "",
            r.get("email") or "",
            r.get("role") or "",
            r.get("city") or "",
            status_label,
            r.get("inactive_days", 0),
            created,
            last_login,
        ])
    if format_type.lower() == "csv":
        content = generate_csv(headers, data_rows)
        media_type = "text/csv; charset=utf-8"
        filename = "users_export.csv"
    else:
        content = generate_xlsx(headers, data_rows)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "users_export.xlsx"
    return content, media_type, filename
