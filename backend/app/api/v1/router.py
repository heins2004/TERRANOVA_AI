from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.cities import router as cities_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.consultations import router as consultations_router
from app.api.v1.documents import router as documents_router
from app.api.v1.projects import projects_router
from app.api.v1.study_areas import router as study_areas_router
from app.api.v1.candidate_sites import router as candidate_sites_router
from app.api.v1.osm_layers import router as osm_layers_router
from app.api.v1.public import router as public_router
from app.api.v1.comments import router as comments_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(cities_router)
api_router.include_router(projects_router)
api_router.include_router(complaints_router)
api_router.include_router(consultations_router)
api_router.include_router(documents_router)
api_router.include_router(study_areas_router)
api_router.include_router(candidate_sites_router)
api_router.include_router(osm_layers_router)
api_router.include_router(public_router)
api_router.include_router(comments_router)

