import pytest
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.stamp import StampFields
from app.services.stamp import stamp_rules
from app.core.scoring import compute_confidence

def test_telangana_valid_estamp():
    fields = StampFields(
        state="Telangana",
        stamp_type="e-stamp",
        serial_or_uin="IN-TS20268894103251",
        denomination=100.0,
        purchase_date="12/03/2026",
        purchased_by="Sri Rama Krishna Traders",
        vendor_name="Stock Holding Corporation of India Ltd",
        document_type="rental_agreement"
    )

    checks = stamp_rules.validate(fields)
    assert any(c.name == "Stamp Duty Adequacy" and c.status == "pass" for c in checks)
    assert any(c.name == "Serial / UIN Format" and c.status == "pass" for c in checks)

    score, level = compute_confidence(checks)
    assert score >= 75
    assert level.value == "low" # Low risk means high authenticity

def test_deficient_stamp_duty():
    fields = StampFields(
        state="Telangana",
        stamp_type="non-judicial",
        serial_or_uin="TS-2026-004128",
        denomination=20.0, # Below 100 for commercial lease
        purchase_date="12/03/2026",
        purchased_by="Tenant",
        vendor_name="Vendor",
        document_type="commercial_lease"
    )

    checks = stamp_rules.validate(fields)
    assert any(c.name == "Stamp Duty Adequacy" and c.status == "fail" for c in checks)

    recs = stamp_rules.recommend(checks, fields)
    assert any("Deficit Stamp Duty" in r for r in recs)

def test_backdated_execution_cross_check():
    fields = StampFields(
        purchase_date="20/04/2026",
        purchased_by="Sri Rama Krishna Traders"
    )
    # Agreement executed in March, but stamp bought in April
    contract_text = "Executed on 15/03/2026 between Sri Rama Krishna Traders and Landlord."
    cross_checks = stamp_rules.cross_check(fields, contract_text)
    assert any(c.name == "Execution Date Precedence" and c.status == "fail" for c in cross_checks)
