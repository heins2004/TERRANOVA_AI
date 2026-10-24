from datetime import date, datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class PlannerSearchItem(BaseModel):
    id: int
    name: str
    city: str | None = None


class ProjectCreateWorkflow(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: str = Field(default="Proposed", max_length=50)
    category: str | None = Field(default=None, max_length=100)
    city: str = Field(max_length=100)
    location_lat: float
    location_lng: float
    budget: Decimal | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    site_area_lat: float | None = None
    site_area_lng: float | None = None
    site_area_radius_km: Decimal | float | None = None

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def validate_dates_input(cls, v: object) -> datetime | None:
        from app.services.project_date_rules import to_kolkata_datetime
        return to_kolkata_datetime(v)

    @field_validator("location_lat")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (6.0 <= v <= 38.0):
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (68.0 <= v <= 98.0):
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v

    @field_validator("site_area_lat")
    @classmethod
    def validate_area_lat(cls, v: float | None) -> float | None:
        if v is not None and not (6.0 <= v <= 38.0):
            raise ValueError("Site area latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("site_area_lng")
    @classmethod
    def validate_area_lng(cls, v: float | None) -> float | None:
        if v is not None and not (68.0 <= v <= 98.0):
            raise ValueError("Site area longitude must be inside India (between 68.0 and 98.0).")
        return v

    @field_validator("site_area_radius_km")
    @classmethod
    def validate_area_radius(cls, v: Decimal | float | None) -> Decimal | float | None:
        if v is not None:
            val = float(v)
            if not (0.5 <= val <= 50.0):
                raise ValueError("Site area radius must be between 0.5 and 50 km inclusive.")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectCreateWorkflow":
        area_fields = [self.site_area_lat, self.site_area_lng, self.site_area_radius_km]
        provided = sum(1 for f in area_fields if f is not None)
        if 0 < provided < 3:
            raise ValueError("Site area latitude, longitude, and radius (in km) must all be provided together.")
        return self


class InvitePlannerRequest(BaseModel):
    planner_id: int
    planner_deadline: datetime | None = None


class SiteProposalRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    explanation: str = Field(min_length=1)
    location_lat: float
    location_lng: float

    @field_validator("location_lat")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (6.0 <= v <= 38.0):
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (68.0 <= v <= 98.0):
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v


class RejectProposalRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=500)


class DeployRequest(BaseModel):
    response_deadline: datetime

    @field_validator("response_deadline")
    @classmethod
    def validate_deadline(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        tz_v = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        if tz_v <= now:
            raise ValueError("Response deadline must be in the future.")
        return v


class ExtendDeadlineRequest(BaseModel):
    response_deadline: datetime


class ReasonRequest(BaseModel):
    reason: str = Field(min_length=10, max_length=500)


class ReassignPlannerRequest(BaseModel):
    planner_id: int
    planner_deadline: datetime | None = None


class ProjectEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    actor_id: int
    from_stage: str
    to_stage: str
    note: str | None = None
    created_at: datetime


class PlannerInviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    project_id: int
    title: str
    city: str | None = None
    official_name: str | None = None
    planner_deadline: datetime | None = None
    invited_at: datetime

