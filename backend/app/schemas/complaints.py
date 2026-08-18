from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ComplaintStatus = Literal["Submitted", "UnderReview", "Resolved", "Dismissed"]


class ComplaintCreate(BaseModel):
    project_id: int | None = None
    subject: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)


class ComplaintUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintResponse(ComplaintCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    submitted_by: int
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime
