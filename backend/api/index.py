from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import auth

# Phase 3: Configured CORS middleware.
# (Remaining routers are not yet implemented, they will be uncommented in future phases)

app = FastAPI(title="CampusBite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
