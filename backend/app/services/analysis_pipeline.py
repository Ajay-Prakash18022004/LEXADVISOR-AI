import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db import models
from app.services.document_parser import parse_document
from app.services.stamp import ocr_service, stamp_extractor, stamp_rules, qr_service, forensics
from app.services.risk_analyzer import risk_analyzer
from app.services.action_engine import action_engine
from app.core.scoring import compute_confidence
from app.schemas.stamp import StampReport, CheckResult
from app.core.logging import logger

async def analyze_stamp_from_data(text: str, images: list) -> StampReport:
    """
    Executes complete stamp authenticity pipeline:
    1. Extract structured fields
    2. Format, duty, dates, and state validation against stamp_rules.json
    3. QR/UIN presence & portal link check
    4. Forensics (ELA, sharpness, color profile)
    5. Cross-check against contract body
    6. Authenticity confidence score & risk level calculation
    """
    fields = await stamp_extractor.extract_fields(text)

    checks: List[CheckResult] = []
    checks += stamp_rules.validate(fields)
    checks += qr_service.check(images, fields)
    checks += forensics.run(images)
    checks += stamp_rules.cross_check(fields, text)

    score, level = compute_confidence(checks)
    recommendations = stamp_rules.recommend(checks, fields)

    deficit, penalty, min_duty, state_display = stamp_rules.calculate_deficit_and_penalty(fields)
    plain_verdict = stamp_rules.get_plain_english_verdict(fields, checks, deficit, penalty)
    stamp_steps = stamp_rules.get_action_steps_for_stamp(fields, deficit, penalty)

    metadata = {
        "state": state_display,
        "certificate_number": fields.serial_or_uin or "N/A",
        "duty_amount_paid": fields.denomination or 0.0,
        "minimum_duty_required": min_duty,
        "shortfall_deficit": deficit,
        "section_35_penalty": penalty
    }

    return StampReport(
        fields=fields,
        checks=checks,
        confidence_score=score,
        score=score,
        risk_level=level,
        recommendations=recommendations,
        metadata=metadata,
        deficit_cure_amount=deficit,
        statutory_penalty_estimate=penalty,
        minimum_duty_required=min_duty,
        state_duty_schedule=state_display,
        plain_english_verdict=plain_verdict,
        what_steps_to_take=stamp_steps
    )

async def run_full_analysis(document_id: int, user_id: int, db: Session) -> Dict[str, Any]:
    """
    Orchestrates the complete one-shot decision support pipeline:
    1. Authenticity: Stamp Paper & E-Stamp Analyzer (TS/AP rules)
    2. Vulnerability: AI Contract Risk Analyzer
    3. Strategic Execution: Legal Action Recommendation Engine
    Persists structured reports in database.
    """
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == user_id
    ).first()

    if not doc:
        raise ValueError(f"Document {document_id} not found for user {user_id}")

    text, images = parse_document(doc.file_path)
    if not doc.extracted_text and text:
        doc.extracted_text = text
        db.commit()

    # 1. Stamp Authenticity Analysis
    stamp_report = await analyze_stamp_from_data(text, images)

    # 2. Contract Risk Analysis
    risk_report = await risk_analyzer.analyze(
        document_text=text,
        doc_type=doc.doc_type,
        stamp_report=stamp_report,
        document_id=document_id
    )

    # 3. Legal Action Recommendations
    action_plan = await action_engine.recommend(
        document_text=text,
        risk_report=risk_report,
        stamp_report=stamp_report,
        document_id=document_id
    )

    # Save reports in database
    _save_reports_to_db(db, document_id, stamp_report, risk_report, action_plan)

    return {
        "document_id": document_id,
        "filename": doc.filename,
        "stamp": stamp_report,
        "risk": risk_report,
        "plan": action_plan
    }

def _save_reports_to_db(db: Session, document_id: int, stamp: StampReport, risk, plan):
    try:
        # Save or update StampReport
        existing_stamp = db.query(models.StampReport).filter(models.StampReport.document_id == document_id).first()
        if existing_stamp:
            existing_stamp.fields_json = json.dumps(stamp.fields.model_dump())
            existing_stamp.checks_json = json.dumps([c.model_dump() for c in stamp.checks])
            existing_stamp.confidence_score = stamp.confidence_score
            existing_stamp.risk_level = stamp.risk_level.value
            existing_stamp.recommendations_json = json.dumps(stamp.recommendations)
        else:
            db_stamp = models.StampReport(
                document_id=document_id,
                fields_json=json.dumps(stamp.fields.model_dump()),
                checks_json=json.dumps([c.model_dump() for c in stamp.checks]),
                confidence_score=stamp.confidence_score,
                risk_level=stamp.risk_level.value,
                recommendations_json=json.dumps(stamp.recommendations)
            )
            db.add(db_stamp)

        # Save or update RiskReport
        existing_risk = db.query(models.RiskReport).filter(models.RiskReport.document_id == document_id).first()
        if existing_risk:
            existing_risk.overall_risk = risk.overall_risk.value
            existing_risk.risk_score = risk.risk_score
            existing_risk.report_json = json.dumps(risk.model_dump())
        else:
            db_risk = models.RiskReport(
                document_id=document_id,
                overall_risk=risk.overall_risk.value,
                risk_score=risk.risk_score,
                report_json=json.dumps(risk.model_dump())
            )
            db.add(db_risk)

        # Save or update ActionPlan
        existing_plan = db.query(models.ActionPlan).filter(models.ActionPlan.document_id == document_id).first()
        if existing_plan:
            existing_plan.action_urgency = plan.action_urgency.value
            existing_plan.plan_json = json.dumps(plan.model_dump())
        else:
            db_plan = models.ActionPlan(
                document_id=document_id,
                action_urgency=plan.action_urgency.value,
                plan_json=json.dumps(plan.model_dump())
            )
            db.add(db_plan)

        db.commit()
    except Exception as e:
        logger.error(f"Error persisting reports to database: {e}")
        db.rollback()
