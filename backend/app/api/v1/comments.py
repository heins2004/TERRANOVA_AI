from fastapi import APIRouter, Depends, Query, Request, Response, status
import psycopg

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.comments import (
    CommentCreate,
    FollowResponse,
    PublicCommentItem,
    PublicCommentsResponse,
    UserFollowsResponse,
)
from app.services import comment_service

ALL_ROLES = ("Citizen", "Urban Planner", "Government Official", "Administrator")

router = APIRouter(tags=["comments and follows"])


@router.post(
    "/api/projects/{project_id}/comments",
    response_model=PublicCommentItem,
    status_code=status.HTTP_201_CREATED,
)
def create_comment_endpoint(
    project_id: int,
    payload: CommentCreate,
    connection: psycopg.Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role(*ALL_ROLES)),
) -> PublicCommentItem:
    return comment_service.create_comment(
        connection,
        project_id=project_id,
        current_user=current_user,
        payload=payload,
    )


@router.delete(
    "/api/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment_endpoint(
    comment_id: int,
    connection: psycopg.Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role(*ALL_ROLES)),
) -> Response:
    comment_service.delete_comment(
        connection,
        comment_id=comment_id,
        current_user=current_user,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put(
    "/api/projects/{project_id}/follow",
    response_model=FollowResponse,
)
def follow_project_endpoint(
    project_id: int,
    connection: psycopg.Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role(*ALL_ROLES)),
) -> FollowResponse:
    return comment_service.follow_project(
        connection,
        project_id=project_id,
        current_user=current_user,
    )


@router.delete(
    "/api/projects/{project_id}/follow",
    response_model=FollowResponse,
)
def unfollow_project_endpoint(
    project_id: int,
    connection: psycopg.Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role(*ALL_ROLES)),
) -> FollowResponse:
    return comment_service.unfollow_project(
        connection,
        project_id=project_id,
        current_user=current_user,
    )


@router.get(
    "/api/me/follows",
    response_model=UserFollowsResponse,
)
def get_my_follows_endpoint(
    connection: psycopg.Connection = Depends(get_db),
    current_user: UserResponse = Depends(require_role(*ALL_ROLES)),
) -> UserFollowsResponse:
    return comment_service.get_my_follows(
        connection,
        current_user=current_user,
    )
