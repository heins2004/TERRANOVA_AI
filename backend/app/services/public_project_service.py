import math
from datetime import datetime, timezone
from typing import Any

import psycopg

from app.core.cities import CITIES
from app.repositories.public_project_repository import (
    get_public_projects as repo_get_public_projects,
    get_public_project_by_id as repo_get_public_project_by_id,
)
from app.schemas.public import PublicProjectItem, PublicProjectsResponse

CITY_NAME_MAP = {c["slug"]: c["name"] for c in CITIES}


def resolve_city_name(city_slug: str | None) -> str | None:
    if not city_slug:
        return None
    slug_normalized = city_slug.strip().lower()
    if slug_normalized in CITY_NAME_MAP:
        return CITY_NAME_MAP[slug_normalized]
    return city_slug.strip().title()


def compute_days_left(stage: str, response_deadline: datetime | None) -> int | None:
    if stage != "OpenForResponse" or response_deadline is None:
        return None
    now = datetime.now(timezone.utc)
    if response_deadline.tzinfo is None:
        response_deadline = response_deadline.replace(tzinfo=timezone.utc)
    seconds_left = (response_deadline - now).total_seconds()
    if seconds_left <= 0:
        return 0
    return max(0, int(math.ceil(seconds_left / 86400)))


def serialize_public_project(row: dict[str, Any]) -> PublicProjectItem:
    stage = row["stage"]
    response_deadline = row.get("response_deadline")
    days_left = compute_days_left(stage, response_deadline)
    halt_reason = row.get("halt_reason") if stage == "Halted" else None

    budget = row.get("budget")
    if budget is not None:
        budget = float(budget)

    city_slug = row.get("city")
    city_name = resolve_city_name(city_slug)

    return PublicProjectItem(
        id=row["id"],
        title=row["title"],
        description=row.get("description"),
        category=row.get("category"),
        city=city_slug,
        city_name=city_name,
        location_lat=row.get("location_lat"),
        location_lng=row.get("location_lng"),
        budget=budget,
        start_date=row.get("start_date"),
        end_date=row.get("end_date"),
        stage=stage,
        response_deadline=response_deadline,
        days_left=days_left,
        halt_reason=halt_reason,
        is_demo=bool(row.get("is_demo", False)),
    )


def list_public_projects(
    conn: psycopg.Connection,
    *,
    q: str | None = None,
    category: str | None = None,
    past: bool = False,
    sort: str = "new",
    limit: int = 24,
    offset: int = 0,
) -> PublicProjectsResponse:
    rows, total = repo_get_public_projects(
        conn,
        q=q,
        category=category,
        past=past,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    items = [serialize_public_project(r) for r in rows]
    return PublicProjectsResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


def get_public_project(
    conn: psycopg.Connection,
    project_id: int,
) -> PublicProjectItem | None:
    row = repo_get_public_project_by_id(conn, project_id)
    if not row:
        return None
    return serialize_public_project(row)
