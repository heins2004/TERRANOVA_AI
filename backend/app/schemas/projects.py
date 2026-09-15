from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


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
    created_by: int
    created_at: datetime
    updated_at: datetime


class InfrastructureAssetCreate(BaseModel):
    project_id: int | None = None
    name: str = Field(min_length=1, max_length=200)
    asset_type: str | None = Field(default=None, max_length=100)
    condition: str = Field(default="Good", max_length=50)
    city: str = Field(max_length=100)
    location_lat: float | None = None
    location_lng: float | None = None
    last_inspected_at: date | None = None


class InfrastructureAssetUpdate(BaseModel):
    project_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=200)
    asset_type: str | None = Field(default=None, max_length=100)
    condition: str | None = Field(default=None, max_length=50)
    city: str | None = Field(default=None, max_length=100)
    location_lat: float | None = None
    location_lng: float | None = None
    last_inspected_at: date | None = None


class InfrastructureAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int | None = None
    name: str
    asset_type: str | None = None
    condition: str
    city: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    last_inspected_at: date | None = None
    created_at: datetime
