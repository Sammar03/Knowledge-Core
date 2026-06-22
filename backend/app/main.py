"""FastAPI app entrypoint: CORS, routers, health."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .config import get_settings
from .routers import chat, documents

app = FastAPI(title="Company Document RAG Assistant", version="1.0.0")

settings = get_settings()

# Per-IP rate limit on every endpoint. ponytail: one global default; add
# per-route @limiter.limit(...) if chat/upload need tighter caps than reads.
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)  # inner

# CORS added last so it stays outermost and tags the 429 responses too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    # Friendly landing for the host's root (e.g. the HF Space page) — the real API is /api/*.
    return {"service": "company-database-api", "health": "/api/health"}


@app.get("/api/health")
async def health() -> dict[str, str]:
    # Lightweight liveness probe — no DB scan (deploy platforms poll this often).
    return {"status": "ok"}
