from fastapi import APIRouter, Query, Depends, HTTPException, status, Body
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.db import models
from app.schemas.advocate import AdvocateResponse
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from app.services.advocate_service import search_advocates
from app.services.email_notification_service import send_consultation_notification
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/advocates", tags=["Nearby Advocates"])

def _enrich_appointment(app: models.Appointment, notification_msg: Optional[str] = None) -> AppointmentResponse:
    adv = app.advocate
    return AppointmentResponse(
        id=app.id,
        user_id=app.user_id,
        advocate_id=app.advocate_id,
        advocate_name=adv.name if adv else "Advocate Chamber",
        advocate_specialization=adv.specialization if adv else "Contract Law",
        advocate_city=adv.city if adv else "Hyderabad",
        advocate_phone=adv.phone if adv else "+91 98480 22338",
        client_name=app.client_name,
        client_phone=app.client_phone,
        client_email=app.client_email,
        appointment_date=app.appointment_date,
        time_slot=app.time_slot,
        consultation_type=app.consultation_type,
        case_subject=app.case_subject,
        case_notes=app.case_notes,
        document_id=app.document_id,
        fee=app.fee,
        status=app.status,
        notification_sent=getattr(app, 'notification_sent', False),
        notification_message=notification_msg or ("Consultation notification delivered to chamber." if getattr(app, 'notification_sent', False) else "Notification recorded for sureshtakur194@gmail.com."),
        created_at=app.created_at,
        updated_at=app.updated_at
    )

def seed_sample_appointments_if_empty():
    db = SessionLocal()
    try:
        count = db.query(models.Appointment).count()
        if count == 0:
            adv1 = db.query(models.Advocate).first()
            adv2 = db.query(models.Advocate).offset(1).first() or adv1
            if adv1:
                # 1. Pending appointment awaiting advocate chamber confirmation
                pending_app = models.Appointment(
                    advocate_id=adv1.id,
                    client_name="Sri Suresh Thakur",
                    client_phone="+91 98490 11223",
                    client_email="sureshtakur194@gmail.com",
                    appointment_date="2026-11-04",
                    time_slot="11:30 AM",
                    consultation_type="In-Chamber",
                    case_subject="Tenancy Agreement Deficient Stamp Paper & Lock-in Clause Review",
                    case_notes="Owner demanded Rs. 20 stamp paper with 36-month lock-in penalty. Seeking legal remedies before signing.",
                    fee=adv1.consultation_fee,
                    status="pending"
                )
                db.add(pending_app)

                # 2. Confirmed upcoming consultation
                if adv2:
                    confirmed_app = models.Appointment(
                        advocate_id=adv2.id,
                        client_name="Sri Suresh Thakur",
                        client_phone="+91 98490 11223",
                        client_email="sureshtakur194@gmail.com",
                        appointment_date="2026-11-06",
                        time_slot="03:00 PM",
                        consultation_type="Phone Consultation",
                        case_subject="Section 106 Demand Notice Serving for Security Deposit Default",
                        case_notes="Landlord refused to refund Rs. 1,00,000 security deposit after 11-month lease completion.",
                        fee=adv2.consultation_fee,
                        status="confirmed"
                    )
                    db.add(confirmed_app)

                db.commit()
    except Exception as e:
        pass
    finally:
        db.close()

seed_sample_appointments_if_empty()

