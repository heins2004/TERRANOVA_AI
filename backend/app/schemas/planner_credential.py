from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PlannerCredentialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    registration_number: str | None = None
    body_name: str | None = None
    document_original_name: str | None = None
    document_mime: str | None = None
    document_size: int | None = None
    rejection_reason: str | None = None
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    is_backfilled: bool = False


class AdminPlannerCredentialItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: str
    registration_number: str | None = None
    body_name: str | None = None
    document_original_name: str | None = None
    document_size: int | None = None
    status: str
    submitted_at: datetime | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None


class AdminPlannerCredentialsResponse(BaseModel):
    items: list[AdminPlannerCredentialItem]
    total: int
    limit: int
    offset: int


class RejectCredentialRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500, description="Rejection reason (10-500 characters)")
