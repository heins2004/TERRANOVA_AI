from datetime import datetime
from decimal import Decimal
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.repositories import project_repository
from app.schemas.auth import UserResponse
from app.services.project_date_rules import get_kolkata_today, to_kolkata_datetime


class DeployedProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(default=None, max_length=100)
    budget: Decimal | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Title cannot be empty.")
            return stripped
        return v

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v < 0:
            raise ValueError("Budget must be non-negative.")
        return v

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def validate_dates_input(cls, v: Any) -> datetime | None:
        return to_kolkata_datetime(v)


def edit_deployed_project(
    *,
    connection: Connection,
    user: UserResponse,
    project_id: int,
    payload: DeployedProjectUpdate,
) -> dict[str, Any]:
    existing = project_repository.get_project_by_id(connection, project_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    if user.role != "Government Official" or existing.get("created_by") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creating Government Official can edit deployed project details.",
        )

    if existing.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project details can only be edited after deployment while in 'OpenForResponse' stage (current stage: '{existing.get('stage')}').",
        )

    payload_dict = payload.model_dump(exclude_unset=True)

    title_changed = ("title" in payload_dict) and (payload_dict["title"] != existing.get("title"))
    desc_changed = ("description" in payload_dict) and ((payload_dict["description"] or None) != (existing.get("description") or None))
    cat_changed = ("category" in payload_dict) and ((payload_dict["category"] or None) != (existing.get("category") or None))

    stored_budget = existing.get("budget")
    budget_changed = False
    if "budget" in payload_dict:
        new_budget = payload_dict["budget"]
        if new_budget is None and stored_budget is not None:
            budget_changed = True
        elif new_budget is not None and stored_budget is None:
            budget_changed = True
        elif new_budget is not None and stored_budget is not None:
            if Decimal(str(new_budget)) != Decimal(str(stored_budget)):
                budget_changed = True

    stored_start_dt = to_kolkata_datetime(existing.get("start_date"))
    start_changed = ("start_date" in payload_dict) and (payload_dict["start_date"] != stored_start_dt)

    stored_end_dt = to_kolkata_datetime(existing.get("end_date"))
    end_changed = ("end_date" in payload_dict) and (payload_dict["end_date"] != stored_end_dt)

    updates: dict[str, Any] = {}
    changed_fields: list[str] = []

    if title_changed:
        updates["title"] = payload_dict["title"]
        changed_fields.append("title")
    if desc_changed:
        updates["description"] = payload_dict["description"]
        changed_fields.append("description")
    if cat_changed:
        updates["category"] = payload_dict["category"]
        changed_fields.append("category")
    if budget_changed:
        updates["budget"] = payload_dict["budget"]
        changed_fields.append("budget")
    if start_changed:
        updates["start_date"] = payload_dict["start_date"]
        changed_fields.append("start_date")
    if end_changed:
        updates["end_date"] = payload_dict["end_date"]
        changed_fields.append("end_date")

    if start_changed:
        new_start = updates["start_date"]
        if new_start is not None:
            today_kolkata = get_kolkata_today()
            if new_start.date() < today_kolkata:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be today or in the future.",
                )
            deadline = to_kolkata_datetime(existing.get("response_deadline"))
            if deadline is not None and new_start <= deadline:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be later than the response deadline.",
                )

    if start_changed or end_changed:
        eff_start = updates["start_date"] if start_changed else stored_start_dt
        eff_end = updates["end_date"] if end_changed else stored_end_dt
        if eff_start is not None and eff_end is not None:
            if eff_end <= eff_start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="End date must be after start date.",
                )

    if not changed_fields:
        return existing

    note = f"Project details edited: {', '.join(changed_fields)}"

    with connection.transaction():
        with connection.cursor() as cursor:
            assignments = [f"{field} = %s" for field in updates]
            cursor.execute(
                f"UPDATE projects SET {', '.join(assignments)}, updated_at = NOW() WHERE id = %s",
                (*updates.values(), project_id),
            )
            cursor.execute(
                """
                INSERT INTO project_events (project_id, actor_id, from_stage, to_stage, note, created_at)
                VALUES (%s, %s, 'OpenForResponse', 'OpenForResponse', %s, NOW())
                """,
                (project_id, user.id, note),
            )

    updated = project_repository.get_project_by_id(connection, project_id)
    return updated or existing
