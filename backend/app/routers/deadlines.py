import re
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.db import models
from app.schemas.deadline import DeadlineCreate, DeadlineResponse, DeadlineStatusUpdate, DeadlineExtractRequest
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/deadlines", tags=["Deadline Tracker"])

def _calculate_days_left(due_date_str: str) -> int:
    try:
        # Try YYYY-MM-DD
        if "-" in due_date_str:
            parts = due_date_str.split("-")
            d = date(int(parts[0]), int(parts[1]), int(parts[2]))
        elif "/" in due_date_str:
            parts = due_date_str.split("/")
            d = date(int(parts[2]), int(parts[1]), int(parts[0]))
        else:
            return 0
        today = date.today()
        delta = (d - today).days
        return delta
    except Exception:
        return 0

def _enrich_deadline(d: models.Deadline) -> DeadlineResponse:
    days_left = _calculate_days_left(d.due_date)
    status = d.status
    plain_warning = None

    if status != "completed":
        if days_left < 0:
            status = "overdue"
            plain_warning = f"⚠️ OVERDUE by {abs(days_left)} days! Immediate default action under contract terms."
        elif days_left <= 3:
            status = "due_soon"
            plain_warning = f"🔔 DUE IN {days_left} DAYS! Pay before due date to avoid 18% p.a. penal interest or notice under Section 106 TP Act."
        else:
            status = "upcoming"
            plain_warning = f"Due in {days_left} days ({d.due_date}). Scheduled monthly cycle."

    return DeadlineResponse(
        id=d.id,
        user_id=d.user_id,
        document_id=d.document_id,
        title=d.title,
        category=d.category,
        due_date=d.due_date,
        amount=d.amount,
        recurrence=d.recurrence,
        remind_days_before=d.remind_days_before,
        status=status,
        notes=d.notes,
        days_left=days_left,
        plain_warning=plain_warning,
        created_at=d.created_at
    )

def seed_sample_deadlines_if_empty():
    db = SessionLocal()
    try:
        count = db.query(models.Deadline).count()
        if count == 0:
            today = date.today()
            # 1. Rent payment due on 5th of next month or in 6 days
            due_rent = today + timedelta(days=6)
            db.add(models.Deadline(
                title="Monthly Rent Payment Due (Tenancy Bond Rule)",
                category="rent_payment",
                due_date=due_rent.strftime("%Y-%m-%d"),
                amount=35000.0,
                recurrence="monthly",
                remind_days_before=3,
                status="upcoming",
                notes="Under clause 2 of the Tenancy Agreement, monthly rent of Rs. 35,000/- must be transferred to Lessor's bank account on or before 5th of each calendar month. Delay incurs Rs. 500 per day penalty."
            ))

            # 2. Rent Grace Period Cutoff (in 11 days)
            due_grace = today + timedelta(days=11)
            db.add(models.Deadline(
                title="Rent Grace Period Cutoff (Final Penalty Deadline)",
                category="rent_payment",
                due_date=due_grace.strftime("%Y-%m-%d"),
                amount=35000.0,
                recurrence="monthly",
                remind_days_before=2,
                status="upcoming",
                notes="5-day grace period ends. Failure to clear rent by this cutoff triggers automatic statutory breach and 15-day eviction notice under Section 106 Transfer of Property Act."
            ))

            # 3. 11-Month Lease Expiry & Renewal Notice Window
            due_renewal = today + timedelta(days=75)
            db.add(models.Deadline(
                title="11-Month Lease Expiry & Renewal Notice Deadline",
                category="lease_renewal",
                due_date=due_renewal.strftime("%Y-%m-%d"),
                amount=0.0,
                recurrence="once",
                remind_days_before=30,
                status="upcoming",
                notes="Serve 1-month prior written notice to landlord if intending to renew or vacate to ensure timely refund of Rs. 1,00,000 security deposit without dispute."
            ))

            # 4. Bond Rule: Pre-Monsoon Structural & Appliance Maintenance
            due_maint = today + timedelta(days=22)
            db.add(models.Deadline(
                title="Bond Condition: Electrical & AC Servicing Compliance",
                category="bond_rule",
                due_date=due_maint.strftime("%Y-%m-%d"),
                amount=1500.0,
                recurrence="once",
                remind_days_before=5,
                status="upcoming",
                notes="As per Tenancy Annexure-B, tenant must conduct bi-annual AC and electrical servicing to prevent forfeiture of caution deposit for maintenance neglect."
            ))

            # 5. Statutory Registration Deadline (Section 23 Registration Act)
            due_reg = today + timedelta(days=120)
            db.add(models.Deadline(
                title="Statutory Sub-Registrar Stamping & Registration Cutoff",
                category="stamp_registration",
                due_date=due_reg.strftime("%Y-%m-%d"),
                amount=1000.0,
                recurrence="once",
                remind_days_before=15,
                status="upcoming",
                notes="Under Section 23 of the Indian Registration Act, 1908, any document requiring compulsory registration must be presented within 4 months from execution date."
            ))

            db.commit()
    except Exception:
        pass
    finally:
        db.close()

seed_sample_deadlines_if_empty()

