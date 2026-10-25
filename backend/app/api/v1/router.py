from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.projects import projects_router
from app.api.v1.osm_layers import router as osm_layers_router
from app.api.v1.public import router as public_router
from app.api.v1.comments import router as comments_router
from app.api.v1.planner import router as planner_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.profile import router as profile_router
from app.api.v1.project_consultations import router as project_consultations_router
from app.api.v1.chat import router as chat_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(projects_router)
api_router.include_router(osm_layers_router)
api_router.include_router(public_router)
api_router.include_router(comments_router)
api_router.include_router(planner_router)
api_router.include_router(notifications_router)
api_router.include_router(profile_router)
api_router.include_router(project_consultations_router)
api_router.include_router(chat_router)


