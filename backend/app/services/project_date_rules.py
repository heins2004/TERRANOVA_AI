from datetime import date, datetime
from typing import Any
import zoneinfo
from fastapi import HTTPException, status

KOLKATA_TZ = zoneinfo.ZoneInfo("Asia/Kolkata")

PRE_DEPLOYMENT_STAGES = {
    "Draft",
    "Planner invited",
    "Site proposed",
    "Under consideration",
    "Approved",
}

DEPLOYED_STAGES = {
    "OpenForResponse",
    "InProgress",
    "Completed",
    "Halted",
    "Recalled",
}


def get_kolkata_today(clock: Any = None) -> date:
    """Return the current calendar date in Asia/Kolkata, with injectable clock."""
    if clock is not None:
        if isinstance(clock, date) and not isinstance(clock, datetime):
            return clock
        if isinstance(clock, datetime):
            tz_dt = clock if clock.tzinfo else clock.replace(tzinfo=KOLKATA_TZ)
            return tz_dt.astimezone(KOLKATA_TZ).date()
    return datetime.now(KOLKATA_TZ).date()


def to_kolkata_date(d: Any) -> date | None:
    """Convert a date, datetime, or ISO string to a calendar date in Asia/Kolkata."""
    if d is None:
        return None
    if isinstance(d, datetime):
        tz_dt = d if d.tzinfo else d.replace(tzinfo=KOLKATA_TZ)
        return tz_dt.astimezone(KOLKATA_TZ).date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        val = d.strip()
        if not val:
            return None
        if "T" in val:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            return to_kolkata_date(dt)
        return date.fromisoformat(val)
    return None


def validate_create_dates(values: dict[str, Any], clock: Any = None) -> None:
    """Rule 1: start_date >= today.
    Rule 3: end_date > start_date.
    """
    s_date = to_kolkata_date(values.get("start_date"))
    e_date = to_kolkata_date(values.get("end_date"))
    today = get_kolkata_today(clock)

    if s_date is not None and s_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be today or in the future.",
        )

    if s_date is not None and e_date is not None:
        if e_date <= s_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date.",
            )


def validate_update_dates(
    values: dict[str, Any],
    existing: dict[str, Any],
    clock: Any = None,
) -> None:
    """Rule 2: In pre-deployment stages, if start_date or end_date differs from stored,
       start_date >= today.
    Rule 3: end_date > start_date.
    Rule 5: Edits to already deployed projects are NOT date-checked and stored dates
       are never rewritten.
    """
    stage = existing.get("stage")

    if stage in DEPLOYED_STAGES:
        # Rule 5: Deployed projects dates cannot be modified, no date checks
        values.pop("start_date", None)
        values.pop("end_date", None)
        return

    stored_start = to_kolkata_date(existing.get("start_date"))
    stored_end = to_kolkata_date(existing.get("end_date"))

    has_start = "start_date" in values
    has_end = "end_date" in values

    new_start = to_kolkata_date(values.get("start_date")) if has_start else stored_start
    new_end = to_kolkata_date(values.get("end_date")) if has_end else stored_end

    start_changed = has_start and (new_start != stored_start)
    end_changed = has_end and (new_end != stored_end)

    if stage in PRE_DEPLOYMENT_STAGES:
        if start_changed or end_changed:
            today = get_kolkata_today(clock)
            if new_start is not None and new_start < today:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be today or in the future.",
                )

    if new_start is not None and new_end is not None:
        if new_end <= new_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date.",
            )


def validate_deploy_dates(
    project: dict[str, Any],
    response_deadline: Any,
    clock: Any = None,
) -> None:
    """Rule 4: Deploy: start_date must be later than the response_deadline date."""
    s_date = to_kolkata_date(project.get("start_date"))
    r_date = to_kolkata_date(response_deadline)

    if s_date is None or r_date is None or s_date <= r_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be after the response deadline. Edit the project start date first.",
        )
