from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ConsultationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10, max_length=2000)
    starts_at: datetime
    duration_minutes: int = Field(..., ge=15, le=480)
    type: Literal["Online", "Venue"]
    meeting_url: str | None = Field(None, max_length=500)
    venue_address: str | None = Field(None, min_length=5, max_length=300)
    max_attendees: int | None = Field(None, ge=1, le=100000)
    visibility: Literal["Public", "Private"]
    invite_emails: list[str] | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 3 or len(s) > 150:
            raise ValueError("Title must be between 3 and 150 characters.")
        return s

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 10 or len(s) > 2000:
            raise ValueError("Description must be between 10 and 2000 characters.")
        return s

    @field_validator("meeting_url")
    @classmethod
    def validate_meeting_url(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if not s.startswith("https://"):
            raise ValueError("Online meeting URL must use the https:// scheme.")
        if len(s) > 500:
            raise ValueError("Meeting URL cannot exceed 500 characters.")
        return s

    @field_validator("venue_address")
    @classmethod
    def validate_venue_address(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if len(s) < 5 or len(s) > 300:
            raise ValueError("Venue address must be between 5 and 300 characters.")
        return s

    @field_validator("invite_emails")
    @classmethod
    def validate_invite_emails(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        if len(v) > 50:
            raise ValueError("Cannot invite more than 50 emails at once.")
        return v

    @model_validator(mode="after")
    def check_type_and_invites(self) -> "ConsultationCreateRequest":
        if self.type == "Online":
            if not self.meeting_url:
                raise ValueError("Meeting URL is required for Online consultations.")
            if self.venue_address is not None:
                raise ValueError("Venue address must not be set for Online consultations.")
        elif self.type == "Venue":
            if not self.venue_address:
                raise ValueError("Venue address is required for Venue consultations.")
            if self.meeting_url is not None:
                raise ValueError("Meeting URL must not be set for Venue consultations.")

        if self.visibility == "Public" and self.invite_emails:
            raise ValueError("A Public consultation must not have private invite emails.")
        return self


class ConsultationUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(None, min_length=3, max_length=150)
    description: str | None = Field(None, min_length=10, max_length=2000)
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(None, ge=15, le=480)
    type: Literal["Online", "Venue"] | None = None
    meeting_url: str | None = Field(None, max_length=500)
    venue_address: str | None = Field(None, min_length=5, max_length=300)
    max_attendees: int | None = Field(None, ge=1, le=100000)
    invite_emails: list[str] | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if len(s) < 3 or len(s) > 150:
            raise ValueError("Title must be between 3 and 150 characters.")
        return s

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if len(s) < 10 or len(s) > 2000:
            raise ValueError("Description must be between 10 and 2000 characters.")
        return s

    @field_validator("meeting_url")
    @classmethod
    def validate_meeting_url(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if not s.startswith("https://"):
            raise ValueError("Online meeting URL must use the https:// scheme.")
        if len(s) > 500:
            raise ValueError("Meeting URL cannot exceed 500 characters.")
        return s

    @field_validator("venue_address")
    @classmethod
    def validate_venue_address(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip()
        if len(s) < 5 or len(s) > 300:
            raise ValueError("Venue address must be between 5 and 300 characters.")
        return s

    @field_validator("invite_emails")
    @classmethod
    def validate_invite_emails(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        if len(v) > 50:
            raise ValueError("Cannot invite more than 50 emails at once.")
        return v


class ConsultationCancelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(..., min_length=10, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 10 or len(s) > 500:
            raise ValueError("Cancel reason must be between 10 and 500 characters.")
        return s


class ConsultationResponseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str
    starts_at: datetime
    duration_minutes: int
    type: str
    meeting_url: str | None = None
    venue_address: str | None = None
    city: str
    max_attendees: int | None = None
    visibility: str
    status: str
    cancel_reason: str | None = None
    created_by: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    invite_count: int | None = None
    invite_emails: list[str] | None = None
    invited_emails: list[str] | None = None
    not_found_emails: list[str] | None = None


class PublicConsultationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    starts_at: datetime
    duration_minutes: int
    type: str
    meeting_url: str | None = None
    venue_address: str | None = None
    max_attendees: int | None = None
    status: str
    cancel_reason: str | None = None
