from datetime import datetime
from decimal import Decimal
import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CandidateSiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    location: dict[str, Any]
    area_size_acres: Decimal | float | None = None
    land_use: str | None = Field(default=None, max_length=100)
    suitability_status: str = Field(default="RequiresReview", max_length=50)
    availability_status: str = Field(default="VerificationRequired", max_length=50)
    ownership_type: str = Field(default="Unknown", max_length=50)
    flood_risk: str = Field(default="Unknown", max_length=50)
    notes: str | None = None

    @field_validator("location", mode="before")
    @classmethod
    def parse_location(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as exc:
                raise ValueError("Invalid GeoJSON string for location") from exc
        return value


class CandidateSiteUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    location: dict[str, Any] | None = None
    area_size_acres: Decimal | float | None = None
    land_use: str | None = Field(default=None, max_length=100)
    suitability_status: str | None = Field(default=None, max_length=50)
    availability_status: str | None = Field(default=None, max_length=50)
    ownership_type: str | None = Field(default=None, max_length=50)
    flood_risk: str | None = Field(default=None, max_length=50)
    notes: str | None = None

    @field_validator("location", mode="before")
    @classmethod
    def parse_location(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as exc:
                raise ValueError("Invalid GeoJSON string for location") from exc
        return value


class CandidateSiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    study_area_id: int
    name: str
    location: dict[str, Any]
    area_size_acres: Decimal | float | None = None
    land_use: str | None = None
    suitability_status: str
    availability_status: str
    ownership_type: str
    flood_risk: str
    notes: str | None = None
    promoted_project_id: int | None = None
    created_by: int
    created_at: datetime

    @field_validator("location", mode="before")
    @classmethod
    def parse_location(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as exc:
                raise ValueError("Invalid GeoJSON string for location") from exc
        return value


# ---------------------------------------------------------------------------
# Phase 2 additions
# ---------------------------------------------------------------------------

class StatusUpdateRequest(BaseModel):
    """Partial update for status fields only."""
    suitability_status: str | None = None
    availability_status: str | None = None
    ownership_type: str | None = None
    flood_risk: str | None = None


class ProximityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_site_id: int
    amenity_type: str
    name: str | None = None
    distance_meters: float
    computed_at: datetime


class CandidateSiteDetailResponse(CandidateSiteResponse):
    """Full site detail including cached proximity data."""
    proximity: list[ProximityItem] = []


class PromoteToProjectRequest(BaseModel):
    """Optional overrides when promoting a candidate site to a project.

    If title/city/category/description are omitted, they default to the site's own data.
    """
    title: str | None = Field(default=None, min_length=1, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None


class PromoteToProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: int

