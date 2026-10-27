import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.rate_limit import check_public_rate_limit
from app.database.init_db import init_db
from app.database.migrate import get_pending_migrations_count
from app.services.deadline_scheduler import run_deadline_scheduler_loop

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
    scheduler_task = asyncio.create_task(run_deadline_scheduler_loop())
    try:
        yield
    finally:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            pass


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


from app.core.security import reset_current_request, set_current_request


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    token = set_current_request(request)
    try:
        if request.url.path.startswith("/api/public"):
            try:
                check_public_rate_limit(request)
            except HTTPException as exc:
                return JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": exc.detail},
                    headers=exc.headers,
                )
        return await call_next(request)
    finally:
        reset_current_request(token)



@app.get("/")
def home() -> dict[str, str]:
    return {"message": "Welcome to TERRANOVA AI"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router)
