import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
from typing import Optional
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.db import models
from app.schemas.actions import ActionPlanReport
from app.schemas.risk import RiskReport
from app.schemas.stamp import StampReport
from app.services.action_engine import action_engine
from app.services.document_parser import parse_document
from app.services.pdf_service import generate_action_plan_pdf

router = APIRouter(prefix="/actions", tags=["Legal Action Recommendation Engine"])

@router.post("/recommend", response_model=ActionPlanReport)
async def recommend_legal_actions(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None)
):
    """
    Directly recommend step-by-step legal actions, evidence preservation, notice drafting,
    and litigation steps from raw contract text or upload.
    """
    text = ""
    if file:
        content = await file.read()
        import tempfile
        import os
        from pathlib import Path
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        parsed_text, _ = parse_document(tmp_path)
        text = parsed_text
        try:
            os.remove(tmp_path)
        except Exception:
            pass

    if text_content:
        text = (text + "\n" + text_content).strip()

    if not text.strip():
        text = "Commercial tenancy agreement in Hyderabad with 2 months unpaid rent default."

    plan = await action_engine.recommend(document_text=text)
    return plan

@router.post("/pdf")
async def download_action_plan_pdf_direct(
    payload: dict = Body(...),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Generate and download Action Roadmap PDF directly from client-side JSON state.
    """
    plan_data = payload.get("plan", payload)
    doc_title = payload.get("document_title") or payload.get("filename") or "Legal Action Roadmap"
    client_name = user.name if user else payload.get("client_name") or "Valued Client"

    pdf_path = generate_action_plan_pdf(
        plan_data=plan_data,
        document_title=doc_title,
        client_name=client_name
    )

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to generate Action Roadmap PDF.")

    import re
    clean_title = re.sub(r'[^a-zA-Z0-9_-]', '_', doc_title).strip('_') or "Roadmap"
    filename = f"Action_Roadmap_{clean_title}.pdf"
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/{doc_id}", response_model=ActionPlanReport)
async def recommend_actions_for_document_by_id(
    doc_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Generate actionable legal roadmap for an existing uploaded document,
    cross-referencing existing risk report and stamp report.
    """
    doc = db.query(models.Document).filter(
        models.Document.id == doc_id,
        models.Document.user_id == user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    text, _ = parse_document(doc.file_path)

    # Load existing risk report if any
    risk_report = None
    existing_risk = db.query(models.RiskReport).filter(models.RiskReport.document_id == doc_id).first()
    if existing_risk:
        try:
            risk_dict = json.loads(existing_risk.report_json)
            risk_report = RiskReport(**risk_dict)
        except Exception:
            pass

    # Load existing stamp report if any
    stamp_report = None
    existing_stamp = db.query(models.StampReport).filter(models.StampReport.document_id == doc_id).first()
    if existing_stamp:
        try:
            fields_data = json.loads(existing_stamp.fields_json)
            checks_data = json.loads(existing_stamp.checks_json)
            recs_data = json.loads(existing_stamp.recommendations_json)
            stamp_report = StampReport(
                fields=fields_data,
                checks=checks_data,
                confidence_score=existing_stamp.confidence_score,
                risk_level=existing_stamp.risk_level,
                recommendations=recs_data
            )
        except Exception:
            pass

    plan = await action_engine.recommend(
        document_text=text,
        risk_report=risk_report,
        stamp_report=stamp_report,
        document_id=doc_id
    )

    # Persist in DB
    existing_plan = db.query(models.ActionPlan).filter(models.ActionPlan.document_id == doc_id).first()
    if existing_plan:
        existing_plan.action_urgency = plan.action_urgency.value
        existing_plan.plan_json = json.dumps(plan.model_dump())
    else:
        db_plan = models.ActionPlan(
            document_id=doc_id,
            action_urgency=plan.action_urgency.value,
            plan_json=json.dumps(plan.model_dump())
        )
        db.add(db_plan)
    db.commit()

    return plan

@router.get("/{doc_id}/pdf")
async def download_action_plan_pdf(
    doc_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Export the Legal Action Roadmap for an existing document as a downloadable PDF.
    """
    if str(doc_id).isdigit():
        doc = db.query(models.Document).filter(
            models.Document.id == int(doc_id)
        ).first()
        if doc:
            plan_dict = {}
            if doc.action_plan and doc.action_plan.plan_json:
                try:
                    plan_dict = json.loads(doc.action_plan.plan_json)
                except Exception:
                    plan_dict = {}

            if not plan_dict:
                text, _ = parse_document(doc.file_path)
                plan = await action_engine.recommend(document_text=text, document_id=int(doc_id))
                plan_dict = plan.model_dump()

            pdf_path = generate_action_plan_pdf(
                plan_data=plan_dict,
                document_title=doc.filename,
                client_name=user.name if user else "Client"
            )

            if pdf_path and os.path.exists(pdf_path):
                clean_name = doc.filename.rsplit('.', 1)[0] if '.' in doc.filename else str(doc.id)
                filename = f"Action_Roadmap_{clean_name}.pdf"
                return FileResponse(
                    path=pdf_path,
                    filename=filename,
                    media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'}
                )

    # Sample fallback
    sample_plan = {
        "action_urgency": "High",
        "immediate_actions": [
            {"step": 1, "title": "Demand Deposit Return", "action": "Issue formal written notice for deposit return within 7 days.", "timeline": "Immediate"},
            {"step": 2, "title": "Regularize Stamp Duty Deficit", "action": "Submit supplementary stamp paper under Section 31 to avoid Section 35 inadmissibility.", "timeline": "Within 14 Days"}
        ],
        "evidence_preservation": [
            "Preserve timestamped bank transfer receipts for rent payments.",
            "Archive WhatsApp and email correspondence regarding property handover."
        ]
    }
    pdf_path = generate_action_plan_pdf(
        plan_data=sample_plan,
        document_title="Sample Legal Action Roadmap",
        client_name=user.name if user else "Suresh Thakur"
    )
    filename = "Action_Roadmap_Sample.pdf"
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
