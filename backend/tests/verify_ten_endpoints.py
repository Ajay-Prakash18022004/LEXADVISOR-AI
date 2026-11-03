import asyncio
import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal, Base, engine
from app.db import models
from app.routers import (
    documents,
    analysis,
    stamp,
    risk,
    actions,
    deadlines,
    advocates,
    chat
)
from app.schemas.deadline import DeadlineCreate
from app.schemas.appointment import AppointmentCreate
from app.schemas.chat import ChatQueryRequest

Base.metadata.create_all(bind=engine)

async def test_all_ten():
    results = {}
    db = SessionLocal()

    user = db.query(models.User).filter(models.User.email == "advocate@lexadvisor.ai").first()
    if not user:
        from app.core.security import get_password_hash
        user = models.User(name="Advocate Counsel", email="advocate@lexadvisor.ai", hashed_password=get_password_hash("LexPass@2026"))
        db.add(user)
        db.commit()
        db.refresh(user)

    # 1. Document Upload & Extraction
    try:
        sample_text = "TENANCY AGREEMENT Hyderabad Telangana. Monthly Rent: Rs. 35,000/-. Deposit: Rs. 1,50,000/-. Term: 11 Months. Clause 8: Entire deposit forfeited on early exit."
        # Call doc upload simulation via model persistence
        doc = models.Document(
            user_id=user.id,
            filename="Test_Residential_Lease.txt",
            file_path="storage/uploads/test_residential.txt",
            doc_type="rental_agreement",
            state="TS",
            extracted_text=sample_text
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        results["1_document_upload"] = {"status": "SUCCESS", "doc_id": doc.id, "filename": doc.filename}
    except Exception as e:
        results["1_document_upload"] = {"status": "FAILED", "error": str(e)}

    # 2. Document Listing
    try:
        doc_list = documents.list_documents(db=db, user=user)
        results["2_document_listing"] = {"status": "SUCCESS", "count": len(doc_list), "sample": doc_list[0].filename if doc_list else None}
    except Exception as e:
        results["2_document_listing"] = {"status": "FAILED", "error": str(e)}

    # 3. Document Analysis (/analysis/full)
    try:
        full_res = await analysis.analyze_full_direct(
            file=None,
            text_content=sample_text,
            doc_type="rental_agreement",
            db=db,
            user=user
        )
        results["3_document_analysis"] = {
            "status": "SUCCESS",
            "document_id": full_res.get("document_id"),
            "has_stamp": bool(full_res.get("stamp")),
            "has_risk": bool(full_res.get("risk")),
            "has_plan": bool(full_res.get("plan"))
        }
    except Exception as e:
        results["3_document_analysis"] = {"status": "FAILED", "error": str(e)}

    # 4. Stamp Duty Assessment (/stamp/analyze)
    try:
        stamp_res = await stamp.analyze_stamp(
            file=None,
            text_content="GOVERNMENT OF TELANGANA e-Stamp Certificate IN-TS20268894103251 Denomination: Rs. 100/-. Monthly Rent Rs. 35,000/-"
        )
        results["4_stamp_duty_assessment"] = {
            "status": "SUCCESS",
            "confidence_score": stamp_res.confidence_score,
            "risk_level": stamp_res.risk_level.value if hasattr(stamp_res.risk_level, 'value') else stamp_res.risk_level,
            "denomination": stamp_res.fields.denomination if stamp_res.fields else 0
        }
    except Exception as e:
        results["4_stamp_duty_assessment"] = {"status": "FAILED", "error": str(e)}

    # 5. Clause Risk Analysis (/risk/analyze)
    try:
        risk_res = await risk.analyze_contract_risk(
            file=None,
            text_content="Strict 36-month lock-in penalty. Landlord can enter premises without notice. Unilateral indemnity without limitation.",
            doc_type="rental_agreement"
        )
        results["5_clause_risk_analysis"] = {
            "status": "SUCCESS",
            "score": risk_res.risk_score,
            "overall_risk": risk_res.overall_risk.value if hasattr(risk_res.overall_risk, 'value') else risk_res.overall_risk,
            "risks_count": len(risk_res.identified_risks)
        }
    except Exception as e:
        results["5_clause_risk_analysis"] = {"status": "FAILED", "error": str(e)}

    # 6. Legal Action Roadmap (/actions/recommend)
    try:
        action_res = await actions.recommend_legal_actions(
            file=None,
            text_content=sample_text
        )
        results["6_legal_action_roadmap"] = {
            "status": "SUCCESS",
            "urgency": action_res.action_urgency.value if hasattr(action_res.action_urgency, 'value') else action_res.action_urgency,
            "steps_count": len(action_res.steps)
        }
    except Exception as e:
        results["6_legal_action_roadmap"] = {"status": "FAILED", "error": str(e)}

    # 7. Rent Reminders & Deadlines (/deadlines)
    try:
        deadlines_list = deadlines.get_deadlines(db=db)
        new_dl = deadlines.create_deadline(
            req=DeadlineCreate(
                title="Audited December Rent Settlement",
                category="rent_payment",
                due_date="2026-12-05",
                amount=35000.0,
                recurrence="monthly",
                remind_days_before=3,
                notes="Automated statutory rent calendar entry."
            ),
            db=db,
            user=user
        )
        results["7_rent_reminders"] = {
            "status": "SUCCESS",
            "existing_count": len(deadlines_list),
            "created_id": new_dl.id,
            "created_title": new_dl.title
        }
    except Exception as e:
        results["7_rent_reminders"] = {"status": "FAILED", "error": str(e)}

    # 8. Advocate Directory (/advocates/nearby)
    try:
        adv_list = advocates.get_nearby_advocates(city="Hyderabad", state="TS")
        results["8_advocate_directory"] = {
            "status": "SUCCESS",
            "count": len(adv_list),
            "sample_advocate": adv_list[0].name if adv_list else None
        }
    except Exception as e:
        results["8_advocate_directory"] = {"status": "FAILED", "error": str(e)}

    # 9. Appointment Booking (/advocates/appointments)
    try:
        adv = db.query(models.Advocate).first()
        app_res = advocates.book_appointment(
            req=AppointmentCreate(
                advocate_id=adv.id,
                client_name="Syed Amanullah",
                client_phone="+91 98490 11223",
                client_email="sureshtakur194@gmail.com",
                appointment_date="2026-11-15",
                time_slot="04:30 PM",
                consultation_type="Video Call",
                case_subject="Tenancy Clause 8 Forfeiture Defense",
                case_notes="Booked via LexAdvisor AI verification suite.",
                fee=adv.consultation_fee
            ),
            db=db,
            user=user
        )
        results["9_appointment_booking"] = {
            "status": "SUCCESS",
            "appointment_id": app_res.id,
            "advocate_name": app_res.advocate_name,
            "status_label": app_res.status
        }
    except Exception as e:
        results["9_appointment_booking"] = {"status": "FAILED", "error": str(e)}

    # 10. AI Chatbot (/chat/ask)
    try:
        chat_res = await chat.ask_legal_question(
            req=ChatQueryRequest(
                query="Is a 100% deposit forfeiture clause valid under Section 74 of the Indian Contract Act?",
                document_id=doc.id,
                document_text=sample_text
            ),
            db=db,
            user=user
        )
        results["10_ai_chatbot"] = {
            "status": "SUCCESS",
            "reply_length": len(chat_res.content),
            "sample_snippet": chat_res.content[:100]
        }
    except Exception as e:
        results["10_ai_chatbot"] = {"status": "FAILED", "error": str(e)}

    db.close()
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    asyncio.run(test_all_ten())

