from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, field_serializer


class PublicProjectItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    category: str | None = None
    city: str | None = None
    city_name: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    budget: float | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    @field_serializer("start_date", "end_date")
    def serialize_dates(self, v: datetime | None) -> str | None:
        from app.services.project_date_rules import format_ist_iso
        return format_ist_iso(v)
    stage: str
    response_deadline: datetime | None = None
    days_left: int | None = None
    halt_reason: str | None = None
    is_demo: bool
    support_count: int = 0
    concern_count: int = 0
    neutral_count: int = 0
    participants: int = 0


class PublicProjectsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[PublicProjectItem]
    total: int
    limit: int
    offset: int
