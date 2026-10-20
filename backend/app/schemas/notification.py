from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


class NotificationItem(BaseModel):
    id: int
    project_id: int | None = None
    kind: str
    message: str
    created_at: datetime
    is_read: bool
    project_link_kind: Literal["gov", "planner", "public"]

    model_config = ConfigDict(from_attributes=True, extra="forbid")


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    unread_count: int


class NotificationReadResponse(BaseModel):
    id: int
    is_read: bool
