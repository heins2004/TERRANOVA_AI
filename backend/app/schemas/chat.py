from datetime import datetime
from pydantic import BaseModel, field_validator


class ChatMessageCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Message body must be text.")
        trimmed = v.strip()
        if len(trimmed) < 1 or len(trimmed) > 1000:
            raise ValueError("Message body must be between 1 and 1000 characters.")
        return trimmed


class ChatMessageResponse(BaseModel):
    id: int
    project_id: int
    sender_id: int
    sender_name: str
    sender_role: str
    body: str
    created_at: datetime


class ChatProjectItem(BaseModel):
    id: int
    title: str
    stage: str
    city_name: str | None = None
    last_message_text: str | None = None
    last_message_time: datetime | None = None
    last_message_sender_id: int | None = None
    last_message_sender_name: str | None = None
    last_message_sender_role: str | None = None
    unread_count: int
    is_pinned: bool
    pinned_at: datetime | None = None


class ChatUnreadCountResponse(BaseModel):
    unread_count: int


class ChatPinResponse(BaseModel):
    message: str
    is_pinned: bool
