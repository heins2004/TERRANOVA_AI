from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    full_name: str
    email: str
    role: str
    city: str | None = None
    is_active: bool
    is_demo: bool
    created_at: datetime
    last_login_at: datetime | None = None


class AdminUsersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[AdminUserItem]
    total: int
    limit: int
    offset: int


class CreateOfficialRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    phone: str | None = None
    password: str = Field(..., min_length=8)
    city: str | None = None


class AdminStatsResponse(BaseModel):
    users_by_role: dict[str, int]
    active_vs_inactive: dict[str, int]
    deployed_projects_by_stage: dict[str, int]
    comments_last_7_days: int
    logins_last_7_days: int | None = None
    logins_tracking_status: str = "Logins are not tracked"


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    name: str | None = None
    city: str | None = None
    is_demo: bool = False
    last_login_at: datetime | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool
