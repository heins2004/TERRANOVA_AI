from datetime import date, datetime, time
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


def to_kolkata_datetime(d: Any) -> datetime | None:
    """Convert a date, datetime, or ISO string to a timezone-aware datetime in Asia/Kolkata.
    Plain date objects or date strings default to 12:00 IST.
    """
    if d is None:
        return None
    if isinstance(d, datetime):
        tz_dt = d if d.tzinfo else d.replace(tzinfo=KOLKATA_TZ)
        return tz_dt.astimezone(KOLKATA_TZ)
    if isinstance(d, date):
        return datetime.combine(d, time(12, 0, 0), tzinfo=KOLKATA_TZ)
    if isinstance(d, str):
        val = d.strip()
        if not val:
            return None
        if "T" in val:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                return dt.replace(tzinfo=KOLKATA_TZ)
            return dt.astimezone(KOLKATA_TZ)
        parsed_d = date.fromisoformat(val)
        return datetime.combine(parsed_d, time(12, 0, 0), tzinfo=KOLKATA_TZ)
    return None


def format_ist_iso(dt: Any) -> str | None:
    """Serialize datetime/date to ISO string with +05:30 timezone offset."""
    res = to_kolkata_datetime(dt)
    return res.isoformat() if res is not None else None


def to_kolkata_date(d: Any) -> date | None:
    """Convert a date, datetime, or ISO string to a calendar date in Asia/Kolkata."""
    dt = to_kolkata_datetime(d)
    return dt.date() if dt is not None else None


def validate_create_dates(values: dict[str, Any], clock: Any = None) -> None:
    """Rule 1: start_date >= today (date-level check).
    Rule 3: end_date > start_date (exact datetimes).
    """
    s_dt = to_kolkata_datetime(values.get("start_date"))
    e_dt = to_kolkata_datetime(values.get("end_date"))
    today = get_kolkata_today(clock)

    if s_dt is not None and s_dt.date() < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be today or in the future.",
        )

    if s_dt is not None and e_dt is not None:
        if e_dt <= s_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date.",
            )


def validate_update_dates(
    values: dict[str, Any],
    existing: dict[str, Any],
    clock: Any = None,
) -> None:
    """Rule 2: In pre-deployment stages, if start_date differs from stored,
       start_date >= today (date-level check).
    Rule 3: end_date > start_date (exact datetimes).
    Rule 5: Edits to already deployed projects are NOT date-checked and stored dates
       are never rewritten.
    """
    stage = existing.get("stage")

    if stage in DEPLOYED_STAGES:
        values.pop("start_date", None)
        values.pop("end_date", None)
        return

    stored_start = to_kolkata_datetime(existing.get("start_date"))
    stored_end = to_kolkata_datetime(existing.get("end_date"))

    has_start = "start_date" in values
    has_end = "end_date" in values

    new_start = to_kolkata_datetime(values.get("start_date")) if has_start else stored_start
    new_end = to_kolkata_datetime(values.get("end_date")) if has_end else stored_end

    start_changed = has_start and (new_start != stored_start)
    end_changed = has_end and (new_end != stored_end)

    if stage in PRE_DEPLOYMENT_STAGES:
        if start_changed:
            today = get_kolkata_today(clock)
            if new_start is not None and new_start.date() < today:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Start date must be today or in the future.",
                )

    if (start_changed or end_changed) and new_start is not None and new_end is not None:
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
    """Rule 4: Deploy: start_date must be later than the response_deadline datetime."""
    s_dt = to_kolkata_datetime(project.get("start_date"))
    r_dt = to_kolkata_datetime(response_deadline)

    if s_dt is None or r_dt is None or s_dt <= r_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be after the response deadline. Edit the project start date first.",
        )


def validate_planner_deadline(
    project: dict[str, Any],
    planner_deadline: Any,
    clock: Any = None,
) -> None:
    """Validate planner proposal deadline:
    1. Must be strictly in the future (exact datetime).
    2. Must be strictly before the project's start_date (if start_date is set).
    """
    if planner_deadline is None:
        return

    p_dt = to_kolkata_datetime(planner_deadline)
    if p_dt is None:
        return

    now_dt = datetime.now(KOLKATA_TZ) if clock is None else (to_kolkata_datetime(clock) or datetime.now(KOLKATA_TZ))
    if p_dt <= now_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal deadline must be in the future.",
        )

    s_dt = to_kolkata_datetime(project.get("start_date"))
    if s_dt is not None and s_dt <= p_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal deadline must be before the project start date.",
        )

