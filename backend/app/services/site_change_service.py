from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import (
    chat_repository,
    notification_repository,
    project_repository,
    site_change_repository,
)
from app.schemas.auth import UserResponse
from app.schemas.site_changes import (
    SiteChangeProposeRequest,
    SiteChangeRejectRequest,
    SiteChangeRequestCreate,
)
from app.services.site_change_redeploy_service import (
    cancel_site_change,
    redeploy_project,
)

from app.services.site_change_validation import validate_site_change_request

__all__ = [
    "request_site_change",
    "get_site_change",
    "propose_new_site",
    "reject_proposal",
    "approve_proposal",
    "redeploy_project",
    "cancel_site_change",
]


def request_site_change(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: SiteChangeRequestCreate,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if user.role != "Government Official" or project.get("created_by") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Government Official who created this project can request a site change.",
        )

    if project.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site change can only be requested for projects in OpenForResponse stage.",
        )

    open_change = site_change_repository.get_open_site_change(connection, project_id)
    if open_change:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A site change is already in progress for this project.",
        )

    norm_city, norm_city_name = validate_site_change_request(project, payload)

    with connection.transaction():
        change = site_change_repository.create_site_change(
            connection,
            project_id=project_id,
            reason=payload.reason,
            city=norm_city,
            city_name=norm_city_name,
            circle_lat=payload.circle_lat,
            circle_lng=payload.circle_lng,
            circle_radius_km=payload.circle_radius_km,
            created_by=user.id,
        )

        planner_id = project.get("planner_id")
        if planner_id:
            notification_repository.create_notification(
                connection,
                user_id=planner_id,
                project_id=project_id,
                kind="site_change_requested",
                message=f"Site change requested for {project['title']}",
                auto_commit=False,
            )

        try:
            chat_repository.create_message(
                connection,
                project_id,
                user.id,
                f"[System] Site change requested: {payload.reason}",
            )
        except Exception:
            pass

    return change


def get_site_change(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    is_creator = project.get("created_by") == user.id
    is_assigned = project.get("planner_id") == user.id
    if not (is_creator or is_assigned):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view site changes for this project.",
        )

    change = site_change_repository.get_latest_site_change(connection, project_id)
    if not change:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No site change found for this project.",
        )

    return change


def propose_new_site(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: SiteChangeProposeRequest,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if user.role != "Urban Planner" or project.get("planner_id") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned Urban Planner can propose candidate sites.",
        )

    if project.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project must be in OpenForResponse stage.",
        )

    change = site_change_repository.get_open_site_change(connection, project_id)
    if not change or change.get("status") not in ("requested", "rejected", "proposed"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No open site change awaiting proposal.",
        )

    c_lat = change.get("circle_lat")
    c_lng = change.get("circle_lng")
    c_rad = change.get("circle_radius_km")
    if c_lat is None or c_lng is None or c_rad is None:
        c_lat = project.get("site_area_lat")
        c_lng = project.get("site_area_lng")
        c_rad = project.get("site_area_radius_km")

    if c_lat is not None and c_lng is not None and c_rad is not None:
        radius_km = float(c_rad)
        is_within, dist_meters = site_change_repository.check_point_in_circle(
            connection,
            center_lat=float(c_lat),
            center_lng=float(c_lng),
            radius_km=radius_km,
            point_lat=payload.location_lat,
            point_lng=payload.location_lng,
        )
        if not is_within:
            dist_km = dist_meters / 1000.0
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Proposed site location is outside the allowed site area. Distance is {dist_km:.2f} km, which exceeds the allowed radius of {radius_km:.2f} km.",
            )

    with connection.transaction():
        updated = site_change_repository.update_site_change_propose(
            connection,
            change["id"],
            name=payload.name,
            explanation=payload.explanation,
            lat=payload.location_lat,
            lng=payload.location_lng,
        )
        notification_repository.create_notification(
            connection,
            user_id=project["created_by"],
            project_id=project_id,
            kind="site_change_proposed",
            message=f"New candidate site proposed for {project['title']}: {payload.name}",
            auto_commit=False,
        )

    return updated


def reject_proposal(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: SiteChangeRejectRequest,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if user.role != "Government Official" or project.get("created_by") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creating Government Official can reject proposals.",
        )

    change = site_change_repository.get_open_site_change(connection, project_id)
    if not change or change.get("status") != "proposed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No proposed candidate site to reject.",
        )

    with connection.transaction():
        updated = site_change_repository.update_site_change_status(
            connection,
            change["id"],
            status="rejected",
            rejection_reason=payload.reason,
        )
        planner_id = project.get("planner_id")
        if planner_id:
            notification_repository.create_notification(
                connection,
                user_id=planner_id,
                project_id=project_id,
                kind="site_change_rejected",
                message=f"Site proposal rejected for {project['title']}: {payload.reason}",
                auto_commit=False,
            )

    return updated


def approve_proposal(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if user.role != "Government Official" or project.get("created_by") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creating Government Official can approve proposals.",
        )

    change = site_change_repository.get_open_site_change(connection, project_id)
    if not change or change.get("status") != "proposed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No proposed candidate site to approve.",
        )

    with connection.transaction():
        updated = site_change_repository.update_site_change_status(
            connection,
            change["id"],
            status="approved",
        )
        planner_id = project.get("planner_id")
        if planner_id:
            notification_repository.create_notification(
                connection,
                user_id=planner_id,
                project_id=project_id,
                kind="site_change_approved",
                message=f"Site proposal approved for {project['title']}",
                auto_commit=False,
            )

    return updated
