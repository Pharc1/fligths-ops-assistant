import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import FlightOpsError, RagNotInitializedError
from app.core.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s [%s]", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)

    from app.services.rag_service import RagService
    from app.skills.registry import skill_registry

    try:
        app.state.rag_service = RagService()
        logger.info("RAG service ready (collection=%s)", settings.COLLECTION_NAME)
    except Exception as exc:
        logger.warning("RAG service unavailable at startup: %s", exc)
        app.state.rag_service = None

    try:
        skill_registry.load_all(settings.SKILLS_DIRECTORY)
        logger.info("Skills loaded: %s", skill_registry.list_names())
    except Exception as exc:
        logger.warning("Skills loading failed: %s", exc)

    logger.info("%s ready to serve", settings.PROJECT_NAME)
    yield

    logger.info("Shutting down %s", settings.PROJECT_NAME)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI assistant for aeronautical ground maintenance technicians",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        logger.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            (time.perf_counter() - start) * 1000,
        )
        return response

    @app.exception_handler(RagNotInitializedError)
    async def handle_rag_not_initialized(_: Request, exc: RagNotInitializedError):
        return JSONResponse(status_code=503, content={"error": "service_unavailable", "message": exc.message})

    @app.exception_handler(FlightOpsError)
    async def handle_domain_error(_: Request, exc: FlightOpsError):
        return JSONResponse(status_code=500, content={"error": "internal_error", "message": exc.message})

    from app.api.v1.router import router as v1_router
    app.include_router(v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
