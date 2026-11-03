from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AgreementGenerateRequest(BaseModel):
    doc_type: str = "rental_agreement" # rental_agreement, employment_agreement, service_agreement, nda_non_disclosure
    party_one: str # e.g. "Sri Venkateswara Infotech Pvt Ltd, Hyderabad"
    party_two: str # e.g. "M/s Krishna Logistics, Vijayawada"
    details: str   # monthly consideration, security deposit, deliverables, term
    state: str = "TS" # TS or AP

class NoticeGenerateRequest(BaseModel):
    sender: str
    recipient: str
    dispute_type: str # "Breach of Tenancy Agreement", "Unpaid Invoices / Cheque Bounce", "Contract Termination"
    facts: str
    amount: Optional[str] = "Rs. 2,50,000/-"
    deadline_days: int = 15
    state: str = "TS"

class EmailGenerateRequest(BaseModel):
    recipient_name: str
    context: str
    tone: str = "firm_legal" # formal, firm_legal, settlement_friendly
    action_requested: str

class GeneratedDocResponse(BaseModel):
    id: int
    doc_type: str
    title: str
    content: str
    pdf_download_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
