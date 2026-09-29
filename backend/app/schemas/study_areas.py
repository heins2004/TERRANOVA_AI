from datetime import datetime
import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudyAreaCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    boundary: dict[str, Any]

    @field_validator("boundary", mode="before")
    @classmethod
    def parse_boundary(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as exc:
                raise ValueError("Invalid GeoJSON string for boundary") from exc
        return value


class StudyAreaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str | None = None
    boundary: dict[str, Any]
    created_by: int
    created_at: datetime

    @field_validator("boundary", mode="before")
    @classmethod
    def parse_boundary(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception as exc:
                raise ValueError("Invalid GeoJSON string for boundary") from exc
        return value
