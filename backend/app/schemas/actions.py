from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class UrgencyLevel(str, Enum):
    IMMEDIATE = "immediate"
    MODERATE = "moderate"
    ROUTINE = "routine"

class ActionPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ActionStep(BaseModel):
    step_number: int
    title: str
    action_type: str # evidence / notice / negotiation / advocate / compliance / litigation
    priority: ActionPriority
    timeframe: str
    description: str
    legal_basis: str
    deliverable: str

class NoticeOutline(BaseModel):
    recommended: bool = True
    subject: str
    key_points: List[str] = []
    suggested_demand_period_days: int = 15

class ActionPlanReport(BaseModel):
    document_id: Optional[int] = None
    action_urgency: UrgencyLevel
    summary: str
    steps: List[ActionStep]
    sample_notice_outline: Optional[NoticeOutline] = None
    advocate_consultation_brief: Optional[str] = None
