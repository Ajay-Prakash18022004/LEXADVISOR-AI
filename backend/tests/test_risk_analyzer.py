import pytest
import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.risk_analyzer import risk_analyzer
from app.schemas.risk import SeverityLevel

@pytest.mark.asyncio
async def test_risk_analyzer_unilateral_clause():
    text = """
    COMMERCIAL LEASE
    Tenant shall indemnify and hold harmless Landlord without any limitation.
    Landlord may terminate immediately without notice.
    Exclusive jurisdiction of courts at New Delhi.
    """

    report = await risk_analyzer.analyze(document_text=text, doc_type="rental_agreement")

    assert report.risk_score > 30
    assert any("Indemnity" in r.title for r in report.identified_risks)
    assert any("Termination" in r.title for r in report.identified_risks)
    assert len(report.missing_clauses) > 0
