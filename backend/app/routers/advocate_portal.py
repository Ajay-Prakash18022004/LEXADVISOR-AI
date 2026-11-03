import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.database import get_db
from app.db import models
from app.core.dependencies import require_advocate
from app.core.logging import logger
from app.services.email_notification_service import send_consultation_notification

router = APIRouter(prefix="/advocate", tags=["Advocate Portal"])

class RejectionPayload(BaseModel):
    reason: str

class ReschedulePayload(BaseModel):
    new_date: str
    new_time: str
    reason: Optional[str] = "Advocate schedule adjustment"

class AvailabilityPayload(BaseModel):
    available_days: Optional[str] = None
    available_time_slots: Optional[List[str]] = None
    consultation_modes: Optional[str] = None
    slot_duration_mins: Optional[int] = None

@router.get("/profiles")
def get_advocate_profiles(
    db: Session = Depends(get_db)
):
    """
    Returns all 12 verified advocate profiles with live counts for chamber profile switching.
    """
    advs = db.query(models.Advocate).filter(models.Advocate.id <= 12).order_by(models.Advocate.id.asc()).all()
    profiles = []
    for a in advs:
        pending_cnt = db.query(models.Appointment).filter(
            models.Appointment.advocate_id == a.id,
            models.Appointment.status == "pending"
        ).count()
        confirmed_cnt = db.query(models.Appointment).filter(
            models.Appointment.advocate_id == a.id,
            models.Appointment.status == "confirmed"
        ).count()
        profiles.append({
            "id": a.id,
            "name": a.name,
            "bar_council_id": a.bar_council_id,
            "court": getattr(a, 'court_standing', None) or f"{a.city} Civil Court & High Court",
            "city": a.city,
            "state": a.state,
            "specialization": a.specialization,
            "consultation_fee": a.consultation_fee,
            "verification_status": a.verification_status or "verified",
            "pending_count": pending_cnt,
            "confirmed_count": confirmed_cnt,
            "image_url": getattr(a, 'avatar_url', None)
        })
    return profiles

