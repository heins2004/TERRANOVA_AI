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
    site_area_lat: float | None = None
    site_area_lng: float | None = None
    site_area_radius_km: Decimal | float | None = None

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
    def validate_dates(self) -> "ProjectCreate":
        area_fields = [self.site_area_lat, self.site_area_lng, self.site_area_radius_km]
        provided = sum(1 for f in area_fields if f is not None)
        if 0 < provided < 3:
            raise ValueError("Site area latitude, longitude, and radius (in km) must all be provided together.")
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
    site_area_lat: float | None = None
    site_area_lng: float | None = None
    site_area_radius_km: Decimal | float | None = None

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
    def validate_dates(self) -> "ProjectUpdate":
        area_keys = {"site_area_lat", "site_area_lng", "site_area_radius_km"}
        if area_keys.intersection(self.model_fields_set):
            area_fields = [self.site_area_lat, self.site_area_lng, self.site_area_radius_km]
            non_null = sum(1 for f in area_fields if f is not None)
            if 0 < non_null < 3:
                raise ValueError("Site area latitude, longitude, and radius (in km) must all be provided together.")
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
    proposed_site_name: str | None = None
    proposed_site_explanation: str | None = None
    proposed_site_lat: float | None = None
    proposed_site_lng: float | None = None
    site_area_lat: float | None = None
    site_area_lng: float | None = None
    site_area_radius_km: Decimal | float | None = None
    official_name: str | None = None
    official_email: str | None = None
    official_organization: str | None = None
    official_designation: str | None = None
