from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import notification_repository
from app.schemas.auth import UserResponse
from app.schemas.notification import (
    NotificationItem,
    NotificationListResponse,
    NotificationReadResponse,
)


def get_project_link_kind(role: str) -> str:
    if role == "Government Official":
        return "gov"
    if role == "Urban Planner":
        return "planner"
    return "public"


def get_my_notifications(
    connection: Connection,
    *,
    user: UserResponse,
    limit: int = 20,
    offset: int = 0,
) -> NotificationListResponse:
    if limit < 1 or limit > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Limit must be between 1 and 50.",
        )
    if offset < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Offset must be non-negative.",
        )

    rows, unread_count = notification_repository.get_notifications_for_user(
        connection,
        user_id=user.id,
        limit=limit,
        offset=offset,
    )

    link_kind = get_project_link_kind(user.role)
    items = [
        NotificationItem(
            id=r["id"],
            project_id=r["project_id"],
            kind=r["kind"],
            message=r["message"],
            created_at=r["created_at"],
            is_read=r["read_at"] is not None,
            project_link_kind=link_kind,
        )
        for r in rows
    ]

    return NotificationListResponse(items=items, unread_count=unread_count)


def mark_notification_as_read(
    connection: Connection,
    *,
    user: UserResponse,
    notification_id: int,
) -> NotificationReadResponse:
    updated = notification_repository.mark_notification_read(
        connection,
        notification_id=notification_id,
        user_id=user.id,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    return NotificationReadResponse(id=notification_id, is_read=True)


def mark_all_as_read(
    connection: Connection,
    *,
    user: UserResponse,
) -> dict[str, str]:
    notification_repository.mark_all_notifications_read(
        connection,
        user_id=user.id,
    )
    return {"message": "All notifications marked as read."}


NOTIFICATION_TEMPLATES = {
    "planner_invited": lambda p, r: f"You have been invited to plan project \"{p['title']}\".",
    "invite_accepted": lambda p, r: f"Urban Planner accepted the invitation for project \"{p['title']}\".",
    "invite_declined": lambda p, r: f"Urban Planner declined the invitation for project \"{p['title']}\".",
    "site_proposed": lambda p, r: f"A candidate site proposal was submitted for project \"{p['title']}\".",
    "proposal_rejected": lambda p, r: f"The site proposal for project \"{p['title']}\" was rejected.",
    "proposal_approved": lambda p, r: f"The site proposal for project \"{p['title']}\" has been approved.",
    "planner_permission_granted": lambda p, r: f"Urban Planner granted deployment permission for project \"{p['title']}\".",
    "invite_cancelled": lambda p, r: f"The invitation for project \"{p['title']}\" has been cancelled.",
    "planner_reassigned": lambda p, r: f"Your assignment on project \"{p['title']}\" has been cancelled.",
    "project_deployed": lambda p, r: f"Project \"{p['title']}\" is now open for public consultation.",
    "deadline_extended": lambda p, r: f"Response deadline for project \"{p['title']}\" has been extended.",
    "stage_in_progress": lambda p, r: f"Project \"{p['title']}\" has moved to In Progress.",
    "project_completed": lambda p, r: f"Project \"{p['title']}\" has been completed.",
    "project_halted": lambda p, r: f"Project \"{p['title']}\" has been halted: {r or 'No reason provided.'}",
    "project_recalled": lambda p, r: f"Project \"{p['title']}\" has been recalled: {r or 'No reason provided.'}",
    "consultation_created": lambda p, c: f"A consultation \"{c['title']}\" was scheduled for project \"{p['title']}\".",
    "consultation_updated": lambda p, c: f"Consultation \"{c['title']}\" for project \"{p['title']}\" has been updated.",
    "consultation_cancelled": lambda p, c: f"Consultation \"{c['title']}\" for project \"{p['title']}\" was cancelled: {c.get('cancel_reason') or 'No reason provided.'}",
}


def dispatch_stage_notifications(
    connection: Connection,
    *,
    project: dict,
    event_id: int,
    actor_id: int,
    notification_kind: str | None,
    notification_target_user_ids: list[int] | None = None,
    public_reason: str | None = None,
) -> None:
    if not notification_kind:
        return

    recipients: list[int] = []
    if notification_target_user_ids is not None:
        recipients = list(notification_target_user_ids)
    else:
        if notification_kind in (
            "project_deployed",
            "deadline_extended",
            "stage_in_progress",
            "project_completed",
            "project_halted",
            "project_recalled",
        ):
            followers = notification_repository.get_project_follower_user_ids(
                connection, project["id"]
            )
            recipients.extend(followers)
            if project.get("planner_id"):
                recipients.append(project["planner_id"])
        elif notification_kind == "planner_invited":
            if project.get("planner_id"):
                recipients.append(project["planner_id"])
        elif notification_kind in (
            "invite_accepted",
            "invite_declined",
            "site_proposed",
            "planner_permission_granted",
        ):
            recipients.append(project["created_by"])
        elif notification_kind in ("proposal_rejected", "proposal_approved"):
            if project.get("planner_id"):
                recipients.append(project["planner_id"])

    # Enforce: Nobody is notified about their own action
    deduped = [
        uid
        for uid in dict.fromkeys(recipients)
        if uid is not None and uid != actor_id
    ]
    if not deduped:
        return

    template_fn = NOTIFICATION_TEMPLATES.get(notification_kind)
    if not template_fn:
        return

    msg = template_fn(project, public_reason)
    notifications = [
        {
            "user_id": uid,
            "project_id": project["id"],
            "event_id": event_id,
            "kind": notification_kind,
            "message": msg,
        }
        for uid in deduped
    ]
    notification_repository.create_notifications_batch(
        connection, notifications, auto_commit=False
    )


def dispatch_consultation_notifications(
    connection: Connection,
    *,
    project: dict,
    consultation: dict,
    notification_kind: str,
    recipient_user_ids: list[int],
    actor_id: int,
) -> None:
    deduped = [
        uid
        for uid in dict.fromkeys(recipient_user_ids)
        if uid is not None and uid != actor_id
    ]
    if not deduped:
        return

    template_fn = NOTIFICATION_TEMPLATES.get(notification_kind)
    if not template_fn:
        return

    msg = template_fn(project, consultation)
    notifications = [
        {
            "user_id": uid,
            "project_id": project["id"],
            "event_id": None,
            "kind": notification_kind,
            "message": msg,
        }
        for uid in deduped
    ]
    notification_repository.create_notifications_batch(
        connection, notifications, auto_commit=False
    )

