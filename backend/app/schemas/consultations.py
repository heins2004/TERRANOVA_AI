from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ConsultationStatus = Literal["Upcoming", "Ongoing", "Completed", "Cancelled"]


class ConsultationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    project_id: int | None = None
    scheduled_at: datetime
    location: str | None = Field(default=None, max_length=255)


class ConsultationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    project_id: int | None = None
    scheduled_at: datetime | None = None
    location: str | None = Field(default=None, max_length=255)
    status: ConsultationStatus | None = None


class ConsultationResponse(ConsultationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ConsultationStatus
    created_by: int
    created_at: datetime
    project_title: str | None = None


class FeedbackCreate(BaseModel):
    comment: str = Field(min_length=1)


class FeedbackResponse(FeedbackCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    consultation_id: int
    submitted_by: int
    submitted_by_name: str | None = None
    created_at: datetime