@router.get("/dashboard/stats")
def get_advocate_dashboard_stats(
    advocate_id: Optional[int] = None,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    """
    Returns live database statistics for the advocate dashboard.
    Supports switching between advocate profiles or master view.
    """
    target_adv = None
    if advocate_id and advocate_id > 0:
        target_adv = db.query(models.Advocate).filter(models.Advocate.id == advocate_id).first()
    
    if not target_adv:
        target_adv = user.advocate_profile
        if not target_adv:
            target_adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        if not target_adv:
            target_adv = db.query(models.Advocate).first()

    adv_id = target_adv.id if target_adv else 1

    # Appointments: if advocate_id == 0, master view of all advocates
    if advocate_id == 0:
        appointments = db.query(models.Appointment).all()
        cases = db.query(models.LegalCase).all()
        recent_pending_query = db.query(models.Appointment).filter(models.Appointment.status == "pending")
        recent_upcoming_query = db.query(models.Appointment).filter(models.Appointment.status == "confirmed")
    else:
        appointments = db.query(models.Appointment).filter(models.Appointment.advocate_id == adv_id).all()
        cases = db.query(models.LegalCase).filter(models.LegalCase.advocate_id == adv_id).all()
        recent_pending_query = db.query(models.Appointment).filter(
            models.Appointment.advocate_id == adv_id,
            models.Appointment.status == "pending"
        )
        recent_upcoming_query = db.query(models.Appointment).filter(
            models.Appointment.advocate_id == adv_id,
            models.Appointment.status == "confirmed"
        )

    total_consultations = len(appointments)
    pending_consultations = sum(1 for a in appointments if a.status == "pending")
    upcoming_consultations = sum(1 for a in appointments if a.status == "confirmed")
    completed_consultations = sum(1 for a in appointments if a.status == "completed")
    earnings = sum(a.fee for a in appointments if a.status in ["confirmed", "completed"])

    active_cases = sum(1 for c in cases if c.status not in ["Resolved", "Closed"])
    resolved_cases = sum(1 for c in cases if c.status in ["Resolved", "Closed"])

    recent_pending = recent_pending_query.order_by(models.Appointment.created_at.desc()).limit(10).all()
    recent_upcoming = recent_upcoming_query.order_by(models.Appointment.appointment_date.asc()).limit(10).all()

    def _enrich_app(a):
        adv_obj = a.advocate or db.query(models.Advocate).filter(models.Advocate.id == a.advocate_id).first()
        return {
            "id": a.id,
            "advocate_id": a.advocate_id,
            "advocate_name": adv_obj.name if adv_obj else "Advocate Chamber",
            "advocate_bar_id": adv_obj.bar_council_id if adv_obj else "TS/BAR/VERIFIED",
            "client_name": a.client_name,
            "client_phone": a.client_phone,
            "client_email": a.client_email,
            "appointment_date": a.appointment_date,
            "time_slot": a.time_slot,
            "consultation_type": a.consultation_type,
            "case_subject": a.case_subject,
            "case_notes": a.case_notes,
            "fee": a.fee,
            "status": a.status,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else None
        }

    return {
        "advocate_id": adv_id,
        "name": target_adv.name if target_adv else user.name,
        "bar_council_id": target_adv.bar_council_id if target_adv else "TS/1402/2014",
        "verification_status": target_adv.verification_status if target_adv else "verified",
        "specialization": target_adv.specialization if target_adv else "Civil & Property Law",
        "city": target_adv.city if target_adv else "Hyderabad",
        "consultation_fee": target_adv.consultation_fee if target_adv else 1500.0,
        "stats": {
            "total_consultations": total_consultations,
            "pending_consultations": pending_consultations,
            "upcoming_consultations": upcoming_consultations,
            "completed_consultations": completed_consultations,
            "active_cases": active_cases,
            "resolved_cases": resolved_cases,
            "earnings": earnings
        },
        "recent_pending": [_enrich_app(a) for a in recent_pending],
        "recent_upcoming": [_enrich_app(a) for a in recent_upcoming]
    }

@router.get("/consultations/pending")
def get_pending_consultations(
    advocate_id: Optional[int] = None,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    query = db.query(models.Appointment).filter(models.Appointment.status == "pending")
    if advocate_id and advocate_id > 0:
        query = query.filter(models.Appointment.advocate_id == advocate_id)
    
    pending = query.order_by(models.Appointment.created_at.desc()).all()

    results = []
    for a in pending:
        adv_obj = a.advocate or db.query(models.Advocate).filter(models.Advocate.id == a.advocate_id).first()
        results.append({
            "id": a.id,
            "advocate_id": a.advocate_id,
            "advocate_name": adv_obj.name if adv_obj else "Advocate Chamber",
            "advocate_bar_id": adv_obj.bar_council_id if adv_obj else "TS/BAR/VERIFIED",
            "client_name": a.client_name,
            "client_phone": a.client_phone,
            "client_email": a.client_email,
            "appointment_date": a.appointment_date,
            "time_slot": a.time_slot,
            "consultation_type": a.consultation_type,
            "case_subject": a.case_subject,
            "case_notes": a.case_notes,
            "fee": a.fee,
            "status": a.status,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else None
        })
    return results

@router.get("/consultations/upcoming")
def get_upcoming_consultations(
    advocate_id: Optional[int] = None,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    query = db.query(models.Appointment).filter(models.Appointment.status == "confirmed")
    if advocate_id and advocate_id > 0:
        query = query.filter(models.Appointment.advocate_id == advocate_id)
    
    upcoming = query.order_by(models.Appointment.appointment_date.asc()).all()

    results = []
    for a in upcoming:
        adv_obj = a.advocate or db.query(models.Advocate).filter(models.Advocate.id == a.advocate_id).first()
        results.append({
            "id": a.id,
            "advocate_id": a.advocate_id,
            "advocate_name": adv_obj.name if adv_obj else "Advocate Chamber",
            "advocate_bar_id": adv_obj.bar_council_id if adv_obj else "TS/BAR/VERIFIED",
            "client_name": a.client_name,
            "client_phone": a.client_phone,
            "client_email": a.client_email,
            "appointment_date": a.appointment_date,
            "time_slot": a.time_slot,
            "consultation_type": a.consultation_type,
            "case_subject": a.case_subject,
            "case_notes": a.case_notes,
            "fee": a.fee,
            "status": a.status,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else None
        })
    return results

@router.post("/consultations/{id}/accept")
def accept_consultation(
    id: str,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Consultation request not found.")

    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == int(id)
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Consultation request not found.")

    appointment.status = "confirmed"
    adv = appointment.advocate or db.query(models.Advocate).filter(models.Advocate.id == appointment.advocate_id).first()
    adv_id = adv.id if adv else 1

    # Automatically create a corresponding LegalCase if not existing
    existing_case = db.query(models.LegalCase).filter(models.LegalCase.appointment_id == appointment.id).first()
    if not existing_case:
        client_user = None
        if appointment.user_id:
            client_user = db.query(models.User).filter(models.User.id == appointment.user_id).first()
        if not client_user:
            client_user = db.query(models.User).filter(models.User.email == appointment.client_email).first()
        if not client_user:
            client_user = db.query(models.User).filter(models.User.role == "client").first()

        client_id = client_user.id if client_user else 2
        case_count = db.query(models.LegalCase).count()
        new_case = models.LegalCase(
            case_number=f"LEX-CASE-2026-{1001 + case_count}",
            client_id=client_id,
            advocate_id=adv_id,
            appointment_id=appointment.id,
            title=appointment.case_subject,
            category="Legal Advisory & Litigation",
            status="Under Review",
            description=appointment.case_notes or "Case opened following confirmed consultation.",
            next_hearing_date=appointment.appointment_date
        )
        db.add(new_case)
        db.commit()
        db.refresh(new_case)

        activity = models.CaseActivity(
            case_id=new_case.id,
            author_id=user.id,
            author_name=adv.name if adv else user.name,
            author_role="advocate",
            activity_type="status_change",
            message=f"Consultation accepted for {appointment.appointment_date} at {appointment.time_slot}. Case opened for preliminary review.",
            is_private_to_advocate=False
        )
        db.add(activity)

    db.commit()

    # Trigger email notification to sureshtakur194@gmail.com and client
    try:
        send_consultation_notification(
            appointment_id=appointment.id,
            advocate_name=adv.name if adv else user.name,
            advocate_email=adv.email if adv else "sureshtakur194@gmail.com",
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            client_email=appointment.client_email,
            appointment_date=appointment.appointment_date,
            time_slot=appointment.time_slot,
            consultation_type=appointment.consultation_type,
            case_subject=f"[CONFIRMED] {appointment.case_subject}",
            case_notes=appointment.case_notes or "Accepted by Advocate",
            fee=appointment.fee
        )
    except Exception as e:
        logger.warning(f"Could not send accept email: {e}")

    return {
        "status": "success",
        "message": f"Consultation confirmed successfully by {adv.name if adv else 'Advocate'}.",
        "appointment_id": appointment.id,
        "advocate_id": appointment.advocate_id,
        "advocate_name": adv.name if adv else "Advocate",
        "status_code": "confirmed"
    }

@router.post("/consultations/{id}/reject")
def reject_consultation(
    id: str,
    payload: RejectionPayload,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Consultation request not found.")
    if not payload.reason or len(payload.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A valid rejection reason must be provided (at least 5 characters).")

    adv = user.advocate_profile
    adv_id = adv.id if adv else 1

    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == int(id)
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Consultation request not found.")

    appointment.status = "rejected"
    appointment.rejection_reason = payload.reason.strip()
    db.commit()

    # Send rejection notification to sureshtakur194@gmail.com and client
    try:
        send_consultation_notification(
            appointment_id=appointment.id,
            advocate_name=adv.name if adv else user.name,
            advocate_email=adv.email if adv else "sureshtakur194@gmail.com",
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            client_email=appointment.client_email,
            appointment_date=appointment.appointment_date,
            time_slot=appointment.time_slot,
            consultation_type=appointment.consultation_type,
            case_subject=f"[REJECTED] {appointment.case_subject}",
            case_notes=f"Rejection reason: {payload.reason.strip()}",
            fee=appointment.fee
        )
    except Exception as e:
        logger.warning(f"Could not send rejection email: {e}")

    return {
        "status": "success",
        "message": "Consultation request rejected with reason provided.",
        "appointment_id": appointment.id,
        "reason": payload.reason.strip()
    }

@router.post("/consultations/{id}/reschedule")
def reschedule_consultation(
    id: str,
    payload: ReschedulePayload,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Consultation not found.")
    adv = user.advocate_profile
    adv_id = adv.id if adv else 1

    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == int(id)
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    # Check for scheduling conflict on the new slot
    conflict = db.query(models.Appointment).filter(
        models.Appointment.advocate_id == adv_id,
        models.Appointment.appointment_date == payload.new_date,
        models.Appointment.time_slot == payload.new_time,
        models.Appointment.status == "confirmed",
        models.Appointment.id != int(id)
    ).first()

    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Scheduling conflict: You already have a confirmed consultation on {payload.new_date} at {payload.new_time}."
        )

    appointment.rescheduled_date = payload.new_date
    appointment.rescheduled_time = payload.new_time
    appointment.appointment_date = payload.new_date
    appointment.time_slot = payload.new_time
    appointment.status = "confirmed"
    db.commit()

    # Trigger reschedule email
    try:
        send_consultation_notification(
            appointment_id=appointment.id,
            advocate_name=adv.name if adv else user.name,
            advocate_email=adv.email if adv else "sureshtakur194@gmail.com",
            client_name=appointment.client_name,
            client_phone=appointment.client_phone,
            client_email=appointment.client_email,
            appointment_date=payload.new_date,
            time_slot=payload.new_time,
            consultation_type=appointment.consultation_type,
            case_subject=f"[RESCHEDULED] {appointment.case_subject}",
            case_notes=f"New Date & Time confirmed: {payload.new_date} at {payload.new_time}. Note: {payload.reason}",
            fee=appointment.fee
        )
    except Exception as e:
        logger.warning(f"Could not send reschedule email: {e}")

    return {
        "status": "success",
        "message": f"Consultation rescheduled to {payload.new_date} at {payload.new_time}.",
        "appointment_id": appointment.id
    }

@router.post("/consultations/{id}/complete")
def complete_consultation(
    id: str,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Consultation not found.")
    adv = user.advocate_profile
    adv_id = adv.id if adv else 1

    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == int(id)
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Consultation not found.")

    appointment.status = "completed"
    db.commit()

    return {
        "status": "success",
        "message": "Consultation marked as completed.",
        "appointment_id": appointment.id
    }

@router.get("/profile")
def get_advocate_profile(
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    adv = user.advocate_profile
    if not adv:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()

    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found.")

    # Parse time slots
    slots = []
    if adv.available_time_slots:
        try:
            slots = json.loads(adv.available_time_slots)
        except Exception:
            slots = [s.strip() for s in adv.available_time_slots.split(",") if s.strip()]

    return {
        "id": adv.id,
        "name": adv.name,
        "email": adv.email,
        "phone": adv.phone,
        "bar_council_id": adv.bar_council_id,
        "state_bar_council": adv.state_bar_council or "Bar Council of Telangana",
        "verification_status": adv.verification_status,
        "specialization": adv.specialization,
        "experience_years": adv.experience_years,
        "consultation_fee": adv.consultation_fee,
        "bio": adv.bio or "",
        "address": adv.address or "",
        "city": adv.city,
        "state": adv.state,
        "languages_spoken": adv.languages_spoken or "English, Hindi, Telugu",
        "available_days": adv.available_days or "Monday,Tuesday,Wednesday,Thursday,Friday",
        "available_time_slots": slots,
        "consultation_modes": adv.consultation_modes or "In-Chamber, Phone Consultation, Video Call",
        "slot_duration_mins": adv.slot_duration_mins or 30
    }

@router.put("/availability")
def update_advocate_availability(
    payload: AvailabilityPayload,
    user: models.User = Depends(require_advocate),
    db: Session = Depends(get_db)
):
    adv = user.advocate_profile
    if not adv:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()

    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found.")

    if payload.available_days is not None:
        adv.available_days = payload.available_days
    if payload.available_time_slots is not None:
        adv.available_time_slots = json.dumps(payload.available_time_slots)
    if payload.consultation_modes is not None:
        adv.consultation_modes = payload.consultation_modes
    if payload.slot_duration_mins is not None:
        adv.slot_duration_mins = payload.slot_duration_mins

    db.commit()
    db.refresh(adv)

    return {
        "status": "success",
        "message": "Availability schedule updated successfully.",
        "available_days": adv.available_days,
        "available_time_slots": json.loads(adv.available_time_slots) if adv.available_time_slots else [],
        "slot_duration_mins": adv.slot_duration_mins
    }
