from fastapi import FastAPI

# Standalone deployable entry point.
# Phase 3 will add CORS middleware and mount routers here
# (auth, menu, cart, orders, payments, favourites, ratings,
# notifications, analytics, users, settings).

app = FastAPI(title="CampusBite API", version="1.0.0")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