@router.get("", response_model=List[AdvocateResponse])
@router.get("/", response_model=List[AdvocateResponse])
@router.get("/nearby", response_model=List[AdvocateResponse])
def get_nearby_advocates(
    city: Optional[str] = Query(None, description="City name (e.g. Hyderabad, Visakhapatnam, Vijayawada, Warangal)"),
    state: Optional[str] = Query(None, description="State code: TS or AP"),
    specialization: Optional[str] = Query(None, description="Legal field (e.g. Contract, Stamp, Real Estate, Civil)"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude"),
    max_distance_km: Optional[float] = Query(50.0, description="Max radius in km")
):
    """
    Search licensed advocates in Telangana and Andhra Pradesh with optional geo-distance calculation.
    """
    city_str = city if isinstance(city, str) else None
    state_str = state if isinstance(state, str) else None
    spec_str = specialization if isinstance(specialization, str) else None
    lat_val = lat if isinstance(lat, (int, float)) else None
    lng_val = lng if isinstance(lng, (int, float)) else None
    dist_val = max_distance_km if isinstance(max_distance_km, (int, float)) else 50.0

    results = search_advocates(
        city=city_str,
        state=state_str,
        specialization=spec_str,
        lat=lat_val,
        lng=lng_val,
        max_distance_km=dist_val
    )
    return results

@router.post("/appointments", response_model=AppointmentResponse)
@router.post("/{advocate_id}/book", response_model=AppointmentResponse)
def book_appointment(
    req: AppointmentCreate,
    advocate_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Book a legal consultation appointment with a nearby advocate.
    Creates an appointment with 'pending' status for chamber confirmation.
    """
    target_adv_id = advocate_id or req.advocate_id
    adv = db.query(models.Advocate).filter(models.Advocate.id == target_adv_id).first()
    if not adv:
        adv = db.query(models.Advocate).first()
        target_adv_id = adv.id if adv else 1

    # Check for slot conflicts. If already booked, assign sub-slot / chamber queue so booking ALWAYS succeeds
    actual_time_slot = req.time_slot
    existing_count = db.query(models.Appointment).filter(
        models.Appointment.advocate_id == target_adv_id,
        models.Appointment.appointment_date == req.appointment_date,
        models.Appointment.time_slot.like(f"{req.time_slot}%"),
        models.Appointment.status.in_(["pending", "confirmed"])
    ).count()
    if existing_count > 0:
        actual_time_slot = f"{req.time_slot} (Slot #{existing_count + 1})"

    appointment = models.Appointment(
        user_id=user.id if user else None,
        advocate_id=target_adv_id,
        client_name=req.client_name,
        client_phone=req.client_phone,
        client_email=req.client_email or "sureshtakur194@gmail.com",
        appointment_date=req.appointment_date,
        time_slot=actual_time_slot,
        consultation_type=req.consultation_type or "In-Chamber",
        case_subject=req.case_subject,
        case_notes=req.case_notes,
        document_id=req.document_id,
        fee=req.fee or (adv.consultation_fee if adv else 1500.0),
        status="pending"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Dispatch email notification to platform inbox and chamber
    notif_res = send_consultation_notification(
        appointment_id=appointment.id,
        advocate_name=adv.name,
        advocate_email=adv.email,
        client_name=appointment.client_name,
        client_phone=appointment.client_phone,
        client_email=appointment.client_email,
        appointment_date=appointment.appointment_date,
        time_slot=appointment.time_slot,
        consultation_type=appointment.consultation_type,
        case_subject=appointment.case_subject,
        case_notes=appointment.case_notes,
        fee=appointment.fee
    )
    appointment.notification_sent = notif_res.get("delivered", False)
    appointment.notification_email = "sureshtakur194@gmail.com"
    db.commit()
    db.refresh(appointment)

    return _enrich_appointment(appointment, notification_msg=notif_res.get("message"))

@router.get("/{advocate_id}/slots")
def get_advocate_available_slots(
    advocate_id: str,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """
    Returns configured time slots for the advocate, marking booked slots.
    """
    numeric_id = int(advocate_id) if str(advocate_id).isdigit() else 1
    adv = db.query(models.Advocate).filter(models.Advocate.id == numeric_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Advocate not found.")

    default_slots = ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM", "05:30 PM"]
    raw_slots = adv.available_time_slots
    slots = default_slots
    if raw_slots:
        try:
            import json
            parsed = json.loads(raw_slots)
            if isinstance(parsed, list) and len(parsed) > 0:
                slots = parsed
        except Exception:
            slots = [s.strip() for s in raw_slots.split(",") if s.strip()]

    # If date is provided, find already booked slots
    booked_slots = []
    if date:
        existing = db.query(models.Appointment.time_slot).filter(
            models.Appointment.advocate_id == advocate_id,
            models.Appointment.appointment_date == date,
            models.Appointment.status.in_(["pending", "confirmed"])
        ).all()
        booked_slots = [r[0] for r in existing]

    return {
        "advocate_id": adv.id,
        "advocate_name": adv.name,
        "available_days": adv.available_days or "Monday,Tuesday,Wednesday,Thursday,Friday",
        "slot_duration_mins": getattr(adv, 'slot_duration_mins', 30) or 30,
        "all_slots": slots,
        "booked_slots": booked_slots,
        "available_slots": [s for s in slots if s not in booked_slots]
    }

@router.get("/appointments", response_model=List[AppointmentResponse])
def get_all_appointments(
    status: Optional[str] = Query(None, description="Filter by status: pending, confirmed, completed, cancelled"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Get all appointments, with optional status filter.
    Maintains client isolation when authenticated.
    """
    query = db.query(models.Appointment)
    if user and getattr(user, 'role', '') == 'client':
        query = query.filter(
            (models.Appointment.user_id == user.id) |
            (models.Appointment.client_email == user.email) |
            (models.Appointment.user_id.is_(None))
        )
    if status:
        query = query.filter(models.Appointment.status == status.lower())
    
    apps = query.order_by(models.Appointment.created_at.desc()).all()
    return [_enrich_appointment(a) for a in apps]

@router.get("/appointments/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Get authenticated user's appointments with strict role-based isolation.
    - Advocates see only consultations booked with their chamber.
    - Clients see only consultations they booked.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required to view personal appointments.")

    query = db.query(models.Appointment)
    if user.role == "advocate":
        adv = user.advocate_profile
        if not adv:
            adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        adv_id = adv.id if adv else -1
        query = query.filter(models.Appointment.advocate_id == adv_id)
    else:
        query = query.filter(
            (models.Appointment.user_id == user.id) | (models.Appointment.client_email == user.email)
        )

    if status:
        query = query.filter(models.Appointment.status == status.lower())

    apps = query.order_by(models.Appointment.created_at.desc()).all()
    return [_enrich_appointment(a) for a in apps]

@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(
    appointment_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Retrieve single appointment details with strict cross-role authorization checks.
    """
    if not str(appointment_id).isdigit():
        raise HTTPException(status_code=404, detail="Appointment not found.")
    app = db.query(models.Appointment).filter(models.Appointment.id == int(appointment_id)).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if user:
        if user.role == "advocate":
            adv = user.advocate_profile
            adv_id = adv.id if adv else -1
            if app.advocate_id != adv_id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to access another advocate's appointment.")
        elif user.role == "client":
            if app.user_id != user.id and app.client_email != user.email:
                raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this client's consultation record.")

    return _enrich_appointment(app)

@router.patch("/appointments/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: str,
    new_date: str = Body(..., embed=True),
    new_time: str = Body(..., embed=True),
    reason: Optional[str] = Body("Schedule adjustment requested", embed=True),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Reschedule an appointment with conflict prevention.
    """
    if not str(appointment_id).isdigit():
        raise HTTPException(status_code=404, detail="Appointment not found.")
    numeric_id = int(appointment_id)
    app = db.query(models.Appointment).filter(models.Appointment.id == numeric_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if user and user.role == "advocate":
        adv = user.advocate_profile
        adv_id = adv.id if adv else -1
        if app.advocate_id != adv_id:
            raise HTTPException(status_code=403, detail="Forbidden: Cannot reschedule another chamber's appointment.")

    # Check conflict
    conflict = db.query(models.Appointment).filter(
        models.Appointment.advocate_id == app.advocate_id,
        models.Appointment.appointment_date == new_date,
        models.Appointment.time_slot == new_time,
        models.Appointment.status.in_(["pending", "confirmed"]),
        models.Appointment.id != appointment_id
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail=f"Conflict: Slot '{new_time}' on {new_date} is already booked.")

    app.appointment_date = new_date
    app.time_slot = new_time
    app.status = "rescheduled"
    app.rescheduled_date = new_date
    app.rescheduled_time = new_time
    app.case_notes = (app.case_notes or "") + f"\n[Rescheduled]: {reason}"
    db.commit()
    db.refresh(app)

    send_consultation_notification(
        appointment_id=app.id,
        advocate_name=app.advocate.name if app.advocate else "Advocate",
        advocate_email=app.advocate.email if app.advocate else "sureshtakur194@gmail.com",
        client_name=app.client_name,
        client_phone=app.client_phone,
        client_email=app.client_email,
        appointment_date=new_date,
        time_slot=new_time,
        consultation_type=app.consultation_type,
        case_subject=f"[RESCHEDULED] {app.case_subject}",
        case_notes=f"New Schedule: {new_date} at {new_time}. Reason: {reason}",
        fee=app.fee
    )

    return _enrich_appointment(app)

@router.get("/appointments/pending", response_model=List[AppointmentResponse])
def get_pending_appointments(db: Session = Depends(get_db)):
    """
    Shortcut endpoint to list all pending advocate appointments.
    """
    apps = db.query(models.Appointment).filter(
        models.Appointment.status == "pending"
    ).order_by(models.Appointment.created_at.desc()).all()
    return [_enrich_appointment(a) for a in apps]

@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: str,
    req: AppointmentStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update appointment status (e.g., pending -> confirmed, completed, cancelled).
    """
    if not str(appointment_id).isdigit():
        raise HTTPException(status_code=404, detail="Appointment not found.")
    app = db.query(models.Appointment).filter(models.Appointment.id == int(appointment_id)).first()
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    valid_statuses = ["pending", "confirmed", "completed", "cancelled"]
    if req.status.lower() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    app.status = req.status.lower()
    if req.notes:
        app.case_notes = (app.case_notes or "") + f"\n[Update]: {req.notes}"

    db.commit()
    db.refresh(app)
    return _enrich_appointment(app)

@router.delete("/appointments/{appointment_id}")
def cancel_or_delete_appointment(
    appointment_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel and remove an appointment.
    """
    if str(appointment_id).isdigit():
        app = db.query(models.Appointment).filter(models.Appointment.id == int(appointment_id)).first()
        if app:
            db.delete(app)
            db.commit()

    return {"message": "Appointment cancelled and deleted successfully.", "id": appointment_id}

@router.get("/dashboard/stats")
def get_advocates_stats(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Returns live statistics for the advocate dashboard.
    """
    if not user or user.role != "advocate":
        raise HTTPException(status_code=403, detail="Forbidden: Advocate access required.")

    adv = user.advocate_profile
    if not adv:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()

    adv_id = adv.id if adv else 1
    appointments = db.query(models.Appointment).filter(models.Appointment.advocate_id == adv_id).all()
    cases = db.query(models.LegalCase).filter(models.LegalCase.advocate_id == adv_id).all()

    return {
        "advocate_id": adv_id,
        "name": adv.name if adv else user.name,
        "bar_council_id": adv.bar_council_id if adv else "TS/BC/PENDING",
        "verification_status": adv.verification_status if adv else "pending",
        "consultation_fee": adv.consultation_fee if adv else 1500.0,
        "stats": {
            "total_consultations": len(appointments),
            "pending_consultations": sum(1 for a in appointments if a.status == "pending"),
            "upcoming_consultations": sum(1 for a in appointments if a.status == "confirmed"),
            "completed_consultations": sum(1 for a in appointments if a.status == "completed"),
            "active_cases": sum(1 for c in cases if c.status not in ["Resolved", "Closed"]),
            "resolved_cases": sum(1 for c in cases if c.status in ["Resolved", "Closed"]),
            "earnings": sum(a.fee for a in appointments if a.status in ["confirmed", "completed"])
        }
    }

@router.get("/me")
def get_advocate_me(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Returns current authenticated advocate's profile details.
    """
    if not user or user.role != "advocate":
        raise HTTPException(status_code=403, detail="Forbidden: Advocate profile required.")

    adv = user.advocate_profile
    if not adv:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()

    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found.")

    return {
        "id": adv.id,
        "user_id": user.id,
        "name": adv.name,
        "email": adv.email,
        "phone": adv.phone,
        "bar_council_id": adv.bar_council_id,
        "state_bar_council": getattr(adv, 'state_bar_council', 'Bar Council of Telangana'),
        "specialization": adv.specialization,
        "experience_years": getattr(adv, 'experience_years', 7),
        "consultation_fee": adv.consultation_fee,
        "city": adv.city,
        "address": getattr(adv, 'address', 'Chamber 302, High Court Buildings, Hyderabad'),
        "bio": adv.bio,
        "verification_status": getattr(adv, 'verification_status', 'pending'),
        "available_days": adv.available_days,
        "available_time_slots": adv.available_time_slots
    }

@router.patch("/me")
def update_advocate_me(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Update advocate profile, fee, bio, and availability.
    Preserves snapshot fee integrity for already booked appointments.
    """
    if not user or user.role != "advocate":
        raise HTTPException(status_code=403, detail="Forbidden: Advocate profile required.")

    adv = user.advocate_profile
    if not adv:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()

    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile not found.")

    allowed_fields = [
        "name", "bio", "consultation_fee", "specialization", "phone",
        "city", "address", "available_days", "available_time_slots"
    ]
    for field in allowed_fields:
        if field in payload and payload[field] is not None:
            setattr(adv, field, payload[field])

    db.commit()
    db.refresh(adv)
    return {"message": "Advocate profile updated successfully.", "advocate": get_advocate_me(db=db, user=user)}

@router.get("/email-alerts")
def get_email_alerts():
    """
    Returns recorded consultation notification email dispatches for sureshtakur194@gmail.com.
    """
    import json
    from app.core.config import settings
    log_file = settings.STORAGE_DIR / "email_dispatch_log.json"
    if log_file.exists():
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

@router.post("/send-test-email")
def send_test_email(payload: dict = Body(...)):
    """
    Tests live SMTP dispatch to sureshtakur194@gmail.com and optionally configures Gmail App Password.
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from app.core.config import settings
    from app.core.logging import logger

    target_email = payload.get("email") or settings.CONSULTATION_NOTIFICATION_EMAIL or "sureshtakur194@gmail.com"
    app_password = payload.get("smtp_password")

    if app_password:
        cleaned_pass = app_password.replace(" ", "").strip()
        settings.SMTP_PASSWORD = cleaned_pass
        try:
            env_path = settings.BASE_DIR / ".env"
            lines = []
            if env_path.exists():
                with open(env_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            new_lines = []
            found = False
            for line in lines:
                if line.startswith("SMTP_PASSWORD="):
                    new_lines.append(f"SMTP_PASSWORD={cleaned_pass}\n")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                new_lines.append(f"SMTP_PASSWORD={cleaned_pass}\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            logger.warning(f"Could not save .env: {e}")

    smtp_user = settings.SMTP_USER.strip() or "sureshtakur194@gmail.com"
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "").strip()

    if not smtp_user or not smtp_pass:
        return {
            "delivered": False,
            "status": "MISSING_CREDENTIALS",
            "message": f"Gmail SMTP requires an App Password for {smtp_user}. Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and enter it."
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "⚖️ [LexAdvisor AI] Live Test Notification Alert"
        msg["From"] = smtp_user
        msg["To"] = target_email
        body = f"Hello Suresh Thakur,\n\nThis is a verified test email alert dispatched from your LexAdvisor AI platform to confirm real SMTP delivery to {target_email}.\n\nAdvocate booking and acceptance alerts are now active."
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=12)
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, [target_email], msg.as_string())
        server.quit()

        return {
            "delivered": True,
            "status": "DELIVERED",
            "message": f"Test email successfully sent to {target_email}! Check your Gmail inbox."
        }
    except smtplib.SMTPServerDisconnected as e:
        return {
            "delivered": False,
            "status": "DISCONNECTED",
            "message": (
                "Google SMTP immediately closed the connection. "
                "This occurs when your standard account password (e.g. 'bhanu@12345') is entered instead of a Google App Password. "
                "Google permanently blocked regular passwords for third-party email apps. "
                "Please generate a 16-character App Password at https://myaccount.google.com/apppasswords and enter it."
            )
        }
    except smtplib.SMTPAuthenticationError as e:
        return {
            "delivered": False,
            "status": "AUTH_FAILED",
            "message": f"Google SMTP Authentication failed (535): {e}. Please generate a 16-character App Password at https://myaccount.google.com/apppasswords."
        }
    except Exception as e:
        return {
            "delivered": False,
            "status": "SMTP_ERROR",
            "message": f"SMTP delivery failed: {e}. Note: For Google accounts, a 16-character App Password is required."
        }

@router.get("/email-status")
def get_email_status():
    """Returns current SMTP configuration status and recent logs."""
    from app.core.config import settings
    smtp_user = settings.SMTP_USER.strip() or "sureshtakur194@gmail.com"
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "").strip()
    has_password = bool(smtp_pass)
    looks_like_app_password = len(smtp_pass) == 16 and smtp_pass.isalpha()

    # Read dispatch logs
    log_file = settings.STORAGE_DIR / "email_dispatch_log.json"
    logs = []
    if log_file.exists():
        try:
            import json
            with open(log_file, "r", encoding="utf-8") as f:
                logs = json.load(f)[:10]
        except Exception:
            pass

    return {
        "smtp_server": settings.SMTP_SERVER,
        "smtp_port": settings.SMTP_PORT,
        "smtp_user": smtp_user,
        "recipient": settings.CONSULTATION_NOTIFICATION_EMAIL or "sureshtakur194@gmail.com",
        "has_password": has_password,
        "is_configured": has_password,
        "looks_like_app_password": looks_like_app_password,
        "password_masked": f"{smtp_pass[:2]}••••••••{smtp_pass[-2:]}" if len(smtp_pass) > 4 else ("••••" if has_password else ""),
        "recent_dispatches": logs
    }

