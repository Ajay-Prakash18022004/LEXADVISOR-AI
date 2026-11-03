from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class StampFields(BaseModel):
    state: Optional[str] = None
    stamp_type: Optional[str] = None      # e-stamp / non-judicial
    serial_or_uin: Optional[str] = None
    denomination: Optional[float] = None
    purchase_date: Optional[str] = None
    purchased_by: Optional[str] = None
    vendor_name: Optional[str] = None
    document_type: Optional[str] = None

class CheckResult(BaseModel):
    name: str
    status: str            # pass / warning / fail / not_verified
    detail: str

class StampReport(BaseModel):
    fields: StampFields
    checks: List[CheckResult]
    confidence_score: int   # 0-100 authenticity confidence
    score: Optional[int] = None # Alias for confidence_score
    risk_level: RiskLevel
    recommendations: List[str] = []
    metadata: Optional[Dict[str, Any]] = None
    deficit_cure_amount: Optional[float] = 0.0
    statutory_penalty_estimate: Optional[float] = 0.0
    minimum_duty_required: Optional[float] = 100.0
    state_duty_schedule: Optional[str] = None
    plain_english_verdict: Optional[str] = None
    what_steps_to_take: Optional[List[str]] = []
