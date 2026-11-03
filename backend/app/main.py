import os
import json
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger
from app.db.database import engine, Base, SessionLocal
from app.db import models

# Import all routers
from app.routers import (
    auth,
    documents,
    chat,
    summary,
    clauses,
    generation,
    pdf,
    advocates,
    stamp,
    risk,
    actions,
    analysis,
    deadlines,
    advocate_portal,
    cases
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Seed database with advocates if empty, and enforce sureshtakur194@gmail.com
def seed_initial_data():
    db = SessionLocal()
    try:
        if settings.ADVOCATES_SEED_PATH.exists():
            with open(settings.ADVOCATES_SEED_PATH, "r", encoding="utf-8") as f:
                advocates_list = json.load(f)
            count = db.query(models.Advocate).count()
            if count == 0:
                for adv in advocates_list:
                    db_adv = models.Advocate(
                        id=adv.get("id"),
                        name=adv.get("name"),
                        bar_council_id=adv.get("bar_council_id"),
                        specialization=adv.get("specialization"),
                        city=adv.get("city"),
                        area=adv.get("area"),
                        state=adv.get("state"),
                        lat=adv.get("lat"),
                        lng=adv.get("lng"),
                        phone=adv.get("phone"),
                        email="sureshtakur194@gmail.com",
                        experience_years=adv.get("experience_years", 5),
                        rating=adv.get("rating", 4.5),
                        consultation_fee=adv.get("consultation_fee", 1500.0),
                        address=adv.get("address")
                    )
                    db.add(db_adv)
                db.commit()
                logger.info("Seeded initial advocate registry data with sureshtakur194@gmail.com.")
            else:
                for adv in advocates_list:
                    existing = db.query(models.Advocate).filter(models.Advocate.id == adv.get("id")).first()
                    if existing:
                        existing.email = "sureshtakur194@gmail.com"
                        existing.phone = adv.get("phone")
                db.commit()
                logger.info("Updated all advocate emails to sureshtakur194@gmail.com.")
    except Exception as e:
        logger.warning(f"Could not seed advocate data: {e}")
    finally:
        db.close()

seed_initial_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Proactive Indian Legal Decision-Support System featuring Stamp Paper Analyzer (TS/AP), AI Contract Risk Analyzer, and Legal Action Recommendation Engine."
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers with /api/v1 prefix
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(chat.router, prefix=api_prefix)
app.include_router(summary.router, prefix=api_prefix)
app.include_router(clauses.router, prefix=api_prefix)
app.include_router(generation.router, prefix=api_prefix)
app.include_router(pdf.router, prefix=api_prefix)
app.include_router(advocates.router, prefix=api_prefix)
app.include_router(stamp.router, prefix=api_prefix)
app.include_router(risk.router, prefix=api_prefix)
app.include_router(actions.router, prefix=api_prefix)
app.include_router(analysis.router, prefix=api_prefix)
app.include_router(deadlines.router, prefix=api_prefix)
app.include_router(advocate_portal.router, prefix=api_prefix)
app.include_router(cases.router, prefix=api_prefix)

# Also expose direct un-prefixed routers for convenience matching the user's direct specification
# (e.g. POST /stamp/analyze, POST /risk/analyze, POST /actions/recommend)
app.include_router(advocate_portal.router)
app.include_router(cases.router)
app.include_router(stamp.router)
app.include_router(risk.router)
app.include_router(actions.router)
app.include_router(analysis.router)
app.include_router(pdf.router)
app.include_router(generation.router)
app.include_router(deadlines.router)
app.include_router(documents.router)
app.include_router(advocates.router)
app.include_router(chat.router)
app.include_router(auth.router)

# Mount static & assets directories
static_dir = Path(__file__).resolve().parent / "static"
os.makedirs(static_dir, exist_ok=True)
assets_dir = static_dir / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "jurisdictions": ["Telangana (TS)", "Andhra Pradesh (AP)"]
    }

@app.get("/", response_class=HTMLResponse)
async def serve_home():
    """Serves the complete interactive LexAdvisor AI application"""
    index_file = static_dir / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(
                content=f.read(),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
    return HTMLResponse("<h1>LexAdvisor AI Backend Active</h1><p>Visit /docs for API documentation.</p>")

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_spa_routes(request: Request, full_path: str):
    """
    SPA Fallback Route: Directs all frontend navigation (e.g. /dashboard, /login, /document-analysis, etc.)
    to the single-page React app index.html on http://127.0.0.1:8000.
    """
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "static", "assets")):
        raise HTTPException(status_code=404, detail="Not Found")
    
    index_file = static_dir / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(
                content=f.read(),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
    return HTMLResponse("<h1>LexAdvisor AI</h1>")

