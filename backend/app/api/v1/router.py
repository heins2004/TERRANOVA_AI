from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.documents import router as documents_router
from app.api.v1.projects import infrastructure_router, projects_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(projects_router)
api_router.include_router(infrastructure_router)
api_router.include_router(complaints_router)
api_router.include_router(documents_router)
