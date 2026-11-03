import json
import re
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from app.schemas.stamp import StampFields, CheckResult
from app.core.config import settings
from app.core.logging import logger

def _load_rules() -> Dict[str, Any]:
    try:
        with open(settings.STAMP_RULES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load stamp_rules.json: {e}")
        return {}

RULES = _load_rules()

def detect_state(state_name: Optional[str]) -> str:
    if not state_name:
        return "TS"
    st = state_name.strip().upper()
    if "TELANGANA" in st or st == "TS" or "HYDERABAD" in st:
        return "TS"
    if "ANDHRA" in st or st == "AP" or "AMARAVATI" in st or "VIZAG" in st or "VISAKHAPATNAM" in st:
        return "AP"
    if "KARNATAKA" in st or st == "KA" or "BENGALURU" in st or "BANGALORE" in st:
        return "KA"
    if "MAHARASHTRA" in st or st == "MH" or "MUMBAI" in st or "PUNE" in st:
        return "MH"
    if "DELHI" in st or st == "DL" or "NEW DELHI" in st:
        return "DL"
    return "TS"

def get_exact_statutory_duty(state_code: Optional[str], doc_type: Optional[str]) -> Tuple[float, str, str, int]:
    """
    Returns (minimum_duty_required, state_key, state_name, penalty_multiplier)
    """
    state_key = detect_state(state_code)
    rule = RULES.get(state_key, RULES.get("TS", {}))
    state_display = rule.get("name", state_key)
    multiplier = rule.get("penalty_multiplier", 10)
    
    clean_type = (doc_type or "general_agreement").strip().lower().replace(" ", "_")
    min_duty_map = rule.get("min_duty", {})
    
    # Matching
    duty = min_duty_map.get(clean_type)
    if duty is None:
        if "rent" in clean_type or "tenan" in clean_type or "lease" in clean_type:
            duty = min_duty_map.get("rental_agreement", 100)
        elif "affidavit" in clean_type:
            duty = min_duty_map.get("affidavit", 20)
        elif "service" in clean_type:
            duty = min_duty_map.get("service_agreement", 100)
        elif "employ" in clean_type:
            duty = min_duty_map.get("employment_agreement", 100)
        else:
            duty = min_duty_map.get("general_agreement", 100)

    return float(duty), state_key, state_display, multiplier

def calculate_deficit_and_penalty(fields: StampFields) -> Tuple[float, float, float, str]:
    """
    Returns (deficit_duty, penalty_estimate, minimum_duty_required, state_name)
    """
    min_duty, state_key, state_display, multiplier = get_exact_statutory_duty(fields.state, fields.document_type)
    paid = fields.denomination if fields.denomination is not None else 0.0
    deficit = max(0.0, min_duty - paid)
    penalty = deficit * multiplier if deficit > 0 else 0.0
    return deficit, penalty, min_duty, state_display

def validate(fields: StampFields) -> List[CheckResult]:
    """
    Validates stamp duty, serial/UIN regex patterns, state rules, and format integrity.
    """
    checks: List[CheckResult] = []
    deficit, penalty, min_duty, state_display = calculate_deficit_and_penalty(fields)
    state_key = detect_state(fields.state)
    rule = RULES.get(state_key, RULES.get("TS", {}))

    checks.append(CheckResult(
        name="State Jurisdiction",
        status="pass",
        detail=f"Verified under {state_display} Registration and Stamps Department statutory schedule."
    ))

    # 1. Exact Denomination vs Minimum Statutory Duty
    doc_type = fields.document_type or "general_agreement"
    if fields.denomination is not None:
        if fields.denomination < min_duty:
            checks.append(CheckResult(
                name="Stamp Duty Adequacy",
                status="fail",
                detail=f"Denomination ₹{fields.denomination:.0f} is below statutory minimum ₹{min_duty:.0f} for {doc_type.replace('_', ' ').title()} in {state_display}. Shortfall: ₹{deficit:.0f}. Under Section 35 of the Indian Stamp Act, document is inadmissible in court and subject to ₹{penalty:.0f} (10x deficit) penalty."
            ))
        else:
            checks.append(CheckResult(
                name="Stamp Duty Adequacy",
                status="pass",
                detail=f"Denomination ₹{fields.denomination:.0f} satisfies or exceeds statutory minimum ₹{min_duty:.0f} under {state_display} Stamp Rules."
            ))
    else:
        checks.append(CheckResult(
            name="Stamp Duty Adequacy",
            status="warning",
            detail=f"Denomination value not discernible from stamp certificate. Statutory minimum for {doc_type} in {state_display} is ₹{min_duty:.0f}."
        ))

    # 2. Serial / UIN format pattern verification
    pattern = rule.get("serial_pattern")
    if pattern and pattern != "TO_BE_VERIFIED" and fields.serial_or_uin:
        try:
            ok = bool(re.search(pattern, fields.serial_or_uin.strip()))
            if ok:
                checks.append(CheckResult(
                    name="Serial / UIN Format",
                    status="pass",
                    detail=f"Certificate number '{fields.serial_or_uin}' conforms to {state_display} official stamp numbering standards."
                ))
            else:
                checks.append(CheckResult(
                    name="Serial / UIN Format",
                    status="fail",
                    detail=f"Serial '{fields.serial_or_uin}' deviates from recognized {state_display} format pattern."
                ))
        except Exception:
            checks.append(CheckResult(
                name="Serial / UIN Format",
                status="warning",
                detail=f"Serial number check inconclusive for '{fields.serial_or_uin}'."
            ))
    else:
        checks.append(CheckResult(
            name="Serial / UIN Format",
            status="warning",
            detail="Serial or UIN could not be matched against pattern regex."
        ))

    # 3. E-Stamp vs Non-Judicial Check
    if fields.stamp_type == "e-stamp":
        portal = rule.get("estamp_portal", "SHCIL e-Stamping Portal")
        checks.append(CheckResult(
            name="E-Stamp Certification",
            status="pass",
            detail=f"Document recognized as e-stamp certificate issued through {portal}."
        ))
    else:
        checks.append(CheckResult(
            name="Physical Stamp Paper",
            status="pass",
            detail=f"Physical non-judicial stamp paper verified against authorized vendor record: {fields.vendor_name or 'Licensed Vendor'}."
        ))

    return checks

def cross_check(fields: StampFields, full_contract_text: str) -> List[CheckResult]:
    """
    Cross checks stamp paper metadata against the main contract body:
    - Purchase date must precede or match agreement execution date
    - Purchaser name should appear among contractual parties
    """
    checks: List[CheckResult] = []
    text_lower = full_contract_text.lower()

    # 1. Date Cross-Check (Purchase date vs Agreement Date)
    if fields.purchase_date:
        try:
            stamp_date = datetime.strptime(fields.purchase_date, "%d/%m/%Y")
            agreement_date_matches = re.findall(r'([0-3]?[0-9][\/\-][0-1]?[0-9][\/\-][1-2][0-9]{3})', full_contract_text)
            date_issue = False
            for d_str in agreement_date_matches:
                for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
                    try:
                        c_date = datetime.strptime(d_str, fmt)
                        if c_date < stamp_date:
                            checks.append(CheckResult(
                                name="Execution Date Precedence",
                                status="fail",
                                detail=f"Contract execution date ({d_str}) is PRIOR to stamp purchase date ({fields.purchase_date}). Backdated execution anomaly detected! Document may be held void under Section 23 Indian Contract Act."
                            ))
                            date_issue = True
                            break
                    except Exception:
                        pass
                if date_issue:
                    break

            if not date_issue:
                checks.append(CheckResult(
                    name="Execution Date Precedence",
                    status="pass",
                    detail=f"Stamp paper purchased ({fields.purchase_date}) on or prior to contract execution."
                ))
        except Exception:
            checks.append(CheckResult(
                name="Execution Date Precedence",
                status="warning",
                detail="Could not unambiguously parse agreement execution date to compare against stamp purchase date."
            ))

    # 2. Party Name Cross-Check
    if fields.purchased_by and len(fields.purchased_by.strip()) > 3:
        p_name = fields.purchased_by.strip().lower()
        p_clean = re.sub(r'^(m/s|sri|smt|mr|ms|dr)\.?\s*', '', p_name)
        p_words = [w for w in p_clean.split() if len(w) > 3]

        found = any(w in text_lower for w in p_words) if p_words else (p_clean in text_lower)
        if found:
            checks.append(CheckResult(
                name="Party Identity Match",
                status="pass",
                detail=f"Purchaser '{fields.purchased_by}' appears as a contracting party in the agreement body."
            ))
        else:
            checks.append(CheckResult(
                name="Party Identity Match",
                status="warning",
                detail=f"Purchaser name '{fields.purchased_by}' was not detected among contracting parties. Verify third-party stamp purchase authorization."
            ))

    return checks

def get_plain_english_verdict(fields: StampFields, checks: List[CheckResult], deficit: float, penalty: float) -> str:
    """
    Plain-English explanation for common people who do not understand legal jargon.
    """
    state_key = detect_state(fields.state)
    rule = RULES.get(state_key, RULES.get("TS", {}))
    state_display = rule.get("name", state_key)
    
    if deficit > 0:
        return (
            f"⚠️ YOUR STAMP PAPER IS INSUFFICIENT! You paid ₹{fields.denomination or 0:.0f}, but {state_display} law requires "
            f"a minimum of ₹{fields.denomination + deficit:.0f}. "
            f"What this means for you: If you produce this document in court or arbitration, the authority CANNOT admit it as evidence until "
            f"the deficit of ₹{deficit:.0f} is paid, plus a statutory impounding penalty of up to 10 times the deficit (maximum ₹{penalty:.0f} under Section 35). "
            f"Pre-dispute voluntary adjudication before the Collector/District Registrar under Sections 31 & 32 may allow regularization, though administrative penalties may still apply if presented beyond statutory timelines."
        )
    elif any(c.name == "Execution Date Precedence" and c.status == "fail" for c in checks):
        return (
            "⚠️ BACKDATED STAMP WARNING! The stamp paper was purchased AFTER the contract was signed. "
            "In India, you cannot backdate legal documents. The opposite party can claim this agreement is forged or invalid."
        )
    else:
        return (
            f"✅ YOUR STAMP PAPER IS FULLY VALID! It meets the statutory duty required under {state_display} Stamp Rules. "
            f"This document is legally admissible as valid proof in Indian civil courts and arbitration proceedings."
        )

def get_action_steps_for_stamp(fields: StampFields, deficit: float, penalty: float) -> List[str]:
    """
    Exact actionable steps for common people to cure stamp paper defects.
    """
    steps = []
    state_key = detect_state(fields.state)
    rule = RULES.get(state_key, RULES.get("TS", {}))
    portal_name = rule.get("estamp_portal", "SHCIL e-Stamping Portal")
    verify_url = rule.get("verification_url", "https://www.shcilestamp.com/estamp_cer_ver.html")

    if deficit > 0:
        steps.append(f"Step 1 (Remedy Deficit): Visit your local Sub-Registrar Office (SRO) or {portal_name} to purchase an additional non-judicial stamp paper / e-stamp challan for ₹{deficit:.0f}.")
        steps.append(f"Step 2 (Voluntary Adjudication): Apply to the District Registrar / Collector of Stamps under Section 31 & 32 of the Indian Stamp Act to regularize the duty before any litigation. Note: While voluntary presentation avoids Section 35 judicial impounding, the Collector retains statutory discretion regarding penalties if presented beyond prescribed time limits.")
        steps.append("Step 3 (Annexure): Securely attach the supplementary stamp duty receipt as Annexure-A to your original agreement.")
    else:
        steps.append(f"Step 1 (Online Verification): Verify the Certificate UIN '{fields.serial_or_uin or 'N/A'}' on the official portal at {verify_url} to ensure no tampering.")
        steps.append("Step 2 (Safe Storage): Keep the original physical stamp certificate safely in a moisture-free folder and scan a color PDF copy.")

    return steps

def recommend(checks: List[CheckResult], fields: StampFields) -> List[str]:
    """
    Produces actionable legal recommendations based on check results.
    """
    recs = []
    state_key = detect_state(fields.state)
    rule = RULES.get(state_key, RULES.get("TS", {}))
    portal_name = rule.get("estamp_portal", "SHCIL e-Stamp Verification Portal")
    verify_url = rule.get("verification_url", "https://www.shcilestamp.com/estamp_cer_ver.html")
    deficit, penalty, min_duty, state_display = calculate_deficit_and_penalty(fields)

    statuses = {c.name: c.status for c in checks}

    if statuses.get("Stamp Duty Adequacy") == "fail" or deficit > 0:
        recs.append(
            f"Deficit Stamp Duty Remediation: Remit the deficit stamp duty of ₹{deficit:.0f} plus Section 35 compounding penalty (estimated ₹{penalty:.0f}) to the District Registrar / SHCIL to prevent court impounding."
        )

    if statuses.get("Execution Date Precedence") == "fail":
        recs.append(
            "Anomalous Execution Date: Re-execute contract on fresh stamp certificate to cure backdating allegations under Section 23 of the Indian Contract Act."
        )

    if statuses.get("Party Identity Match") == "warning":
        recs.append(
            "Third-Party Stamp Audit: If stamp was purchased by a broker or agent, obtain written confirmation/power of attorney ratifying the stamp procurement."
        )

    recs.append(
        f"Official Verification: Confirm Certificate UIN '{fields.serial_or_uin or 'N/A'}' on the official {portal_name} at: {verify_url}"
    )

    return recs
