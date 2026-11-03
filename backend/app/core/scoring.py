from typing import List
from app.schemas.stamp import CheckResult, RiskLevel

WEIGHTS = {
    "fail": -25,
    "warning": -10,
    "not_verified": -5,
    "pass": 0
}

def compute_confidence(checks: List[CheckResult]):
    """
    Computes authenticity confidence score (0-100) and maps to RiskLevel.
    High confidence score (>= 75) indicates LOW risk.
    Confidence score between 45 and 74 indicates MEDIUM risk.
    Confidence score below 45 indicates HIGH risk.
    """
    penalty = sum(WEIGHTS.get(c.status, -5) for c in checks)
    score = 100 + penalty
    score = max(0, min(100, score))
    
    if score >= 75:
        level = RiskLevel.LOW
    elif score >= 45:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.HIGH
        
    return score, level


def compute_contract_risk(missing_clauses_count: int, high_risks_count: int, medium_risks_count: int, stamp_risk_level: str = "low"):
    """
    Computes overall contract risk score (0-100) and risk category.
    Higher score means higher contractual vulnerability.
    """
    base_score = (high_risks_count * 25) + (missing_clauses_count * 15) + (medium_risks_count * 8)
    if stamp_risk_level == "high":
        base_score += 25
    elif stamp_risk_level == "medium":
        base_score += 12

    risk_score = min(100, max(5, base_score))
    
    if risk_score >= 60:
        overall = "high"
    elif risk_score >= 30:
        overall = "medium"
    else:
        overall = "low"
        
    return risk_score, overall
