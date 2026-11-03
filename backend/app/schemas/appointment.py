from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.advocate import AdvocateResponse

class AppointmentCreate(BaseModel):
    advocate_id: int
    client_name: str
    client_phone: str
    client_email: str
    appointment_date: str # e.g. "2026-11-05"
    time_slot: str        # e.g. "10:30 AM"
    consultation_type: str = "In-Chamber"
    case_subject: str
    case_notes: Optional[str] = None
    document_id: Optional[int] = None
    fee: Optional[float] = 1500.0

class AppointmentStatusUpdate(BaseModel):
    status: str # "pending", "confirmed", "completed", "cancelled"
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    advocate_id: int
    advocate_name: Optional[str] = None
    advocate_specialization: Optional[str] = None
    advocate_city: Optional[str] = None
    advocate_phone: Optional[str] = None
    client_name: str
    client_phone: str
    client_email: str
    appointment_date: str
    time_slot: str
    consultation_type: str
    case_subject: str
    case_notes: Optional[str] = None
    document_id: Optional[int] = None
    fee: float
    status: str
    notification_sent: Optional[bool] = False
    notification_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
