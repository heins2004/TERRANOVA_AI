from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import FileResponse
from psycopg import Connection

from app.core.security import require_role
from app.database.connection import get_db
from app.schemas.auth import UserResponse
from app.schemas.documents import DocumentResponse
from app.services import document_service
from app.services.auth_service import get_current_authenticated_user

EDITOR_ROLES = ("Urban Planner", "Government Official", "Administrator")
router = APIRouter(prefix="/api/documents", tags=["documents"])


def current_user(request: Request, connection: Connection = Depends(get_db)) -> UserResponse:
    user = get_current_authenticated_user(request=request, connection=connection)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    title: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
    description: Annotated[str | None, Form()] = None,
    category: Annotated[str | None, Form()] = None,
    project_id: Annotated[int | None, Form()] = None,
    connection: Connection = Depends(get_db),
    user: UserResponse = Depends(require_role(*EDITOR_ROLES)),
) -> dict:
    document = await document_service.create_document(title=title, description=description, category=category, project_id=project_id, file=file, uploaded_by=user.id, connection=connection)
    return {**document, "uploaded_by_name": user.full_name}


@router.get("", response_model=list[DocumentResponse])
def list_documents(connection: Connection = Depends(get_db), _: UserResponse = Depends(current_user)) -> list[dict]:
    return document_service.list_documents(connection=connection)


@router.get("/{document_id}/download")
def download_document(document_id: int, connection: Connection = Depends(get_db), _: UserResponse = Depends(current_user)) -> FileResponse:
    document = document_service.get_document(document_id=document_id, connection=connection)
    return FileResponse(document_service.document_path(document), media_type=document["content_type"], filename=document["original_filename"])


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, connection: Connection = Depends(get_db), user: UserResponse = Depends(require_role(*EDITOR_ROLES))) -> Response:
    document_service.delete_document(document_id=document_id, user_id=user.id, user_role=user.role, connection=connection)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
