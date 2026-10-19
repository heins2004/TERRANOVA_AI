from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import (
    notification_repository,
    project_consultation_repository as repo,
    project_repository,
)
from app.schemas.auth import UserResponse
from app.schemas.project_consultation import (
    ConsultationCancelRequest,
    ConsultationCreateRequest,
    ConsultationUpdateRequest,
)
from app.services import notification_service

DEPLOYED_MANAGEMENT_STAGES = ("OpenForResponse", "InProgress")
PUBLIC_DEPLOYED_STAGES = ("OpenForResponse", "InProgress", "Completed", "Halted")


def _ensure_future_time(dt: datetime) -> None:
    now = datetime.now(timezone.utc)
    check_dt = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    if check_dt <= now:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Consultation start time must be in the future.",
        )


def _check_owner_and_stage(
    project: dict[str, Any],
    user: UserResponse,
) -> None:
    if user.role != "Government Official" or project["created_by"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning Government Official can manage consultations for this project.",
        )
    if project["stage"] not in DEPLOYED_MANAGEMENT_STAGES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Consultations can only be managed when the project stage is 'OpenForResponse' or 'InProgress'. Current stage: '{project['stage']}'.",
        )


def create_consultation(
    connection: Connection,
    *,
    project_id: int,
    user: UserResponse,
    payload: ConsultationCreateRequest,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    _check_owner_and_stage(project, user)
    _ensure_future_time(payload.starts_at)

    city = project.get("city") or "bengaluru"

    with connection.transaction():
        consultation = repo.create_consultation(
            connection,
            project_id=project_id,
            title=payload.title,
            description=payload.description,
            starts_at=payload.starts_at,
            duration_minutes=payload.duration_minutes,
            type=payload.type,
            meeting_url=payload.meeting_url if payload.type == "Online" else None,
            venue_address=payload.venue_address if payload.type == "Venue" else None,
            city=city,
            max_attendees=payload.max_attendees,
            visibility=payload.visibility,
            created_by=user.id,
        )

        invited_emails: list[str] = []
        not_found_emails: list[str] = []
        invite_user_ids: list[int] = []

        if payload.visibility == "Private" and payload.invite_emails:
            clean_emails = [e.strip().lower() for e in payload.invite_emails if e.strip()]
            active_citizens_map = repo.get_active_citizens_by_emails(connection, clean_emails)
            for orig_email in payload.invite_emails:
                norm = orig_email.strip().lower()
                if norm in active_citizens_map:
                    invited_emails.append(orig_email.strip())
                    invite_user_ids.append(active_citizens_map[norm])
                else:
                    not_found_emails.append(orig_email.strip())

            if invite_user_ids:
                repo.set_consultation_invites(connection, consultation["id"], invite_user_ids)

        # Dispatch notifications
        if payload.visibility == "Public":
            followers = notification_repository.get_project_follower_user_ids(connection, project_id)
            notification_service.dispatch_consultation_notifications(
                connection,
                project=project,
                consultation=consultation,
                notification_kind="consultation_created",
                recipient_user_ids=followers,
                actor_id=user.id,
            )
        else:
            recipients = list(invite_user_ids)
            if project.get("planner_id"):
                recipients.append(project["planner_id"])
            notification_service.dispatch_consultation_notifications(
                connection,
                project=project,
                consultation=consultation,
                notification_kind="consultation_created",
                recipient_user_ids=recipients,
                actor_id=user.id,
            )

    consultation["invite_count"] = len(invite_user_ids)
    consultation["invite_emails"] = invited_emails if payload.visibility == "Private" else None
    consultation["invited_emails"] = invited_emails if payload.visibility == "Private" else None
    consultation["not_found_emails"] = not_found_emails if payload.visibility == "Private" else None
    return consultation


def update_consultation(
    connection: Connection,
    *,
    project_id: int,
    consultation_id: int,
    user: UserResponse,
    payload: ConsultationUpdateRequest,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    _check_owner_and_stage(project, user)

    existing = repo.get_consultation_by_id(connection, consultation_id)
    if not existing or existing["project_id"] != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found for this project.",
        )

    if existing["status"] == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot edit a cancelled consultation.",
        )

    if payload.starts_at is not None:
        _ensure_future_time(payload.starts_at)

    effective_type = payload.type or existing["type"]
    effective_url = payload.meeting_url if payload.meeting_url is not None else existing.get("meeting_url")
    effective_venue = payload.venue_address if payload.venue_address is not None else existing.get("venue_address")

    if effective_type == "Online":
        if payload.venue_address is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Venue address must not be set for Online consultations.",
            )
        if not effective_url:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Meeting URL is required for Online consultations.",
            )
        effective_venue = None
    elif effective_type == "Venue":
        if payload.meeting_url is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Meeting URL must not be set for Venue consultations.",
            )
        if not effective_venue:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Venue address is required for Venue consultations.",
            )
        effective_url = None

    if existing["visibility"] == "Public" and payload.invite_emails is not None and len(payload.invite_emails) > 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A Public consultation must not have private invite emails.",
        )

    updates: dict[str, Any] = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.starts_at is not None:
        updates["starts_at"] = payload.starts_at
    if payload.duration_minutes is not None:
        updates["duration_minutes"] = payload.duration_minutes
    if payload.type is not None:
        updates["type"] = payload.type
    if effective_type == "Online":
        updates["meeting_url"] = effective_url
        updates["venue_address"] = None
    else:
        updates["venue_address"] = effective_venue
        updates["meeting_url"] = None
    if payload.max_attendees is not None:
        updates["max_attendees"] = payload.max_attendees

    time_changed = payload.starts_at is not None and payload.starts_at != existing["starts_at"]
    place_changed = (
        (payload.type is not None and payload.type != existing["type"])
        or (effective_type == "Online" and payload.meeting_url is not None and payload.meeting_url != existing.get("meeting_url"))
        or (effective_type == "Venue" and payload.venue_address is not None and payload.venue_address != existing.get("venue_address"))
    )

    with connection.transaction():
        updated = repo.update_consultation_fields(connection, consultation_id, updates)

        invited_emails: list[str] | None = None
        not_found_emails: list[str] | None = None
        if existing["visibility"] == "Private" and payload.invite_emails is not None:
            clean_emails = [e.strip().lower() for e in payload.invite_emails if e.strip()]
            active_citizens_map = repo.get_active_citizens_by_emails(connection, clean_emails)
            invited_emails = []
            not_found_emails = []
            invite_user_ids: list[int] = []
            for orig_email in payload.invite_emails:
                norm = orig_email.strip().lower()
                if norm in active_citizens_map:
                    invited_emails.append(orig_email.strip())
                    invite_user_ids.append(active_citizens_map[norm])
                else:
                    not_found_emails.append(orig_email.strip())
            repo.set_consultation_invites(connection, consultation_id, invite_user_ids)

        if time_changed or place_changed:
            if existing["visibility"] == "Public":
                followers = notification_repository.get_project_follower_user_ids(connection, project_id)
                notification_service.dispatch_consultation_notifications(
                    connection,
                    project=project,
                    consultation=updated,
                    notification_kind="consultation_updated",
                    recipient_user_ids=followers,
                    actor_id=user.id,
                )
            else:
                invite_uids = repo.get_consultation_invite_user_ids(connection, consultation_id)
                recipients = list(invite_uids)
                if project.get("planner_id"):
                    recipients.append(project["planner_id"])
                notification_service.dispatch_consultation_notifications(
                    connection,
                    project=project,
                    consultation=updated,
                    notification_kind="consultation_updated",
                    recipient_user_ids=recipients,
                    actor_id=user.id,
                )

    count = repo.get_consultation_invite_count(connection, consultation_id)
    updated["invite_count"] = count
    updated["invite_emails"] = repo.get_consultation_invite_emails(connection, consultation_id) if existing["visibility"] == "Private" else None
    updated["invited_emails"] = invited_emails
    updated["not_found_emails"] = not_found_emails
    return updated


