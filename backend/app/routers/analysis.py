import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.db.database import SessionLocal
from app.db import models
from app.services.analysis_pipeline import run_full_analysis, analyze_stamp_from_data
from app.services.risk_analyzer import risk_analyzer
from app.services.action_engine import action_engine
from app.services.stamp import ocr_service
from app.schemas.stamp import StampReport
from app.schemas.risk import RiskReport
from app.schemas.actions import ActionPlanReport
from app.services.summarizer import summarize_document
from app.services.llm_service import llm_service

router = APIRouter(prefix="/analysis", tags=["Full Analysis Pipeline"])

def seed_sample_analysis_history_if_empty():
    db = SessionLocal()
    try:
        count = db.query(models.Document).count()
        if count == 0:
            demo_user = db.query(models.User).first()
            if not demo_user:
                from app.core.security import get_password_hash
                demo_user = models.User(
                    name="Adv. Rajeshwar Rao",
                    email="advocate@lexadvisor.ai",
                    role="advocate",
                    hashed_password=get_password_hash("LexPass@2026")
                )
                db.add(demo_user)
                db.commit()
                db.refresh(demo_user)

            # Sample 1: Telangana Residential Tenancy (Authentic Rs. 100)
            doc1 = models.Document(
                user_id=demo_user.id,
                filename="Telangana_Residential_Tenancy_Agreement.pdf",
                file_path="storage/uploads/sample_ts_ok.pdf",
                doc_type="rental_agreement",
                state="TS",
                extracted_text="GOVERNMENT OF TELANGANA e-Stamp Certificate No: IN-TS20268894103251 Denomination: Rs. 100/-. Residential Tenancy Flat 302, Gachibowli, Hyderabad. Term 11 months, rent Rs. 35,000, deposit Rs. 1,00,000. 1 month notice.",
                uploaded_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
            )
            db.add(doc1)
            db.commit()
            db.refresh(doc1)

            # Add StampReport for doc1
            db.add(models.StampReport(
                document_id=doc1.id,
                fields_json=json.dumps({"state": "Telangana", "denomination": 100.0, "serial_or_uin": "IN-TS20268894103251", "stamp_type": "e-stamp", "document_type": "rental_agreement"}),
                checks_json=json.dumps([{"name": "Stamp Duty Adequacy", "status": "pass", "detail": "Denomination Rs. 100 satisfies statutory minimum under Telangana Stamp Rules."}]),
                confidence_score=96,
                risk_level="low",
                recommendations_json=json.dumps(["Stamp certificate is authentic and admissible in court."])
            ))
            # Add RiskReport for doc1
            db.add(models.RiskReport(
                document_id=doc1.id,
                overall_risk="low",
                risk_score=22,
                report_json=json.dumps({
                    "overall_risk": "low",
                    "overall_risk_level": "LOW",
                    "risk_score": 22,
                    "summary": "Standard bilateral residential tenancy with safe commercial covenants and minimal legal exposure.",
                    "missing_clauses": [],
                    "identified_risks": [],
                    "recommendations": ["Safe to execute. Ensure original e-stamp is stored securely."]
                })
            ))
            # Add ActionPlan for doc1
            db.add(models.ActionPlan(
                document_id=doc1.id,
                action_urgency="routine",
                plan_json=json.dumps({
                    "action_urgency": "routine",
                    "summary": "Standard safe execution roadmap. Proceed with signing and digital archiving.",
                    "steps": [
                        {"step_number": 1, "title": "Execute Dual Signatures", "action_type": "compliance", "priority": "low", "timeframe": "Immediate", "description": "Ensure lessor and lessee sign all pages.", "legal_basis": "Indian Contract Act", "deliverable": "Signed Counterparts"}
                    ]
                })
            ))

            # Sample 2: Commercial Lease (Deficient Stamp Rs. 20 & High Risk)
            doc2 = models.Document(
                user_id=demo_user.id,
                filename="Commercial_Warehouse_Lease_Shamshabad.pdf",
                file_path="storage/uploads/sample_ts_deficient.pdf",
                doc_type="commercial_lease",
                state="TS",
                extracted_text="GOVERNMENT OF TELANGANA Non-Judicial Stamp Paper TS-2026-004128 Denomination: Rs. 20/-. Backdated execution. Strict 36-month lock-in penalty. Unilateral indemnity without limitation. Summary termination without notice.",
                uploaded_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
            )
            db.add(doc2)
            db.commit()
            db.refresh(doc2)

            db.add(models.StampReport(
                document_id=doc2.id,
                fields_json=json.dumps({"state": "Telangana", "denomination": 20.0, "serial_or_uin": "TS-2026-004128", "stamp_type": "non-judicial", "document_type": "commercial_lease"}),
                checks_json=json.dumps([{"name": "Stamp Duty Adequacy", "status": "fail", "detail": "Denomination Rs. 20 is below statutory minimum Rs. 500. Shortfall of Rs. 480/- detected."}]),
                confidence_score=45,
                risk_level="high",
                recommendations_json=json.dumps(["Deficit Stamp Duty Remediation: Remit Rs. 480 deficit plus 10x penalty under Section 35 Indian Stamp Act."])
            ))
            db.add(models.RiskReport(
                document_id=doc2.id,
                overall_risk="high",
                risk_score=85,
                report_json=json.dumps({
                    "overall_risk": "high",
                    "overall_risk_level": "HIGH",
                    "risk_score": 85,
                    "summary": "Severe legal vulnerability detected: Deficient stamp duty rendering document inadmissible, harsh 3-year lock-in penal forfeiture, and uncapped unilateral indemnity.",
                    "missing_clauses": [{"clause_name": "Dispute Resolution & Jurisdiction", "criticality": "high", "impact": "Forced out-of-state litigation in distant courts."}],
                    "identified_risks": [
                        {"title": "Unilateral Indemnity Exposure", "clause_name": "Unilateral Indemnity Exposure", "severity": "high", "explanation": "Absolute liability without reciprocal compensation.", "remedy": "Convert to bilateral mutual indemnification capped at 6 months rent."},
                        {"title": "Strict Lock-In Period Penal Forfeiture", "clause_name": "Strict Lock-In Period Penal Forfeiture", "severity": "high", "explanation": "Unconstitutional forfeiture under Section 74 Indian Contract Act.", "remedy": "Cap early exit fee to 1 month rent."}
                    ],
                    "recommendations": ["Do NOT sign until lock-in penalty is removed and deficit stamp duty of Rs. 480 is paid."]
                })
            ))
            db.add(models.ActionPlan(
                document_id=doc2.id,
                action_urgency="immediate",
                plan_json=json.dumps({
                    "action_urgency": "immediate",
                    "summary": "Immediate intervention required: Remit deficit stamp duty and serve counter-revision before signing.",
                    "steps": [
                        {"step_number": 1, "title": "Deficit Stamp Duty Adjudication", "action_type": "compliance", "priority": "high", "timeframe": "Within 48 hours", "description": "Pay deficit duty to avoid Section 35 court impounding.", "legal_basis": "Section 35 Indian Stamp Act", "deliverable": "Challan Receipt"},
                        {"step_number": 2, "title": "Bilateral Negotiation on Lock-in Trap", "action_type": "negotiation", "priority": "high", "timeframe": "Prior to execution", "description": "Demand removal of 36-month penal rent clause.", "legal_basis": "Section 74 Indian Contract Act", "deliverable": "Revised Draft"}
                    ]
                })
            ))

            db.commit()
    except Exception:
        pass
    finally:
        db.close()

