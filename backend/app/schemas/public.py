from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


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
    start_date: date | None = None
    end_date: date | None = None
    stage: str
    response_deadline: datetime | None = None
    days_left: int | None = None
    halt_reason: str | None = None
    is_demo: bool


class PublicProjectsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[PublicProjectItem]
    total: int
    limit: int
    offset: int
