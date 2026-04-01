"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    print("✅ Database initialized")
    yield


app = FastAPI(
    title="Regulatory Intelligence Compliance Agent",
    description=(
        "AI-powered regulatory monitoring, compliance mapping, "
        "and remediation planning API."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the frontend to call us from any origin during hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes at BOTH paths so frontend works regardless of convention:
#   /api/health, /api/items, /api/pipeline/run  ...
#   /health, /items, /pipeline/run              ...
app.include_router(router, prefix="/api")
app.include_router(router, prefix="")
