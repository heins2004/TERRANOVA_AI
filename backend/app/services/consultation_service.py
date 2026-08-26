from fastapi import HTTPException, status
from psycopg import Connection

from app.repositories import consultation_repository
from app.schemas.consultations import ConsultationCreate, ConsultationUpdate, FeedbackCreate

STAFF_ROLES = ("Urban Planner", "Government Official", "Administrator")


def create_consultation(*, payload: ConsultationCreate, created_by: int, connection: Connection) -> dict:
    return consultation_repository.create_consultation(connection, created_by=created_by, **payload.model_dump())


def list_consultations(*, connection: Connection) -> list[dict]:
    return consultation_repository.list_consultations(connection)


def update_consultation(*, consultation_id: int, payload: ConsultationUpdate, connection: Connection) -> dict:
    consultation = consultation_repository.update_consultation(connection, consultation_id, payload.model_dump(exclude_unset=True))
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found.")
    return consultation


def create_feedback(*, consultation_id: int, submitted_by: int, payload: FeedbackCreate, connection: Connection) -> dict:
    if not consultation_repository.get_consultation_by_id(connection, consultation_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found.")
    return consultation_repository.create_feedback(connection, consultation_id=consultation_id, submitted_by=submitted_by, comment=payload.comment)


def list_feedback(*, consultation_id: int, user_id: int, user_role: str, connection: Connection) -> list[dict]:
    if not consultation_repository.get_consultation_by_id(connection, consultation_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found.")
    return consultation_repository.list_feedback_for_consultation(connection, consultation_id, None if user_role in STAFF_ROLES else user_id)
