import pytest
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.stamp import StampFields
from app.services.stamp import stamp_rules
from app.services.risk_analyzer import risk_analyzer
from app.db.database import SessionLocal, Base, engine
from app.db import models
from app.routers.advocates import seed_sample_appointments_if_empty
from app.routers.deadlines import seed_sample_deadlines_if_empty

Base.metadata.create_all(bind=engine)
seed_sample_appointments_if_empty()
seed_sample_deadlines_if_empty()

def test_exact_stamp_duty_and_penalty_calculation():
    # Deficient stamp in Telangana: paid Rs. 20 for commercial lease (min is Rs. 500)
    fields = StampFields(
        state="Telangana",
        denomination=20.0,
        document_type="commercial_lease",
        serial_or_uin="TS-2026-004128"
    )
    deficit, penalty, min_duty, state_name = stamp_rules.calculate_deficit_and_penalty(fields)
    assert min_duty == 500.0
    assert deficit == 480.0
    assert penalty == 4800.0 # 10x Section 35 penalty
    assert state_name == "Telangana"

    # Valid stamp in Karnataka (min Rs. 200)
    fields_ka = StampFields(
        state="Karnataka",
        denomination=200.0,
        document_type="rental_agreement",
        serial_or_uin="IN-KA20268894103251"
    )
    deficit_ka, penalty_ka, min_duty_ka, state_name_ka = stamp_rules.calculate_deficit_and_penalty(fields_ka)
    assert min_duty_ka == 200.0
    assert deficit_ka == 0.0
    assert penalty_ka == 0.0

@pytest.mark.asyncio
async def test_exact_risk_analyzer_for_common_people():
    contract_text = """
    RENTAL AGREEMENT
    Lessor may terminate this tenancy immediately without any notice.
    Strict 36-month lock-in period. If Lessee vacates early, entire 36 months rent is forfeited.
    Party B shall unconditionally indemnify and hold harmless Party A from all claims without limitation.
    """
    report = await risk_analyzer.analyze(
        document_text=contract_text,
        doc_type="rental_agreement"
    )
    assert report.risk_score >= 60
    assert report.overall_risk.value in ["medium", "high"]
    assert any("Lock-In" in r.title for r in report.identified_risks)
    assert any("Indemnity" in r.title for r in report.identified_risks)
    assert len(report.missing_clauses) > 0
    assert len(report.what_steps_to_take) > 0

def test_advocate_appointments_and_pending_flow():
    db = SessionLocal()
    try:
        adv = db.query(models.Advocate).first()
        assert adv is not None

        # Check that appointments exist
        apps = db.query(models.Appointment).all()
        assert len(apps) >= 1
        
        # Check pending filter
        pending_apps = db.query(models.Appointment).filter(models.Appointment.status == "pending").all()
        assert len(pending_apps) >= 1
    finally:
        db.close()

def test_deadline_tracker_rent_and_bond_rules():
    db = SessionLocal()
    try:
        deadlines = db.query(models.Deadline).all()
        assert len(deadlines) >= 1
        assert any(d.category == "rent_payment" for d in deadlines)
    finally:
        db.close()

def test_proactive_brief_extraction_differentiation():
    from app.services.rag_service import rag_service
    
    # Contract 1: TS Residential
    text1 = """
    RESIDENTIAL RENTAL AGREEMENT
    Between K. V. Raman (Lessor) and Sri Rama Krishna (Lessee) at Hyderabad, Telangana.
    Monthly rent is Rs. 35,000/-. Refundable security deposit is Rs. 1,00,000/-.
    Either party may terminate by giving 1 month prior written notice.
    """
    brief1 = rag_service.get_proactive_brief(text=text1)
    assert brief1["rent"] == "Rs. 35,000/-"
    assert brief1["deposit"] == "Rs. 1,00,000/-"
    assert brief1["party_one"] == "K. V. Raman"
    assert "Hyderabad" in brief1["state"] or "Telangana" in brief1["state"]

    # Contract 2: Commercial Lease with Lock-In and High Rent
    text2 = """
    COMMERCIAL LEASE AGREEMENT
    Between Prime Properties Ltd (Lessor) and Zenith Logistics (Lessee) at Shamshabad.
    Monthly rent is Rs. 1,50,000/-.
    Strict 36 months lock-in period. Entire 36 months rent is immediately forfeited as penalty.
    Lessee unconditionally indemnifies Lessor against all claims.
    Lessor may terminate immediately without notice.
    """
    brief2 = rag_service.get_proactive_brief(text=text2)
    assert brief2["party_one"] == "Prime Properties Ltd"
    assert any("lock-in" in alert.lower() for alert in brief2["key_alerts"])
    assert any("indemnity" in alert.lower() for alert in brief2["key_alerts"])

    # Prove they are completely different solutions
    assert brief1["rent"] != brief2["rent"]
    assert brief1["party_one"] != brief2["party_one"]

@pytest.mark.asyncio
async def test_strictly_grounded_qa_differentiation():
    from app.services.rag_service import rag_service
    
    doc_text = """
    LEASE AGREEMENT
    Monthly rent of Rs. 42,000/- payable on or before 7th of each month.
    Deposit is Rs. 2,00,000/-.
    Notice period for termination is 60 days.
    """
    
    # 1. Query about rent
    ans_rent = await rag_service.answer_query(user_id=1, query="What is the rent payable?", document_text=doc_text)
    assert "42,000" in ans_rent

    # 2. Query about notice period
    ans_notice = await rag_service.answer_query(user_id=1, query="What is the notice period for eviction or termination?", document_text=doc_text)
    assert "60 days" in ans_notice

    # 3. Query about completely omitted term (e.g. arbitration or patent)
    ans_omitted = await rag_service.answer_query(user_id=1, query="Does this agreement have an arbitration clause?", document_text=doc_text)
    assert "NOT FOUND" in ans_omitted or "absent" in ans_omitted.lower() or "missing" in ans_omitted.lower()


