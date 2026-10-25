from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SiteChangeRequestCreate(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)
    circle_lat: float | None = None
    circle_lng: float | None = None
    circle_radius_km: float | None = None

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 10 or len(s) > 500:
            raise ValueError("Reason must be between 10 and 500 characters.")
        return s

    @field_validator("circle_lat")
    @classmethod
    def validate_circle_lat(cls, v: float | None) -> float | None:
        if v is not None and (v < 6.0 or v > 38.0):
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("circle_lng")
    @classmethod
    def validate_circle_lng(cls, v: float | None) -> float | None:
        if v is not None and (v < 68.0 or v > 98.0):
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v

    @field_validator("circle_radius_km")
    @classmethod
    def validate_circle_radius(cls, v: float | None) -> float | None:
        if v is not None and (v <= 0 or v > 100.0):
            raise ValueError("Circle radius must be between 0.1 and 100.0 km.")
        return v


class SiteChangeProposeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    explanation: str = Field(..., min_length=20, max_length=1000)
    location_lat: float
    location_lng: float

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not s or len(s) > 200:
            raise ValueError("Site name must be between 1 and 200 characters.")
        return s

    @field_validator("explanation")
    @classmethod
    def validate_explanation(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 20 or len(s) > 1000:
            raise ValueError("Explanation must be between 20 and 1000 characters.")
        return s

    @field_validator("location_lat")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if v < 6.0 or v > 38.0:
            raise ValueError("Latitude must be inside India (between 6.0 and 38.0).")
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if v < 68.0 or v > 98.0:
            raise ValueError("Longitude must be inside India (between 68.0 and 98.0).")
        return v


class SiteChangeRejectRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 10 or len(s) > 500:
            raise ValueError("Reason must be between 10 and 500 characters.")
        return s


class SiteChangeResponse(BaseModel):
    id: int
    project_id: int
    status: str
    reason: str
    circle_lat: float | None = None
    circle_lng: float | None = None
    circle_radius_km: float | None = None
    proposed_site_name: str | None = None
    proposed_site_explanation: str | None = None
    proposed_site_lat: float | None = None
    proposed_site_lng: float | None = None
    rejection_reason: str | None = None
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