def cancel_consultation(
    connection: Connection,
    *,
    project_id: int,
    consultation_id: int,
    user: UserResponse,
    payload: ConsultationCancelRequest,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    _check_owner_and_stage(project, user)

    existing = repo.get_consultation_by_id(connection, consultation_id)
    if not existing or existing["project_id"] != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found for this project.",
        )

    if existing["status"] == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Consultation is already cancelled.",
        )

    with connection.transaction():
        cancelled = repo.cancel_consultation(connection, consultation_id, payload.reason)

        if existing["visibility"] == "Public":
            followers = notification_repository.get_project_follower_user_ids(connection, project_id)
            notification_service.dispatch_consultation_notifications(
                connection,
                project=project,
                consultation=cancelled,
                notification_kind="consultation_cancelled",
                recipient_user_ids=followers,
                actor_id=user.id,
            )
        else:
            invite_uids = repo.get_consultation_invite_user_ids(connection, consultation_id)
            recipients = list(invite_uids)
            if project.get("planner_id"):
                recipients.append(project["planner_id"])
            notification_service.dispatch_consultation_notifications(
                connection,
                project=project,
                consultation=cancelled,
                notification_kind="consultation_cancelled",
                recipient_user_ids=recipients,
                actor_id=user.id,
            )

    cancelled["invite_count"] = repo.get_consultation_invite_count(connection, consultation_id)
    cancelled["invite_emails"] = repo.get_consultation_invite_emails(connection, consultation_id) if existing["visibility"] == "Private" else None
    return cancelled


