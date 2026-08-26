from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    category: str | None
    project_id: int | None
    original_filename: str
    file_size_bytes: int
    content_type: str
    uploaded_by: int
    uploaded_by_name: str
    created_at: datetime
