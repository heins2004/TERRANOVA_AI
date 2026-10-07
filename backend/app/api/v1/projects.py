from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from psycopg import Connection

from app.core.security import require_authenticated_user, require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.schemas.workflow import (
    DeployRequest,
    ExtendDeadlineRequest,
    InvitePlannerRequest,
    PlannerSearchItem,
    ProjectEventResponse,
    ReasonRequest,
    ReassignPlannerRequest,
    SiteProposalRequest,
)
from app.services import project_service, workflow_service
from app.repositories import workflow_repository

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
projects_router = APIRouter(prefix="/api/projects", tags=["projects"])


@projects_router.get("/planners", response_model=list[PlannerSearchItem])
def search_planners_endpoint(
    q: str = Query(..., description="Planner name or ID search query"),
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> list[PlannerSearchItem]:
    return workflow_service.search_planners(connection, user=user, q=q)


@projects_router.get("", response_model=list[ProjectResponse])
def list_projects(
    status_filter: str | None = Query(None, alias="status"),
    category: str | None = None,
    city: str | None = None,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> list[dict]:
    """
    Authenticated projects listing.
    Returns only caller's own projects (Government Official: owned; Urban Planner: assigned).
    Never exposes created_by publicly.
    """
    return workflow_service.list_projects_for_caller(
        connection=connection,
        user=user,
        status_filter=status_filter,
        category=category,
        city=city,
    )


@projects_router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> dict:
    return workflow_service.get_project_for_caller(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    from app.schemas.workflow import ProjectCreateWorkflow

    workflow_payload = ProjectCreateWorkflow(**payload.model_dump())
    return workflow_service.create_project(
        connection=connection,
        user=user,
        payload=workflow_payload,
    )


@projects_router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    # Only owning official can edit during draft / final edit window
    existing = project_service.get_project(project_id=project_id, connection=connection)
    if user.role == "Government Official" and existing["created_by"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning official can edit this project.",
        )
    return project_service.update_project(project_id=project_id, payload=payload, connection=connection)


@projects_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> Response:
    existing = project_service.get_project(project_id=project_id, connection=connection)
    if existing["created_by"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owning official can delete this project.",
        )
    if existing.get("stage") != "Draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete project in '{existing.get('stage')}' stage. Only Draft projects can be deleted.",
        )
    project_service.delete_project(project_id=project_id, connection=connection)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Government Workflow Endpoints ---

@projects_router.post("/{project_id}/invite", response_model=ProjectResponse)
def invite_planner_endpoint(
    project_id: int,
    payload: InvitePlannerRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.invite_planner(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/invite/cancel", response_model=ProjectResponse)
def cancel_invite_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.cancel_invite(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/reassign", response_model=ProjectResponse)
def reassign_planner_endpoint(
    project_id: int,
    payload: ReassignPlannerRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.reassign_planner(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/invite/decline", response_model=ProjectResponse)
def decline_invite_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> dict:
    return workflow_service.decline_invite(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/invite/accept", response_model=ProjectResponse)
def accept_invite_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> dict:
    return workflow_service.accept_invite(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/propose-site", response_model=ProjectResponse)
def propose_site_endpoint(
    project_id: int,
    payload: SiteProposalRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> dict:
    return workflow_service.propose_site(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/reject-proposal", response_model=ProjectResponse)
def reject_proposal_endpoint(
    project_id: int,
    payload: ReasonRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.reject_proposal(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/approve-proposal", response_model=ProjectResponse)
def approve_proposal_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.approve_proposal(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/planner-permission", response_model=ProjectResponse)
def grant_permission_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Urban Planner")),
) -> dict:
    return workflow_service.grant_planner_permission(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/deploy", response_model=ProjectResponse)
def deploy_project_endpoint(
    project_id: int,
    payload: DeployRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.deploy_project(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/extend-deadline", response_model=ProjectResponse)
def extend_deadline_endpoint(
    project_id: int,
    payload: ExtendDeadlineRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.extend_deadline(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/halt", response_model=ProjectResponse)
def halt_project_endpoint(
    project_id: int,
    payload: ReasonRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.halt_project(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/recall", response_model=ProjectResponse)
def recall_project_endpoint(
    project_id: int,
    payload: ReasonRequest,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.recall_project(
        connection=connection,
        user=user,
        project_id=project_id,
        payload=payload,
    )


@projects_router.post("/{project_id}/in-progress", response_model=ProjectResponse)
def in_progress_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.start_in_progress(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.post("/{project_id}/complete", response_model=ProjectResponse)
def complete_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role("Government Official")),
) -> dict:
    return workflow_service.complete_project(
        connection=connection,
        user=user,
        project_id=project_id,
    )


@projects_router.get("/{project_id}/events", response_model=list[ProjectEventResponse])
def get_project_events_endpoint(
    project_id: int,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_authenticated_user()),
) -> list[dict]:
    # Ensure caller has access to project
    workflow_service.get_project_for_caller(connection=connection, user=user, project_id=project_id)
    return workflow_repository.get_project_events(connection, project_id)
