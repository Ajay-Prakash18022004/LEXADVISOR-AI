from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ChatQueryRequest(BaseModel):
    document_id: Optional[Any] = None
    document_text: Optional[str] = None
    query: str

class ChatMessageResponse(BaseModel):
    id: Optional[int] = None
    role: str
    content: str
    created_at: Optional[datetime] = None

class ChatHistoryResponse(BaseModel):
    document_id: Optional[int] = None
    messages: List[ChatMessageResponse] = []

class ProactiveBriefResponse(BaseModel):
    document_id: Optional[int] = None
    title: str
    doc_type: str
    party_one: str
    party_two: str
    rent: str
    deposit: str
    duration: str
    notice_period: str
    state: str
    welcome_message: str
    suggested_queries: List[str] = []
    key_alerts: List[str] = []

