from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: str = Field(default="Proposed", max_length=50)
    category: str | None = Field(default=None, max_length=100)
    city: str = Field(max_length=100)
    location_lat: float | None = None
    location_lng: float | None = None
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("location_lat")
    @classmethod
    def validate_lat(cls, v: float | None) -> float | None:
        if v is not None and not (6.0 <= v <= 38.0):
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_lng(cls, v: float | None) -> float | None:
        if v is not None and not (68.0 <= v <= 98.0):
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectCreate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date.")
        return self


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    location_lat: float | None = None
    location_lng: float | None = None
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None

    @field_validator("location_lat")
    @classmethod
    def validate_lat(cls, v: float | None) -> float | None:
        if v is not None and not (6.0 <= v <= 38.0):
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_lng(cls, v: float | None) -> float | None:
        if v is not None and not (68.0 <= v <= 98.0):
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectUpdate":
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date.")
        return self


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    status: str
    category: str | None = None
    city: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    budget: Decimal | None = None
    start_date: date | None = None
    end_date: date | None = None
    candidate_site_id: int | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime
    stage: str = "Draft"
    planner_id: int | None = None
    planner_deadline: datetime | None = None
    response_deadline: datetime | None = None
    halt_reason: str | None = None
    planner_deploy_permitted: bool = False
    proposal_rejection_reason: str | None = None
