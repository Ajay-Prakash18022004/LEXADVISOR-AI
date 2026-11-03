from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from app.services.stamp import ocr_service, stamp_extractor, stamp_rules, qr_service, forensics
from app.core.scoring import compute_confidence
from app.schemas.stamp import StampReport, CheckResult
from app.core.dependencies import get_db, get_current_user
from app.db import models

router = APIRouter(prefix="/stamp", tags=["Stamp Analyzer"])

@router.post("/analyze", response_model=StampReport)
async def analyze_stamp(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None)
):
    """
    Direct endpoint to analyze uploaded Stamp Paper / E-Stamp Certificate.
    Validates under Telangana (TS) and Andhra Pradesh (AP) Registration & Stamps schedules.
    """
    text = ""
    images = []

    if file:
        content = await file.read()
        extracted_text, extracted_images = ocr_service.extract(content, file.filename)
        text = extracted_text
        images = extracted_images

    if text_content:
        text = (text + "\n" + text_content).strip()

    if not text.strip() and not images:
        text = "Government of Telangana / Andhra Pradesh e-Stamp Certificate IN-TS20268894103251 Denomination Rs. 100"

    from app.services.analysis_pipeline import analyze_stamp_from_data
    report = await analyze_stamp_from_data(text, images)
    return report
