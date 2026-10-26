from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import (
    notification_repository,
    project_repository,
    site_change_repository,
    workflow_repository,
)
from app.schemas.auth import UserResponse


def redeploy_project(
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
            detail="Only the creating Government Official can redeploy projects.",
        )

    if project.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project must be in OpenForResponse stage.",
        )

    change = site_change_repository.get_open_site_change(connection, project_id)
    if not change or change.get("status") != "approved":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site change must be approved before redeployment.",
        )

    old_site_name = project.get("proposed_site_name") or project.get("title")
    new_site_name = change.get("proposed_site_name")

    with connection.transaction():
        updates: dict[str, Any] = {
            "location_lat": change["proposed_site_lat"],
            "location_lng": change["proposed_site_lng"],
            "proposed_site_name": change["proposed_site_name"],
            "proposed_site_explanation": change["proposed_site_explanation"],
            "proposed_site_lat": change["proposed_site_lat"],
            "proposed_site_lng": change["proposed_site_lng"],
        }
        if change.get("city"):
            updates["city"] = change["city"]
        if change.get("city_name"):
            updates["city_name"] = change["city_name"]

        if change.get("circle_lat") is not None:
            updates["site_area_lat"] = change["circle_lat"]
            updates["site_area_lng"] = change["circle_lng"]
            updates["site_area_radius_km"] = change["circle_radius_km"]

        assignments = [f"{field} = %s" for field in updates]
        assignments.append("updated_at = NOW()")
        sql = f"UPDATE projects SET {', '.join(assignments)} WHERE id = %s"
        params = (*updates.values(), project_id)
        with connection.cursor() as cursor:
            cursor.execute(sql, params)

        updated_change = site_change_repository.update_site_change_status(
            connection,
            change["id"],
            status="completed",
        )

        note_parts = [f"Site changed and redeployed: {old_site_name} to {new_site_name}"]
        if change.get("city") and change["city"] != project.get("city"):
            old_city = project.get("city_name") or project.get("city")
            new_city = change.get("city_name") or change.get("city")
            note_parts.append(f"city changed from {old_city} to {new_city}")
        if change.get("circle_lat") is not None:
            note_parts.append("site area circle updated")
        event_note = "; ".join(note_parts)

        event = workflow_repository.create_project_event(
            connection,
            project_id=project_id,
            actor_id=user.id,
            from_stage="OpenForResponse",
            to_stage="OpenForResponse",
            note=event_note,
            auto_commit=False,
        )

        follower_ids = notification_repository.get_project_follower_user_ids(connection, project_id)
        recipients = [uid for uid in follower_ids if uid != user.id]
        if recipients:
            msg = f"Site updated for {project['title']}"
            notifs = [
                {
                    "user_id": uid,
                    "project_id": project_id,
                    "event_id": event.get("id") if event else None,
                    "kind": "site_updated",
                    "message": msg,
                }
                for uid in recipients
            ]
            notification_repository.create_notifications_batch(connection, notifs, auto_commit=False)

    return updated_change


def cancel_site_change(
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
            detail="Only the creating Government Official can cancel site changes.",
        )

    if project.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project must be in OpenForResponse stage.",
        )

    change = site_change_repository.get_open_site_change(connection, project_id)
    if not change:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No open site change to cancel.",
        )

    with connection.transaction():
        updated = site_change_repository.update_site_change_status(
            connection,
            change["id"],
            status="cancelled",
        )

        workflow_repository.create_project_event(
            connection,
            project_id=project_id,
            actor_id=user.id,
            from_stage="OpenForResponse",
            to_stage="OpenForResponse",
            note="Site change cancelled",
            auto_commit=False,
        )

        planner_id = project.get("planner_id")
        if planner_id:
            notification_repository.create_notification(
                connection,
                user_id=planner_id,
                project_id=project_id,
                kind="site_change_cancelled",
                message=f"Site change cancelled for {project['title']}",
                auto_commit=False,
            )

    return updated
