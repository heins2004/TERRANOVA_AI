from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None = None
    city: str | None = None
    created_at: str
    organization: str | None = None
    designation: str | None = None
    expertise: str | None = None
    avatar_key: str = "avatar-01"
    counts: dict[str, Any] | None = None


class ProfileUpdateRequest(BaseModel):
    # We allow extra fields so our service validator can check for unauthorized keys and return 422
    model_config = ConfigDict(extra="allow")

    name: str | None = None
    phone: str | None = None
    city: str | None = None
    avatar_key: str | None = None
    organization: str | None = None
    designation: str | None = None
    expertise: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class FollowingProjectItem(BaseModel):
    id: int
    title: str
    category: str | None = None
    city_name: str | None = None
    stage: str
    days_left: int | None = None
    halt_reason: str | None = None
    followed_at: str


class FollowingProjectsResponse(BaseModel):
    items: list[FollowingProjectItem]
    total: int


class UserCommentItem(BaseModel):
    id: int
    project_id: int
    project_title: str
    stance: str | None = None
    body: str
    created_at: str
    can_delete: bool


class UserCommentsResponse(BaseModel):
    items: list[UserCommentItem]
    total: int
