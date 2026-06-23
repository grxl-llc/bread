from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.logging_config import setup_logging

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

from app.auth.router import router as auth_router
from app.routers.entities import router as entities_router
from app.routers.upload import router as upload_router
from app.routers.llm import router as llm_router
from app.routers.live import router as live_router
from app.routers.pricing import router as pricing_router
from app.routers.kroger import router as kroger_router
from app.routers.basket import router as basket_router
from app.routers.recipe_search import router as recipe_search_router

setup_logging()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bread API", version="2.0.0")

origins = ["*"] if settings.allowed_origins == "*" else settings.allowed_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/api")
app.include_router(entities_router, prefix="/api")
app.include_router(upload_router,   prefix="/api")
app.include_router(llm_router,      prefix="/api")
app.include_router(live_router,     prefix="/api")
app.include_router(pricing_router,  prefix="/api")
app.include_router(kroger_router,        prefix="/api")
app.include_router(basket_router,        prefix="/api")
app.include_router(recipe_search_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    try:
        from app.services.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Scheduler failed to start: %s", e)


@app.on_event("shutdown")
def shutdown_event():
    try:
        from app.services.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
