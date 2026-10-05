from datetime import datetime, timezone
import psycopg
from fastapi import HTTPException, status

from app.repositories import comment_repository as repo
from app.repositories.public_project_repository import get_public_project_by_id
from app.schemas.auth import UserResponse
from app.schemas.comments import (
    CommentCreate,
    CommentReply,
    FollowResponse,
    PublicCommentItem,
    PublicCommentsResponse,
    UserFollowsResponse,
)


def format_author_name(full_name: str) -> str:
    """Format full name as 'First L.' or single name as-is."""
    parts = full_name.strip().split()
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    first = parts[0]
    last_initial = parts[-1][0].upper()
    return f"{first} {last_initial}."


def get_public_project_comments(
    conn: psycopg.Connection,
    *,
    project_id: int,
    limit: int = 20,
    offset: int = 0,
) -> list[PublicCommentItem]:
    project = get_public_project_by_id(conn, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    top_comments, replies, total = repo.get_public_comments_for_project(
        conn, project_id, limit=limit, offset=offset
    )

    replies_by_parent: dict[int, list[CommentReply]] = {}
    for r in replies:
        p_id = r["parent_id"]
        is_gov_response = (
            r["author_id"] == r["project_created_by"]
            and r["author_role"] == "Government Official"
        )
        badge = "Government response" if is_gov_response else None
        reply_item = CommentReply(
            id=r["id"],
            author_name=format_author_name(r["author_full_name"]),
            badge=badge,
            stance=None,
            body=r["body"],
            created_at=r["created_at"],
            parent_id=p_id,
        )
        replies_by_parent.setdefault(p_id, []).append(reply_item)

    items: list[PublicCommentItem] = []
    for c in top_comments:
        c_id = c["id"]
        is_gov_response = (
            c["author_id"] == c["project_created_by"]
            and c["author_role"] == "Government Official"
        )
        badge = "Government response" if is_gov_response else None
        item = PublicCommentItem(
            id=c_id,
            author_name=format_author_name(c["author_full_name"]),
            badge=badge,
            stance=c["stance"],
            body=c["body"],
            created_at=c["created_at"],
            replies=replies_by_parent.get(c_id, []),
        )
        items.append(item)

    return items


def create_comment(
    conn: psycopg.Connection,
    *,
    project_id: int,
    current_user: UserResponse,
    payload: CommentCreate,
) -> PublicCommentItem:
    # 1. Project visibility check (404 if not publicly visible)
    project = get_public_project_by_id(conn, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # 2. Check open / closed rules
    is_owner = (
        project.get("created_by") == current_user.id
        and current_user.role == "Government Official"
    )
    now = datetime.now(timezone.utc)
    deadline = project.get("response_deadline")
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    is_open = (
        project["stage"] == "OpenForResponse"
        and (deadline is None or deadline > now)
    )

    if not is_open:
        # Only the project's owning official may still reply
        if payload.parent_id is not None and is_owner:
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Comments are closed for this project.",
            )

    # 3. Clean and validate body (strip whitespace, remove control chars except newline, 3-500 chars)
    raw_body = payload.body or ""
    cleaned_body = "".join(
        ch for ch in raw_body if ch == "\n" or (ord(ch) >= 32 and ord(ch) != 127)
    ).strip()

    if len(cleaned_body) < 3 or len(cleaned_body) > 500:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Comment body must be between 3 and 500 characters.",
        )

    # 4. Top-level vs Reply validation
    if payload.parent_id is None:
        if is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="owners can only reply",
            )
        if not payload.stance or payload.stance not in {"Support", "Concern", "Neutral"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Stance is required for top-level comments and must be Support, Concern, or Neutral.",
            )
        effective_parent_id = None
        effective_stance = payload.stance
    else:
        if payload.stance is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Stance must be absent or null for replies.",
            )
        parent = repo.get_comment_by_id(conn, payload.parent_id)
        if not parent or parent["project_id"] != project_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Parent comment does not exist or does not belong to this project.",
            )
        # If parent is itself a reply, attach to its parent (the thread root)
        effective_parent_id = (
            parent["parent_id"] if parent["parent_id"] is not None else parent["id"]
        )
        effective_stance = None

    # 5. Rate limit and duplicate check
    if repo.has_duplicate_comment(
        conn, current_user.id, project_id, cleaned_body, window_minutes=10
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Identical comment already submitted within the last 10 minutes.",
        )

    recent_count = repo.get_user_comment_count_in_window(
        conn, current_user.id, window_minutes=10
    )
    if recent_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 5 comments per 10 minutes.",
            headers={"Retry-After": "600"},
        )

    # 6. Insert comment
    row = repo.insert_comment(
        conn,
        project_id=project_id,
        user_id=current_user.id,
        parent_id=effective_parent_id,
        stance=effective_stance,
        body=cleaned_body,
    )

    badge = "Government response" if is_owner else None
    author_name = format_author_name(current_user.full_name)

    return PublicCommentItem(
        id=row["id"],
        author_name=author_name,
        badge=badge,
        stance=effective_stance,
        body=cleaned_body,
        created_at=row["created_at"],
        parent_id=effective_parent_id,
        replies=[],
    )


def delete_comment(
    conn: psycopg.Connection,
    *,
    comment_id: int,
    current_user: UserResponse,
) -> None:
    comment = repo.get_comment_by_id(conn, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    is_author = comment["user_id"] == current_user.id
    is_admin = current_user.role == "Administrator"
    is_project_owner = (
        comment["project_owner_id"] == current_user.id
        and current_user.role == "Government Official"
    )

    if not (is_author or is_admin or is_project_owner):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this comment.",
        )

    repo.delete_comment_by_id(conn, comment_id)


def follow_project(
    conn: psycopg.Connection,
    *,
    project_id: int,
    current_user: UserResponse,
) -> FollowResponse:
    project = get_public_project_by_id(conn, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    repo.add_project_follow(conn, current_user.id, project_id)
    return FollowResponse(following=True)


def unfollow_project(
    conn: psycopg.Connection,
    *,
    project_id: int,
    current_user: UserResponse,
) -> FollowResponse:
    project = get_public_project_by_id(conn, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    repo.remove_project_follow(conn, current_user.id, project_id)
    return FollowResponse(following=False)


def get_my_follows(
    conn: psycopg.Connection,
    *,
    current_user: UserResponse,
) -> UserFollowsResponse:
    project_ids = repo.get_user_followed_project_ids(conn, current_user.id)
    return UserFollowsResponse(project_ids=project_ids)
