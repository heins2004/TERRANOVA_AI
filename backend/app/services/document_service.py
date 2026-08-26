from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from psycopg import Connection

from app.repositories import document_repository

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
STORAGE_DIRECTORY = Path(__file__).resolve().parents[3] / "storage" / "documents"
ALLOWED_DOCUMENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
}


def _display_filename(filename: str | None) -> str:
    name = (filename or "").replace("\\", "/").rsplit("/", maxsplit=1)[-1]
    if not name or len(name) > 255:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid filename up to 255 characters is required.")
    return name


async def create_document(*, title: str, description: str | None, category: str | None, project_id: int | None, file: UploadFile, uploaded_by: int, connection: Connection) -> dict:
    normalized_title = title.strip()
    if not normalized_title or len(normalized_title) > 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title must contain 1 to 200 characters.")
    if category is not None and len(category) > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category must be 100 characters or fewer.")

    original_filename = _display_filename(file.filename)
    extension = Path(original_filename).suffix.lower()
    expected_content_types = ALLOWED_DOCUMENT_TYPES.get(extension)
    declared_content_type = (file.content_type or "").lower()
    if not expected_content_types or declared_content_type not in expected_content_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type. Upload a PDF, DOCX, XLSX, PNG, or JPG file.")

    contents = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size must not exceed 20 MB.")

    STORAGE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}{extension}"
    destination = STORAGE_DIRECTORY / stored_filename
    destination.write_bytes(contents)
    try:
        return document_repository.create_document_record(
            connection,
            title=normalized_title,
            description=description.strip() if description else None,
            category=category.strip() if category else None,
            project_id=project_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_size_bytes=len(contents),
            content_type=declared_content_type,
            uploaded_by=uploaded_by,
        )
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()


def list_documents(*, connection: Connection) -> list[dict]:
    return document_repository.list_documents(connection)


def get_document(*, document_id: int, connection: Connection) -> dict:
    document = document_repository.get_document_by_id(connection, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


def document_path(document: dict) -> Path:
    path = STORAGE_DIRECTORY / document["stored_filename"]
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found.")
    return path


def delete_document(*, document_id: int, user_id: int, user_role: str, connection: Connection) -> None:
    document = get_document(document_id=document_id, connection=connection)
    if user_role != "Administrator" and document["uploaded_by"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You may only delete documents you uploaded.")
    document_repository.delete_document_record(connection, document_id)
    (STORAGE_DIRECTORY / document["stored_filename"]).unlink(missing_ok=True)