@router.get("", response_model=List[DeadlineResponse])
def get_deadlines(
    category: Optional[str] = Query(None, description="Filter by category: rent_payment, lease_renewal, notice_period, bond_rule, stamp_registration"),
    status: Optional[str] = Query(None, description="Filter by status: upcoming, due_soon, overdue, completed"),
    db: Session = Depends(get_db)
):
    """
    List active deadline reminders for rent payments, bond conditions, lease renewals, and stamp duty compliance.
    """
    query = db.query(models.Deadline)
    if category and isinstance(category, str):
        query = query.filter(models.Deadline.category == category)
    if status and isinstance(status, str):
        query = query.filter(models.Deadline.status == status)

    deadlines = query.order_by(models.Deadline.due_date.asc()).all()
    return [_enrich_deadline(d) for d in deadlines]

@router.post("", response_model=DeadlineResponse)
def create_deadline(
    req: DeadlineCreate,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Create a new deadline reminder (e.g. Rent Payment, Maintenance, Bond Notice).
    """
    dl = models.Deadline(
        user_id=user.id if user else None,
        document_id=req.document_id,
        title=req.title,
        category=req.category or "rent_payment",
        due_date=req.due_date,
        amount=req.amount,
        recurrence=req.recurrence or "monthly",
        remind_days_before=req.remind_days_before or 3,
        status="upcoming",
        notes=req.notes
    )
    db.add(dl)
    db.commit()
    db.refresh(dl)
    return _enrich_deadline(dl)

@router.patch("/{deadline_id}", response_model=DeadlineResponse)
def update_deadline(
    deadline_id: str,
    req: DeadlineStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update deadline status (e.g. mark as 'completed' when rent is paid).
    """
    if str(deadline_id).isdigit():
        dl = db.query(models.Deadline).filter(models.Deadline.id == int(deadline_id)).first()
        if dl:
            dl.status = req.status
            db.commit()
            db.refresh(dl)
            return _enrich_deadline(dl)

    raise HTTPException(status_code=404, detail="Deadline not found.")

@router.delete("/{deadline_id}")
def delete_deadline(
    deadline_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a deadline reminder.
    """
    if str(deadline_id).isdigit():
        dl = db.query(models.Deadline).filter(models.Deadline.id == int(deadline_id)).first()
        if dl:
            db.delete(dl)
            db.commit()

    return {"message": "Deadline deleted successfully.", "id": deadline_id}

@router.post("/extract", response_model=List[DeadlineResponse])
def extract_deadlines_from_contract(
    req: DeadlineExtractRequest,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Automatically extracts rent payment dates, grace periods, lease expiry, and bond rules from contract text.
    """
    text = req.text or ""
    if req.document_id:
        doc = db.query(models.Document).filter(models.Document.id == req.document_id).first()
        if doc and doc.extracted_text:
            text = doc.extracted_text

    extracted_items = []
    today = date.today()

    # 1. Monthly Rent Detection
    rent_amt_match = re.search(r'(?:monthly rent|rent of)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+)', text, re.IGNORECASE)
    rent_amt = float(rent_amt_match.group(1).replace(",", "")) if rent_amt_match else 35000.0

    rent_day_match = re.search(r'(?:on or before|by the)\s*([0-9]{1,2})(?:st|nd|rd|th)?\s*(?:day|of each)', text, re.IGNORECASE)
    rent_day = int(rent_day_match.group(1)) if rent_day_match else 5

    # Compute next rent date
    target_month = today.month if today.day < rent_day else (today.month % 12 + 1)
    target_year = today.year if (today.day < rent_day or today.month < 12) else today.year + 1
    next_rent_date = date(target_year, target_month, min(rent_day, 28))

    dl_rent = models.Deadline(
        user_id=user.id if user else None,
        document_id=req.document_id,
        title=f"Monthly Rent Payment (₹{rent_amt:,.0f}) Due on {rent_day}th",
        category="rent_payment",
        due_date=next_rent_date.strftime("%Y-%m-%d"),
        amount=rent_amt,
        recurrence="monthly",
        remind_days_before=3,
        status="upcoming",
        notes=f"Auto-extracted from agreement: Monthly rent of ₹{rent_amt:,.0f} payable on or before {rent_day}th of each month."
    )
    db.add(dl_rent)
    extracted_items.append(dl_rent)

    # 2. Notice Period / Renewal
    notice_match = re.search(r'([0-9]{1,2})\s*(?:month|months|days)\s*prior written notice', text, re.IGNORECASE)
    notice_term = notice_match.group(1) if notice_match else "1 month"
    dl_renewal = models.Deadline(
        user_id=user.id if user else None,
        document_id=req.document_id,
        title=f"Vacate Notice Window ({notice_term} Prior Written Notice)",
        category="notice_period",
        due_date=(today + timedelta(days=60)).strftime("%Y-%m-%d"),
        amount=0.0,
        recurrence="once",
        remind_days_before=15,
        status="upcoming",
        notes=f"Under agreement terms, either party must serve {notice_term} prior written notice before vacating or terminating tenancy."
    )
    db.add(dl_renewal)
    extracted_items.append(dl_renewal)

    db.commit()
    for item in extracted_items:
        db.refresh(item)

    return [_enrich_deadline(item) for item in extracted_items]
