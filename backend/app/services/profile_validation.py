import re
from typing import Any
from fastapi import HTTPException, status
from app.core.constants import ALLOWED_AVATARS

INDIAN_PHONE_REGEX = re.compile(r"^[6-9]\d{9}$")
HTML_TAG_REGEX = re.compile(r"<[^>]+>")


def sanitize_and_validate_text(
    value: str | None,
    field_name: str,
    max_length: int,
) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if HTML_TAG_REGEX.search(cleaned) or "<" in cleaned or ">" in cleaned:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"HTML tags are not allowed in {field_name}.",
        )
    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name.capitalize()} cannot exceed {max_length} characters.",
        )
    return cleaned


def validate_phone(phone: str | None) -> str | None:
    if phone is None or (isinstance(phone, str) and not phone.strip()):
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


def validate_profile_patch(
    user_role: str,
    payload_dict: dict[str, Any],
) -> dict[str, Any]:
    # 1. Reject unauthorized keys: role and email are strictly forbidden
    if "role" in payload_dict:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role cannot be changed.",
        )
    if "email" in payload_dict:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email cannot be changed.",
        )

    # 2. Check role-appropriate extras
    allowed_base_keys = {"name", "phone", "city", "avatar_key"}

    if user_role == "Urban Planner":
        allowed_extras = {"organization", "expertise"}
    elif user_role == "Government Official":
        allowed_extras = {"organization", "designation"}
    else:  # Citizen, Administrator
        allowed_extras = set()

    allowed_keys = allowed_base_keys | allowed_extras
    for key in payload_dict:
        if key not in allowed_keys:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Field '{key}' is not allowed for role '{user_role}'.",
            )

    updates: dict[str, Any] = {}

    # 3. Validate name
    if "name" in payload_dict:
        raw_name = payload_dict["name"]
        if raw_name is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot be null.",
            )
        clean_name = str(raw_name).strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot be empty.",
            )
        if any(ch.isdigit() for ch in clean_name):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot contain digits.",
            )
        if HTML_TAG_REGEX.search(clean_name) or "<" in clean_name or ">" in clean_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="HTML tags are not allowed in name.",
            )
        if len(clean_name) > 150:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot exceed 150 characters.",
            )
        updates["full_name"] = clean_name

    # 4. Validate phone
    if "phone" in payload_dict:
        updates["phone"] = validate_phone(payload_dict["phone"])

    # 5. Validate city
    if "city" in payload_dict:
        updates["city"] = sanitize_and_validate_text(payload_dict["city"], "city", 100)

    # 6. Validate avatar_key
    if "avatar_key" in payload_dict:
        avatar_val = payload_dict["avatar_key"]
        if not avatar_val or avatar_val not in ALLOWED_AVATARS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid avatar key. Must be one of avatar-01 through avatar-20.",
            )
        updates["avatar_key"] = avatar_val

    # 7. Validate extras
    if "organization" in payload_dict and "organization" in allowed_extras:
        updates["organization"] = sanitize_and_validate_text(
            payload_dict["organization"], "organization", 100
        )

    if "designation" in payload_dict and "designation" in allowed_extras:
        updates["designation"] = sanitize_and_validate_text(
            payload_dict["designation"], "designation", 100
        )

    if "expertise" in payload_dict and "expertise" in allowed_extras:
        updates["expertise"] = sanitize_and_validate_text(
            payload_dict["expertise"], "expertise", 300
        )

    return updates
