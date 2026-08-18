from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


class UserRoleUpdate(BaseModel):
    role: str = Field(min_length=1, max_length=50)


class UserStatusUpdate(BaseModel):
    is_active: bool