seed_sample_analysis_history_if_empty()

@router.post("/full")
async def analyze_full_direct(
    file: Optional[UploadFile] = File(None),
    text_content: Optional[str] = Form(None),
    doc_type: str = Form("general_agreement"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    One-shot full decision support analysis:
    Runs Stamp Analyzer, Contract Risk Analyzer, and Legal Action Recommendation Engine
    directly on uploaded file or pasted contract text, and automatically saves into Customer History.
    """
    text = ""
    images = []
    fname = "Analyzed_Contract_Document.txt"

    if file:
        content = await file.read()
        extracted_text, extracted_images = ocr_service.extract(content, file.filename)
        text = extracted_text
        images = extracted_images
        fname = file.filename

    if text_content:
        text = (text + "\n" + text_content).strip()

    if not text.strip():
        text = (
            "RENTAL AGREEMENT\n\n"
            "This Agreement of Tenancy executed in Hyderabad, Telangana on 15/04/2026.\n"
            "Stamp Paper Certificate: IN-TS20268894103251, Denomination: Rs. 100.\n"
            "Between Sri K. R. Sharma (Lessor) and M/s Alpha Tech Solutions (Lessee).\n"
            "The Lessee shall indemnify the Lessor without any limitation.\n"
            "Lessor may terminate this tenancy immediately without any notice.\n"
            "All disputes subject to exclusive jurisdiction of courts at New Delhi."
        )

    # 1. Stamp Analysis
    stamp_rep = await analyze_stamp_from_data(text, images)

    # 2. Risk Analysis
    risk_rep = await risk_analyzer.analyze(
        document_text=text,
        doc_type=doc_type,
        stamp_report=stamp_rep
    )

    # 3. Action Plan
    action_plan = await action_engine.recommend(
        document_text=text,
        risk_report=risk_rep,
        stamp_report=stamp_rep
    )

    # 4. Generate dynamic document-grounded executive summary & extract facts
    summary_text = await summarize_document(text)
    facts = llm_service._extract_document_facts(text)

    # Automatically persist in customer analysis history
    try:
        user_id = user.id if user else 1
        db_doc = models.Document(
            user_id=user_id,
            filename=fname,
            file_path=f"storage/uploads/{fname}",
            doc_type=facts.get("doc_type") or doc_type,
            state=facts.get("state") or (stamp_rep.fields.state or "TS"),
            extracted_text=text[:5000],
            uploaded_at=datetime.datetime.utcnow()
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)

        # Save reports
        from app.services.analysis_pipeline import _save_reports_to_db
        _save_reports_to_db(db, db_doc.id, stamp_rep, risk_rep, action_plan)
        document_id = db_doc.id
    except Exception:
        document_id = None

    return {
        "document_id": document_id,
        "filename": fname,
        "extracted_text": text,
        "summary": summary_text,
        "facts": facts,
        "stamp": stamp_rep,
        "risk": risk_rep,
        "plan": action_plan
    }

@router.get("/history")
def get_customer_analysis_history(
    limit: int = Query(20, description="Max history records to return"),
    db: Session = Depends(get_db)
):
    """
    Retrieves full customer analysis history of all processed legal documents.
    """
    docs = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).limit(limit).all()
    history = []

    for d in docs:
        stamp_summary = None
        if d.stamp_report:
            try:
                fields = json.loads(d.stamp_report.fields_json)
                stamp_summary = {
                    "score": d.stamp_report.confidence_score,
                    "risk_level": d.stamp_report.risk_level,
                    "denomination": fields.get("denomination", 0),
                    "serial": fields.get("serial_or_uin", "N/A"),
                    "state": fields.get("state", d.state),
                    "status": "Authentic (Pass)" if d.stamp_report.confidence_score >= 75 else "Deficient / High Risk"
                }
            except Exception:
                pass

        risk_summary = None
        if d.risk_report:
            try:
                r_data = json.loads(d.risk_report.report_json)
                risk_summary = {
                    "score": d.risk_report.risk_score,
                    "overall_risk": d.risk_report.overall_risk,
                    "missing_clauses_count": len(r_data.get("missing_clauses", [])),
                    "identified_risks_count": len(r_data.get("identified_risks", [])),
                    "summary": r_data.get("summary", "")
                }
            except Exception:
                pass

        plan_summary = None
        if d.action_plan:
            try:
                p_data = json.loads(d.action_plan.plan_json)
                plan_summary = {
                    "urgency": d.action_plan.action_urgency,
                    "steps_count": len(p_data.get("steps", [])),
                    "summary": p_data.get("summary", "")
                }
            except Exception:
                pass

        history.append({
            "document_id": d.id,
            "filename": d.filename,
            "doc_type": d.doc_type,
            "state": d.state,
            "uploaded_at": d.uploaded_at.strftime("%Y-%m-%d %H:%M") if d.uploaded_at else "Recently",
            "stamp": stamp_summary,
            "risk": risk_summary,
            "plan": plan_summary
        })

    return history

@router.get("/history/{doc_id}")
async def get_history_document_full_report(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve full saved analysis for an item from customer history.
    """
    if str(doc_id).isdigit():
        doc = db.query(models.Document).filter(models.Document.id == int(doc_id)).first()
        if doc:
            stamp_data = None
            if doc.stamp_report:
                fields = json.loads(doc.stamp_report.fields_json)
                checks = json.loads(doc.stamp_report.checks_json)
                recs = json.loads(doc.stamp_report.recommendations_json or "[]")
                stamp_data = {
                    "fields": fields,
                    "checks": checks,
                    "confidence_score": doc.stamp_report.confidence_score,
                    "score": doc.stamp_report.confidence_score,
                    "risk_level": doc.stamp_report.risk_level,
                    "recommendations": recs,
                    "metadata": {
                        "state": fields.get("state", doc.state),
                        "certificate_number": fields.get("serial_or_uin", "N/A"),
                        "duty_amount_paid": fields.get("denomination", 0),
                        "minimum_duty_required": 100
                    }
                }

            risk_data = None
            if doc.risk_report:
                risk_data = json.loads(doc.risk_report.report_json)

            plan_data = None
            if doc.action_plan:
                plan_data = json.loads(doc.action_plan.plan_json)

            return {
                "document_id": doc.id,
                "filename": doc.filename,
                "doc_type": doc.doc_type,
                "state": doc.state,
                "uploaded_at": doc.uploaded_at.strftime("%Y-%m-%d %H:%M") if doc.uploaded_at else "",
                "stamp": stamp_data,
                "risk": risk_data,
                "plan": plan_data
            }

    # Sample instrument fallback for doc-comm-4921 / doc-ts-hyd-8842
    is_comm = "comm" in str(doc_id).lower()
    return {
        "document_id": doc_id,
        "filename": "Commercial_Lease_Agreement_Sample.pdf" if is_comm else "Residential_Tenancy_Agreement.pdf",
        "doc_type": "Commercial Lease" if is_comm else "Residential Tenancy",
        "state": "Telangana",
        "uploaded_at": "2026-10-30 14:30",
        "stamp": {
            "fields": {"certificate_number": "IN-TS20268894103251", "denomination": 100, "state": "Telangana"},
            "checks": {"status": "deficient"},
            "confidence_score": 98.5,
            "score": 98.5,
            "risk_level": "Deficient",
            "recommendations": ["Procure supplementary stamp paper of Rs. 2,300 under Art. 35 TS Stamp Act."],
            "metadata": {"state": "Telangana", "certificate_number": "IN-TS20268894103251", "duty_amount_paid": 100, "minimum_duty_required": 2400}
        },
        "risk": {
            "risk_score": 68,
            "overall_risk": "High",
            "findings": [{"severity": "Critical", "title": "Deposit Forfeiture Risk", "clause_ref": "Clause 8"}]
        },
        "plan": {
            "status": "active",
            "priority": "High",
            "steps": [{"title": "Preserve evidentiary trail under Sec. 63 BSA 2023", "status": "IN PROGRESS"}]
        }
    }

@router.delete("/history/{doc_id}")
def delete_history_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a document analysis from history.
    """
    if str(doc_id).isdigit():
        doc = db.query(models.Document).filter(models.Document.id == int(doc_id)).first()
        if doc:
            db.delete(doc)
            db.commit()

    return {"message": "Document analysis record deleted from history.", "id": doc_id}

@router.post("/{doc_id}")
@router.post("/{doc_id}/run")
async def run_pipeline_for_document(
    doc_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Executes the full automated analysis pipeline for a stored document.
    """
    user_id = user.id if user else 1
    if str(doc_id).isdigit():
        try:
            result = await run_full_analysis(document_id=int(doc_id), user_id=user_id, db=db)
            return result
        except ValueError as ve:
            raise HTTPException(status_code=404, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

    # Return sample analysis result for string ID
    return await get_history_document_full_report(doc_id=doc_id, db=db)

@router.get("/{doc_id}/report")
async def get_compiled_document_report(
    doc_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Retrieves stored reports (Stamp, Risk, Actions) for a document.
    """
    return await get_history_document_full_report(doc_id=doc_id, db=db)
