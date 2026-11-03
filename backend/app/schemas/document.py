from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    doc_type: str
    state: str
    uploaded_at: datetime
    extracted_text: Optional[str] = None
    simplified_chunks: Optional[List[Dict[str, Any]]] = None
    has_stamp_report: bool = False
    has_risk_report: bool = False
    has_action_plan: bool = False

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    pass
