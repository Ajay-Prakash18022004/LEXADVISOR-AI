from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.database import get_db
from app.db import models
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/cases", tags=["Case Management"])

class CaseCreatePayload(BaseModel):
    title: str
    category: Optional[str] = "Civil / Property"
    description: Optional[str] = None
    advocate_id: Optional[int] = None
    appointment_id: Optional[int] = None
    next_hearing_date: Optional[str] = None
    court_name: Optional[str] = None

class StatusUpdatePayload(BaseModel):
    status: str
    resolution_summary: Optional[str] = None

class NotePayload(BaseModel):
    message: str
    is_private_to_advocate: Optional[bool] = False
    activity_type: Optional[str] = "note"

class HearingPayload(BaseModel):
    next_hearing_date: str
    court_name: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
def list_cases(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns cases relevant to the current user:
    - If advocate: all cases assigned to this advocate.
    - If client: all cases belonging to this client.
    """
    if user.role == "advocate":
        adv = user.advocate_profile
        if not adv:
            adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        adv_id = adv.id if adv else 1
        cases = db.query(models.LegalCase).filter(models.LegalCase.advocate_id == adv_id).order_by(models.LegalCase.updated_at.desc()).all()
    else:
        cases = db.query(models.LegalCase).filter(models.LegalCase.client_id == user.id).order_by(models.LegalCase.updated_at.desc()).all()

    result = []
    for c in cases:
        adv = db.query(models.Advocate).filter(models.Advocate.id == c.advocate_id).first()
        client = db.query(models.User).filter(models.User.id == c.client_id).first()

        # Prioritize appointment client details if available
        client_name = None
        client_email = None
        client_phone = None
        if c.appointment_id:
            appt = db.query(models.Appointment).filter(models.Appointment.id == c.appointment_id).first()
            if appt and appt.client_name:
                client_name = appt.client_name
                client_email = appt.client_email
                client_phone = appt.client_phone

        adv_name = adv.name if adv else "Advocate"
        if not client_name or client_name == adv_name or (client and client.name == adv_name):
            if client and client.role == "client" and client.name != adv_name:
                client_name = client.name
                client_email = client.email or client_email
                client_phone = client.phone or client_phone
            else:
                c_user = db.query(models.User).filter(models.User.role == "client").first()
                client_name = c_user.name if c_user else "Sri Suresh Thakur"
                client_email = c_user.email if c_user else "sureshtakur194@gmail.com"
                client_phone = c_user.phone if c_user else "+91 98490 11223"

        result.append({
            "id": c.id,
            "case_number": c.case_number,
            "appointment_id": c.appointment_id,
            "title": c.title,
            "category": c.category,
            "status": c.status,
            "description": c.description,
            "next_hearing_date": c.next_hearing_date,
            "court_name": c.court_name,
            "resolution_date": c.resolution_date,
            "resolution_summary": c.resolution_summary,
            "created_at": c.created_at.strftime("%Y-%m-%d") if c.created_at else None,
            "updated_at": c.updated_at.strftime("%Y-%m-%d") if c.updated_at else None,
            "client_name": client_name,
            "client_email": client_email or (client.email if client else ""),
            "client_phone": client_phone or (client.phone if client else ""),
            "advocate_name": adv_name,
            "advocate_specialization": adv.specialization if adv else ""
        })
    return result

@router.get("/resolved")
def list_resolved_cases(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns resolved or closed cases for the user.
    """
    if user.role == "advocate":
        adv = user.advocate_profile
        if not adv:
            adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        adv_id = adv.id if adv else 1
        cases = db.query(models.LegalCase).filter(
            models.LegalCase.advocate_id == adv_id,
            models.LegalCase.status.in_(["Resolved", "Closed"])
        ).order_by(models.LegalCase.updated_at.desc()).all()
    else:
        cases = db.query(models.LegalCase).filter(
            models.LegalCase.client_id == user.id,
            models.LegalCase.status.in_(["Resolved", "Closed"])
        ).order_by(models.LegalCase.updated_at.desc()).all()

    result = []
    for c in cases:
        adv = db.query(models.Advocate).filter(models.Advocate.id == c.advocate_id).first()
        client = db.query(models.User).filter(models.User.id == c.client_id).first()

        client_name = None
        if c.appointment_id:
            appt = db.query(models.Appointment).filter(models.Appointment.id == c.appointment_id).first()
            if appt and appt.client_name:
                client_name = appt.client_name

        adv_name = adv.name if adv else "Advocate"
        if not client_name or client_name == adv_name or (client and client.name == adv_name):
            if client and client.role == "client" and client.name != adv_name:
                client_name = client.name
            else:
                c_user = db.query(models.User).filter(models.User.role == "client").first()
                client_name = c_user.name if c_user else "Sri Suresh Thakur"

        result.append({
            "id": c.id,
            "case_number": c.case_number,
            "appointment_id": c.appointment_id,
            "title": c.title,
            "category": c.category,
            "status": c.status,
            "resolution_date": c.resolution_date or (c.updated_at.strftime("%Y-%m-%d") if c.updated_at else None),
            "resolution_summary": c.resolution_summary or "Successfully resolved under advocate representation.",
            "client_name": client_name,
            "advocate_name": adv_name
        })
    return result

@router.get("/{id}")
def get_case_detail(
    id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full case timeline and documents.
    IMPORTANT: If caller is a client, filters out all advocate internal private notes!
    """
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Case record not found.")

    case = db.query(models.LegalCase).filter(models.LegalCase.id == int(id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case record not found.")

    # Authorization verification
    is_advocate = (user.role == "advocate")
    if is_advocate:
        adv = user.advocate_profile
        if not adv:
            adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        adv_id = adv.id if adv else 1
        if case.advocate_id != adv_id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this case.")
    else:
        if case.client_id != user.id:
            raise HTTPException(status_code=403, detail="You do not have permission to access this case.")

    # Filter activities based on role
    activities = []
    for act in case.activities:
        # STRICT PRIVACY RULE: Never show private advocate notes to client!
        if not is_advocate and act.is_private_to_advocate:
            continue
        activities.append({
            "id": act.id,
            "author_id": act.author_id,
            "author_name": act.author_name,
            "author_role": act.author_role,
            "activity_type": act.activity_type,
            "message": act.message,
            "is_private_to_advocate": act.is_private_to_advocate,
            "created_at": act.created_at.strftime("%Y-%m-%d %H:%M") if act.created_at else None
        })

    # Documents
    documents = [
        {
            "id": d.id,
            "filename": d.filename,
            "file_path": d.file_path,
            "file_type": d.file_type,
            "uploaded_by_role": d.uploaded_by_role,
            "uploaded_at": d.uploaded_at.strftime("%Y-%m-%d %H:%M") if d.uploaded_at else None
        } for d in case.documents
    ]

    client = db.query(models.User).filter(models.User.id == case.client_id).first()
    adv = db.query(models.Advocate).filter(models.Advocate.id == case.advocate_id).first()

    return {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "category": case.category,
        "status": case.status,
        "description": case.description,
        "next_hearing_date": case.next_hearing_date,
        "court_name": case.court_name,
        "resolution_date": case.resolution_date,
        "resolution_summary": case.resolution_summary,
        "created_at": case.created_at.strftime("%Y-%m-%d %H:%M") if case.created_at else None,
        "updated_at": case.updated_at.strftime("%Y-%m-%d %H:%M") if case.updated_at else None,
        "client": {
            "id": client.id if client else None,
            "name": client.name if client else "Client",
            "email": client.email if client else "",
            "phone": client.phone if client else "",
            "city": client.city if client else ""
        },
        "advocate": {
            "id": adv.id if adv else None,
            "name": adv.name if adv else "Advocate",
            "specialization": adv.specialization if adv else "",
            "bar_council_id": adv.bar_council_id if adv else ""
        },
        "activities": activities,
        "documents": documents
    }

@router.post("")
def create_case(
    payload: CaseCreatePayload,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case_count = db.query(models.LegalCase).count()
    case_number = f"LEX-CASE-2026-{1001 + case_count}"

    if user.role == "advocate":
        adv = user.advocate_profile
        if not adv:
            adv = db.query(models.Advocate).filter(
                (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
            ).first()
        adv_id = adv.id if adv else 1
        client_id = user.id # default or linked
    else:
        client_id = user.id
        adv_id = payload.advocate_id or 1

    new_case = models.LegalCase(
        case_number=case_number,
        client_id=client_id,
        advocate_id=adv_id,
        appointment_id=payload.appointment_id,
        title=payload.title,
        category=payload.category or "Civil / Property",
        status="New",
        description=payload.description or "New case initiated on LexAdvisor AI.",
        next_hearing_date=payload.next_hearing_date,
        court_name=payload.court_name
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Initial log
    activity = models.CaseActivity(
        case_id=new_case.id,
        author_id=user.id,
        author_name=user.name,
        author_role=user.role,
        activity_type="status_change",
        message=f"Case {case_number} registered in the system with status 'New'.",
        is_private_to_advocate=False
    )
    db.add(activity)
    db.commit()

    return {
        "status": "success",
        "case_id": new_case.id,
        "case_number": new_case.case_number,
        "message": f"Case {new_case.case_number} created successfully."
    }

@router.patch("/{id}/status")
def update_case_status(
    id: str,
    payload: StatusUpdatePayload,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Case not found.")
    case = db.query(models.LegalCase).filter(models.LegalCase.id == int(id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    valid_statuses = [
        "New", "Under Review", "In Progress",
        "Awaiting Client Information", "Awaiting Hearing",
        "Resolved", "Closed"
    ]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    old_status = case.status
    case.status = payload.status
    case.updated_at = datetime.utcnow()

    if payload.status in ["Resolved", "Closed"]:
        case.resolution_date = datetime.utcnow().strftime("%Y-%m-%d")
        if payload.resolution_summary:
            case.resolution_summary = payload.resolution_summary

    # Log status change activity
    activity = models.CaseActivity(
        case_id=case.id,
        author_id=user.id,
        author_name=user.name,
        author_role=user.role,
        activity_type="status_change",
        message=f"Status changed from '{old_status}' to '{payload.status}'." + (f" Note: {payload.resolution_summary}" if payload.resolution_summary else ""),
        is_private_to_advocate=False
    )
    db.add(activity)
    db.commit()
    db.refresh(case)

    return {
        "status": "success",
        "case_id": case.id,
        "new_status": case.status,
        "message": f"Status updated to {case.status}."
    }

@router.post("/{id}/notes")
def add_case_note(
    id: str,
    payload: NotePayload,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Case not found.")
    case = db.query(models.LegalCase).filter(models.LegalCase.id == int(id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    # Clients cannot create private notes to advocate
    is_private = payload.is_private_to_advocate if user.role == "advocate" else False

    activity = models.CaseActivity(
        case_id=case.id,
        author_id=user.id,
        author_name=user.name,
        author_role=user.role,
        activity_type=payload.activity_type or "note",
        message=payload.message.strip(),
        is_private_to_advocate=is_private
    )
    db.add(activity)
    case.updated_at = datetime.utcnow()
    db.commit()

    return {
        "status": "success",
        "activity_id": activity.id,
        "is_private_to_advocate": activity.is_private_to_advocate,
        "message": "Note recorded successfully."
    }

@router.post("/{id}/hearing")
def schedule_case_hearing(
    id: str,
    payload: HearingPayload,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not str(id).isdigit():
        raise HTTPException(status_code=404, detail="Case not found.")
    case = db.query(models.LegalCase).filter(models.LegalCase.id == int(id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    case.next_hearing_date = payload.next_hearing_date
    if payload.court_name:
        case.court_name = payload.court_name
    case.status = "Awaiting Hearing"
    case.updated_at = datetime.utcnow()

    msg = f"Hearing scheduled for {payload.next_hearing_date}"
    if payload.court_name:
        msg += f" at {payload.court_name}"
    if payload.notes:
        msg += f". Notice: {payload.notes}"

    activity = models.CaseActivity(
        case_id=case.id,
        author_id=user.id,
        author_name=user.name,
        author_role=user.role,
        activity_type="hearing",
        message=msg,
        is_private_to_advocate=False
    )
    db.add(activity)
    db.commit()

    return {
        "status": "success",
        "case_id": case.id,
        "next_hearing_date": case.next_hearing_date,
        "court_name": case.court_name
    }

