from fastapi import APIRouter

from app.core.cities import CITIES

router = APIRouter(prefix="/api/cities", tags=["cities"])


@router.get("")
def list_cities() -> list[dict]:
    return CITIES
