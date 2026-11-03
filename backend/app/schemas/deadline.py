from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DeadlineCreate(BaseModel):
    title: str
    category: str = "rent_payment" # "rent_payment", "notice_period", "lease_renewal", "stamp_registration", "bond_rule", "custom"
    due_date: str # YYYY-MM-DD
    amount: Optional[float] = None
    recurrence: str = "monthly" # "monthly", "once", "yearly"
    remind_days_before: int = 3
    notes: Optional[str] = None
    document_id: Optional[int] = None

class DeadlineStatusUpdate(BaseModel):
    status: str # "upcoming", "due_soon", "completed", "overdue"

class DeadlineResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    document_id: Optional[int] = None
    title: str
    category: str
    due_date: str
    amount: Optional[float] = None
    recurrence: str
    remind_days_before: int
    status: str
    notes: Optional[str] = None
    days_left: Optional[int] = None
    plain_warning: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DeadlineExtractRequest(BaseModel):
    text: Optional[str] = None
    document_id: Optional[int] = None
