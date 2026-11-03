import pytest
import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.action_engine import action_engine
from app.schemas.actions import UrgencyLevel

@pytest.mark.asyncio
async def test_action_engine_generation():
    contract_text = "Tenancy agreement default: tenant unpaid for 3 months in Hyderabad."
    plan = await action_engine.recommend(document_text=contract_text)

    assert len(plan.steps) >= 3
    assert any(s.action_type == "evidence" for s in plan.steps)
    assert any(s.action_type == "notice" for s in plan.steps)
    assert plan.sample_notice_outline is not None
    assert plan.sample_notice_outline.suggested_demand_period_days == 15
