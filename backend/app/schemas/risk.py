from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class MissingClauseItem(BaseModel):
    clause_name: str
    criticality: SeverityLevel = SeverityLevel.MEDIUM
    impact: str
    why_needed_in_plain_words: Optional[str] = None

class IdentifiedRiskItem(BaseModel):
    category: str
    severity: SeverityLevel
    title: str
    clause_name: Optional[str] = None          # Backwards compat alias
    clause_excerpt: Optional[str] = "N/A"
    explanation: str
    remedy: str
    statutory_reference: Optional[str] = None # Statutory provision e.g. Section 74 ICA
    suggested_revision: Optional[str] = None  # Safe replacement clause text
    plain_english_danger: Optional[str] = None # Everyday wording of why this hurts common people

class RiskReport(BaseModel):
    document_id: Optional[int] = None
    overall_risk: SeverityLevel
    overall_risk_level: Optional[str] = None # e.g. "HIGH", "MEDIUM", "LOW"
    risk_score: int # 0 to 100
    summary: str
    plain_english_summary: Optional[str] = None
    critical_clauses_missing_count: Optional[int] = 0
    high_risks_count: Optional[int] = 0
    medium_risks_count: Optional[int] = 0
    missing_clauses: List[MissingClauseItem] = []
    identified_risks: List[IdentifiedRiskItem] = []
    recommendations: List[str] = []
    what_steps_to_take: Optional[List[str]] = []
