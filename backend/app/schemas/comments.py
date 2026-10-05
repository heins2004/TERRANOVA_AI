from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CommentReply(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_name: str
    badge: str | None = None
    stance: str | None = None
    body: str
    created_at: datetime
    parent_id: int | None = None


class PublicCommentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_name: str
    badge: str | None = None
    stance: str | None = None
    body: str
    created_at: datetime
    parent_id: int | None = None
    replies: list[CommentReply] = []


class PublicCommentsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[PublicCommentItem]
    total: int
    limit: int
    offset: int


class CommentCreate(BaseModel):
    body: str
    stance: str | None = None
    parent_id: int | None = None


class FollowResponse(BaseModel):
    following: bool


class UserFollowsResponse(BaseModel):
    project_ids: list[int]
