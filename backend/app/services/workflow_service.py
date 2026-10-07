from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from psycopg import Connection

from app.core.cities import CITY_SLUGS
from app.repositories import project_repository, workflow_repository
from app.schemas.auth import UserResponse
from app.schemas.workflow import (
    DeployRequest,
    ExtendDeadlineRequest,
    InvitePlannerRequest,
    PlannerSearchItem,
    ProjectCreateWorkflow,
    ReasonRequest,
    ReassignPlannerRequest,
    SiteProposalRequest,
)

# Allowed stage transitions map: from_stage -> set of (to_stage, allowed_actor_role)
ALLOWED_TRANSITIONS = {
    ("Draft", "Planner invited"): "Government Official",
    ("Planner invited", "Draft"): {"Government Official", "Urban Planner"},
    ("Planner invited", "Site proposed"): "Urban Planner",
    ("Planner invited", "Planner invited"): "Government Official",      # Reassign planner
    ("Site proposed", "Under consideration"): "Government Official",
    ("Site proposed", "Planner invited"): "Government Official",        # Reassign planner
    ("Under consideration", "Planner invited"): "Government Official",  # Rejection or Reassign
    ("Under consideration", "Approved"): "Government Official",         # Approval
    ("Approved", "OpenForResponse"): "Government Official",             # Deploy
    ("Approved", "Planner invited"): "Government Official",             # Reassign planner
    ("Approved", "Draft"): "Government Official",                       # Reassign planner after deadline
    ("OpenForResponse", "InProgress"): "Government Official",
    ("InProgress", "Completed"): "Government Official",
    ("OpenForResponse", "Halted"): "Government Official",
    ("OpenForResponse", "Recalled"): "Government Official",
}


