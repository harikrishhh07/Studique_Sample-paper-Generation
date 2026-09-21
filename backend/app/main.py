import logging
from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from app.core.config import settings
from app.api import uploads, jobs, qb, sp

logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json"
)

# CORS setup restricted to configured frontend origins
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

async def verify_proxy_secret(request: Request):
    # Allow root & health check without header
    if request.url.path in ["/", "/health", "/openapi.json", "/docs"]:
        return None
    secret = request.headers.get("X-Studique-Proxy-Secret")
    if not secret or secret != settings.PROXY_SHARED_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Unauthorized proxy request"
        )
    user_id = request.headers.get("X-Student-User-Id") or request.headers.get("X-Student-Reg-No")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Student identity missing"
        )
    return user_id

app.include_router(uploads.router, dependencies=[Depends(verify_proxy_secret)])
app.include_router(jobs.router, dependencies=[Depends(verify_proxy_secret)])
app.include_router(qb.router, dependencies=[Depends(verify_proxy_secret)])
app.include_router(sp.router, dependencies=[Depends(verify_proxy_secret)])

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": "2.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
