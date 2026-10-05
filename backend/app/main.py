import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.database.init_db import init_db
from app.database.migrate import get_pending_migrations_count

logger = logging.getLogger(__name__)


def _check_pending_migrations() -> None:
    try:
        pending_count = get_pending_migrations_count()
        if pending_count > 0:
            logger.warning(
                f"{pending_count} pending migrations, run: python -m app.database.migrate"
            )
    except Exception as exc:
        logger.warning(f"Could not check pending migrations: {exc}")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    _check_pending_migrations()
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home() -> dict[str, str]:
    return {"message": "Welcome to TERRANOVA AI"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router)