def get_consultations_authenticated(
    connection: Connection,
    *,
    project_id: int,
    user: UserResponse,
) -> list[dict[str, Any]]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    is_owner_official = user.role == "Government Official" and project["created_by"] == user.id
    is_assigned_planner = user.role == "Urban Planner" and project.get("planner_id") == user.id

    if is_owner_official:
        items = repo.list_project_consultations_all(connection, project_id)
        for item in items:
            if item["visibility"] == "Private":
                item["invite_emails"] = repo.get_consultation_invite_emails(connection, item["id"])
                item["invite_count"] = len(item["invite_emails"])
            else:
                item["invite_emails"] = None
                item["invite_count"] = None
        return items

    if is_assigned_planner:
        items = repo.list_project_consultations_all(connection, project_id)
        for item in items:
            item["invite_emails"] = None
            if item["visibility"] == "Private":
                item["invite_count"] = repo.get_consultation_invite_count(connection, item["id"])
            else:
                item["invite_count"] = None
        return items

    if user.role == "Citizen":
        items = repo.list_project_consultations_for_citizen(connection, project_id, user.id)
        for item in items:
            item["invite_emails"] = None
            item["invite_count"] = None
        return items

    # Other roles (admin, non-assigned planner, non-owner official)
    items = repo.list_project_consultations_public_only(connection, project_id)
    for item in items:
        item["invite_emails"] = None
        item["invite_count"] = None
    return items


def get_public_consultations(
    connection: Connection,
    *,
    project_id: int,
) -> list[dict[str, Any]]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project or project["stage"] not in PUBLIC_DEPLOYED_STAGES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public project not found.",
        )

    items = repo.list_project_consultations_public_only(connection, project_id)
    # Sanitize fields for public output
    result = []
    for item in items:
        result.append({
            "id": item["id"],
            "project_id": item["project_id"],
            "title": item["title"],
            "description": item["description"],
            "starts_at": item["starts_at"],
            "duration_minutes": item["duration_minutes"],
            "type": item["type"],
            "meeting_url": item["meeting_url"],
            "venue_address": item["venue_address"],
            "max_attendees": item["max_attendees"],
            "status": item["status"],
            "cancel_reason": item["cancel_reason"],
        })
    return result