def transition_project_stage(
    connection: Connection,
    *,
    project_id: int,
    actor_id: int,
    actor_role: str,
    to_stage: str,
    note: str | None = None,
    extra_updates: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Central transition function for government workflow.
    Validates from_stage -> to_stage legality and actor role & ownership.
    Writes a row to project_events and updates the project.
    Illegal transitions return 409. Wrong owner or role returns 403.
    """
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    from_stage = project["stage"]
    key = (from_stage, to_stage)

    if key not in ALLOWED_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Illegal stage transition from '{from_stage}' to '{to_stage}'.",
        )

    allowed_role_or_roles = ALLOWED_TRANSITIONS[key]
    if isinstance(allowed_role_or_roles, str):
        allowed_roles = {allowed_role_or_roles}
    else:
        allowed_roles = set(allowed_role_or_roles)

    if actor_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the required role for this transition.",
        )

    # Ownership checks:
    if actor_role == "Government Official" and project["created_by"] != actor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning Government Official can perform this transition.",
        )
    elif actor_role == "Urban Planner":
        # For planner-initiated transitions, ensure actor is the assigned/invited planner
        active_invite = workflow_repository.get_active_project_invite(connection, project_id)
        is_assigned = project.get("planner_id") == actor_id
        is_invited = active_invite is not None and active_invite["planner_id"] == actor_id
        if not (is_assigned or is_invited):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM project_invites WHERE project_id = %s AND planner_id = %s LIMIT 1",
                    (project_id, actor_id),
                )
                has_invite = cursor.fetchone() is not None
            if not has_invite:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the assigned/invited Urban Planner can perform this transition.",
                )

    updates = dict(extra_updates or {})
    updates["stage"] = to_stage

    updated = workflow_repository.update_project_fields(connection, project_id, updates)
    workflow_repository.create_project_event(
        connection,
        project_id=project_id,
        actor_id=actor_id,
        from_stage=from_stage,
        to_stage=to_stage,
        note=note,
    )
    return updated


def search_planners(
    connection: Connection,
    *,
    user: UserResponse,
    q: str,
) -> list[PlannerSearchItem]:
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can search planners.",
        )
    clean_q = q.strip()
    if len(clean_q) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Search query must be at least 2 characters.",
        )
    results = workflow_repository.search_planners(connection, q=clean_q, limit=10)
    return [PlannerSearchItem(**r) for r in results]


def create_project(
    connection: Connection,
    *,
    user: UserResponse,
    payload: ProjectCreateWorkflow,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can create projects.",
        )
    if payload.city not in CITY_SLUGS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="City must be a supported city slug.",
        )

    values = payload.model_dump()
    row = project_repository.create_project(
        connection,
        created_by=user.id,
        stage="Draft",
        **values,
    )
    workflow_repository.create_project_event(
        connection,
        project_id=row["id"],
        actor_id=user.id,
        from_stage="None",
        to_stage="Draft",
        note="Project created in Draft stage",
    )
    return row


def get_project_for_caller(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    if user.role == "Government Official":
        if project["created_by"] != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot view another official's project.",
            )
        # If site was proposed, opening it transitions to Under consideration
        if project["stage"] == "Site proposed":
            project = transition_project_stage(
                connection,
                project_id=project_id,
                actor_id=user.id,
                actor_role=user.role,
                to_stage="Under consideration",
                note="Project opened by official for consideration",
            )
    elif user.role == "Urban Planner":
        active_invite = workflow_repository.get_active_project_invite(connection, project_id)
        is_assigned = project.get("planner_id") == user.id
        is_invited = active_invite is not None and active_invite["planner_id"] == user.id
        if not (is_assigned or is_invited):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned or invited to this project.",
            )
    elif user.role == "Administrator":
        pass
    else:
        # Citizens cannot access internal projects endpoint
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizens cannot access internal project details.",
        )

    return project


def list_projects_for_caller(
    connection: Connection,
    *,
    user: UserResponse,
    status_filter: str | None = None,
    category: str | None = None,
    city: str | None = None,
) -> list[dict[str, Any]]:
    return workflow_repository.get_projects_for_user(
        connection,
        user_id=user.id,
        role=user.role,
        status_filter=status_filter,
        category=category,
        city=city,
    )


def invite_planner(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: InvitePlannerRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can invite planners.",
        )
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    if project["created_by"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning official can invite a planner.",
        )
    if project["stage"] != "Draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot invite planner when project is in '{project['stage']}' stage (must be Draft).",
        )

    target_user = workflow_repository.get_user_by_id(connection, payload.planner_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target planner not found.",
        )
    if target_user["id"] == user.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot invite yourself as a planner.",
        )
    if target_user["role"] != "Urban Planner":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target user does not have the Urban Planner role.",
        )
    if not target_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target planner is inactive.",
        )

    active_invite = workflow_repository.get_active_project_invite(connection, project_id)
    if active_invite:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A planner invite is already active for this project.",
        )
    if project.get("planner_id") is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active planner is already assigned to this project.",
        )

    extra_updates: dict[str, Any] = {}
    if payload.planner_deadline:
        extra_updates["planner_deadline"] = payload.planner_deadline

    updated = transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Planner invited",
        note=f"Invited planner {target_user['full_name']} (ID {target_user['id']})",
        extra_updates=extra_updates,
    )
    workflow_repository.create_project_invite(
        connection,
        project_id=project_id,
        planner_id=payload.planner_id,
        invited_by=user.id,
    )
    return updated


def cancel_invite(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can cancel invites.",
        )
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project["created_by"] != user.id:
        raise HTTPException(status_code=403, detail="Only owning official can cancel invite.")
    if project["stage"] != "Planner invited":
        raise HTTPException(status_code=409, detail="Project does not have a pending planner invite.")

    active_invite = workflow_repository.get_active_project_invite(connection, project_id)
    updated = transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Draft",
        note="Planner invite cancelled by official",
    )
    if active_invite:
        workflow_repository.update_invite_status(connection, active_invite["id"], "cancelled")
    return updated


def reassign_planner(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: ReassignPlannerRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Government Officials can reassign planners.",
        )
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    if project["created_by"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning official can reassign a planner.",
        )
    if project["stage"] not in ("Planner invited", "Site proposed", "Under consideration", "Approved"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reassign planner when project is in '{project['stage']}' stage.",
        )

    deadline = project.get("planner_deadline")
    if not deadline:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Planner deadline has not passed.",
        )
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if now <= deadline:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Planner deadline has not passed.",
        )

    target_user = workflow_repository.get_user_by_id(connection, payload.planner_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target planner not found.",
        )
    if target_user["role"] != "Urban Planner":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target user does not have the Urban Planner role.",
        )
    if not target_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target planner is inactive.",
        )
    if project.get("planner_id") == target_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot reassign to the currently assigned planner.",
        )

    active_invite = workflow_repository.get_active_project_invite(connection, project_id)
    if active_invite:
        if active_invite["planner_id"] == target_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot reassign to the currently invited planner.",
            )
        workflow_repository.update_invite_status(connection, active_invite["id"], "cancelled")

    extra_updates: dict[str, Any] = {
        "planner_id": None,
        "planner_deploy_permitted": False,
    }
    if payload.planner_deadline:
        extra_updates["planner_deadline"] = payload.planner_deadline

    updated = transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Planner invited",
        note=f"Reassigned planner to {target_user['full_name']} (ID {target_user['id']}) after deadline",
        extra_updates=extra_updates,
    )

    workflow_repository.create_project_invite(
        connection,
        project_id=project_id,
        planner_id=payload.planner_id,
        invited_by=user.id,
    )
    return updated


def decline_invite(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Urban Planner":
        raise HTTPException(status_code=403, detail="Only Urban Planners can decline invites.")
    active_invite = workflow_repository.get_active_project_invite(connection, project_id)
    if not active_invite or active_invite["planner_id"] != user.id:
        raise HTTPException(status_code=403, detail="No active invite found for you on this project.")

    updated = transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Draft",
        note="Planner declined the invitation",
    )
    workflow_repository.update_invite_status(connection, active_invite["id"], "declined")
    return updated


def accept_invite(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Urban Planner":
        raise HTTPException(status_code=403, detail="Only Urban Planners can accept invites.")
    active_invite = workflow_repository.get_active_project_invite(connection, project_id)
    if not active_invite:
        raise HTTPException(status_code=404, detail="No active invite found for this project.")
    if active_invite["planner_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot accept an invite meant for another planner.",
        )

    workflow_repository.update_invite_status(connection, active_invite["id"], "accepted")
    updated = workflow_repository.update_project_fields(
        connection,
        project_id,
        {"planner_id": user.id},
    )
    workflow_repository.create_project_event(
        connection,
        project_id=project_id,
        actor_id=user.id,
        from_stage="Planner invited",
        to_stage="Planner invited",
        note="Planner accepted invitation and is now assigned",
    )
    return updated


def propose_site(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: SiteProposalRequest,
) -> dict[str, Any]:
    if user.role != "Urban Planner":
        raise HTTPException(status_code=403, detail="Only Urban Planners can propose sites.")
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.get("planner_id") != user.id:
        raise HTTPException(status_code=403, detail="You are not the assigned planner for this project.")

    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Site proposed",
        note=f"Site proposed: {payload.name}",
        extra_updates={
            "proposed_site_name": payload.name,
            "proposed_site_explanation": payload.explanation,
            "proposed_site_lat": payload.location_lat,
            "proposed_site_lng": payload.location_lng,
            "proposal_rejection_reason": None,
        },
    )


def reject_proposal(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: ReasonRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can reject proposals.")
    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Planner invited",
        note=f"Proposal rejected: {payload.reason}",
        extra_updates={"proposal_rejection_reason": payload.reason},
    )


def approve_proposal(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can approve proposals.")
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    extra: dict[str, Any] = {}
    if project.get("proposed_site_lat") is not None and project.get("proposed_site_lng") is not None:
        extra["location_lat"] = project["proposed_site_lat"]
        extra["location_lng"] = project["proposed_site_lng"]

    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Approved",
        note="Site proposal approved by official",
        extra_updates=extra,
    )


def grant_planner_permission(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Urban Planner":
        raise HTTPException(status_code=403, detail="Only Urban Planners can grant deploy permission.")
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project.get("planner_id") != user.id:
        raise HTTPException(status_code=403, detail="You are not the assigned planner.")
    if project["stage"] != "Approved":
        raise HTTPException(status_code=409, detail="Can only grant deploy permission in Approved stage.")

    updated = workflow_repository.update_project_fields(
        connection,
        project_id,
        {"planner_deploy_permitted": True},
    )
    workflow_repository.create_project_event(
        connection,
        project_id=project_id,
        actor_id=user.id,
        from_stage="Approved",
        to_stage="Approved",
        note="Deploy permission granted by planner",
    )
    return updated


def deploy_project(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: DeployRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can deploy projects.")
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Check planner permission unless planner deadline has passed
    p_deadline = project.get("planner_deadline")
    now = datetime.now(timezone.utc)
    deadline_passed = False
    if p_deadline:
        tz_deadline = p_deadline if p_deadline.tzinfo else p_deadline.replace(tzinfo=timezone.utc)
        if tz_deadline < now:
            deadline_passed = True

    if not deadline_passed and not project.get("planner_deploy_permitted", False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Deploy requires planner permission until the planner deadline has passed.",
        )

    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="OpenForResponse",
        note=f"Project deployed with response deadline {payload.response_deadline.isoformat()}",
        extra_updates={
            "deployed_at": now,
            "response_deadline": payload.response_deadline,
        },
    )


def extend_deadline(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: ExtendDeadlineRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can extend deadlines.")
    project = project_repository.get_project_by_id(connection, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")
    if project["created_by"] != user.id:
        raise HTTPException(status_code=403, detail="Only the owning official can extend deadline.")
    if project["stage"] != "OpenForResponse":
        raise HTTPException(status_code=409, detail="Project must be in OpenForResponse stage to extend deadline.")

    cur_deadline = project.get("response_deadline")
    new_tz = payload.response_deadline if payload.response_deadline.tzinfo else payload.response_deadline.replace(tzinfo=timezone.utc)
    if cur_deadline:
        cur_tz = cur_deadline if cur_deadline.tzinfo else cur_deadline.replace(tzinfo=timezone.utc)
        if new_tz <= cur_tz:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Deadline can only be extended, never shortened or unchanged.",
            )

    updated = workflow_repository.update_project_fields(
        connection,
        project_id,
        {"response_deadline": payload.response_deadline},
    )
    workflow_repository.create_project_event(
        connection,
        project_id=project_id,
        actor_id=user.id,
        from_stage="OpenForResponse",
        to_stage="OpenForResponse",
        note=f"Response deadline extended to {payload.response_deadline.isoformat()}",
    )
    return updated


def halt_project(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: ReasonRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can halt projects.")
    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Halted",
        note=f"Project halted: {payload.reason}",
        extra_updates={"halt_reason": payload.reason},
    )


def recall_project(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
    payload: ReasonRequest,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can recall projects.")
    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Recalled",
        note=f"Project recalled: {payload.reason}",
        extra_updates={"halt_reason": payload.reason},
    )


def start_in_progress(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can move project to InProgress.")
    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="InProgress",
        note="Project moved to InProgress",
    )


def complete_project(
    connection: Connection,
    *,
    user: UserResponse,
    project_id: int,
) -> dict[str, Any]:
    if user.role != "Government Official":
        raise HTTPException(status_code=403, detail="Only Government Officials can complete projects.")
    return transition_project_stage(
        connection,
        project_id=project_id,
        actor_id=user.id,
        actor_role=user.role,
        to_stage="Completed",
        note="Project marked as Completed",
    )


def list_planner_invites(
    connection: Connection,
    *,
    user: UserResponse,
) -> list[dict[str, Any]]:
    if user.role != "Urban Planner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Urban Planners can view planner invites.",
        )
    return workflow_repository.get_pending_invites_for_planner(
        connection,
        planner_id=user.id,
    )

