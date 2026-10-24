from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import notification_repository, project_repository, workflow_repository
from app.schemas.auth import UserResponse
from app.services import project_date_rules


def extend_response_deadline(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    new_deadline: datetime,
) -> dict[str, Any]:
    """Extend the response deadline for an OpenForResponse project.

    Rules:
      - Caller must be Government Official
      - Caller must be the creator of the project
      - Stage must be OpenForResponse
      - new_deadline must be in the future
      - new_deadline must be strictly later than current response_deadline
      - new_deadline date must be before project start_date (reuses project_date_rules)
    """
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can extend deadlines.",
        )

    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    if project.get("created_by") != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Government Official who created the project can extend its deadline.",
        )

    if project.get("stage") != "OpenForResponse":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project must be in OpenForResponse stage to extend deadline.",
        )

    now = datetime.now(timezone.utc)
    new_tz = new_deadline if new_deadline.tzinfo else new_deadline.replace(tzinfo=timezone.utc)
    if new_tz <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extended deadline must be in the future.",
        )

    cur_deadline = project.get("response_deadline")
    if cur_deadline:
        cur_tz = cur_deadline if cur_deadline.tzinfo else cur_deadline.replace(tzinfo=timezone.utc)
        if new_tz <= cur_tz:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extended deadline must be strictly later than current deadline.",
            )

    # Validate that new_deadline date is before project start_date (reuses Rule 4 from project_date_rules)
    project_date_rules.validate_deploy_dates(project, new_deadline)

    now_local = datetime.now(timezone.utc)
    with connection.cursor() as cursor:
        cursor.execute(
            """
            UPDATE projects
            SET response_deadline = %s, updated_at = %s
            WHERE id = %s
            """,
            (new_deadline, now_local, project_id),
        )

    event = workflow_repository.create_project_event(
        connection,
        project_id=project_id,
        actor_id=user.id,
        from_stage="OpenForResponse",
        to_stage="OpenForResponse",
        note=f"Response deadline extended to {new_deadline.isoformat()}",
        auto_commit=False,
    )

    # Rule 2: notify every follower except the acting official
    follower_ids = notification_repository.get_project_follower_user_ids(connection, project_id)
    recipients = [uid for uid in follower_ids if uid != user.id]
    if recipients:
        msg = f'Response deadline for project "{project["title"]}" has been extended.'
        notifs = [
            {
                "user_id": uid,
                "project_id": project_id,
                "event_id": event.get("id") if event else None,
                "kind": "deadline_extended",
                "message": msg,
            }
            for uid in recipients
        ]
        notification_repository.create_notifications_batch(connection, notifs, auto_commit=False)

    connection.commit()

    updated = project_repository.get_project_by_id(connection, project_id)
    return updated or project
