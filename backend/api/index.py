import sys
from pathlib import Path

# Add backend directory to Python path for Vercel serverless functions
backend_dir = str(Path(__file__).parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import auth, menu, cart, orders, payments, favourites, ratings, notifications, users
from routers import settings as settings_router

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
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(cart.router, prefix="/api/cart", tags=["cart"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(favourites.router, prefix="/api/favourites", tags=["favourites"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["ratings"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
@app.get("/api/health")
async def health():
    return {"status": "ok"}
