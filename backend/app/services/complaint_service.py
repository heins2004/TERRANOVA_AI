from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import complaint_repository
from app.schemas.complaints import ComplaintCreate, ComplaintUpdate

STAFF_ROLES = ("Urban Planner", "Government Official", "Administrator")


def create_complaint(*, payload: ComplaintCreate, submitted_by: int, connection: Connection) -> dict:
    return complaint_repository.create_complaint(connection, submitted_by=submitted_by, **payload.model_dump())


def list_complaints(*, user_id: int, user_role: str, connection: Connection) -> list[dict]:
    if user_role in STAFF_ROLES:
        return complaint_repository.list_all_complaints(connection)
    return complaint_repository.list_complaints_for_user(connection, user_id)


def update_complaint_status(*, complaint_id: int, payload: ComplaintUpdate, connection: Connection) -> dict:
    complaint = complaint_repository.update_complaint_status(connection, complaint_id, payload.status)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")
    return complaint
