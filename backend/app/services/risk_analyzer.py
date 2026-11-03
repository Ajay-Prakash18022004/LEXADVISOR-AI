import json
import re
from typing import Optional, Dict, Any, List
from app.schemas.risk import RiskReport, MissingClauseItem, IdentifiedRiskItem, SeverityLevel
from app.schemas.stamp import StampReport
from app.services.llm_service import llm_service
from app.core.scoring import compute_contract_risk
from app.core.config import settings
from app.core.logging import logger

def _load_checklist() -> Dict[str, Any]:
    try:
        with open(settings.CLAUSE_CHECKLIST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading clause checklist: {e}")
        return {}

CHECKLIST_DATA = _load_checklist()

class RiskAnalyzer:
    async def analyze(
        self,
        document_text: str,
        doc_type: str = "rental_agreement",
        stamp_report: Optional[StampReport] = None,
        document_id: Optional[int] = None
    ) -> RiskReport:
        """
        Executes comprehensive exact contract risk evaluation:
        1. Checklist missing clause discovery with plain-English rationales
        2. High-risk, one-sided, and ambiguous clause detection
        3. Stamp duty impact incorporation
        4. Plain-English layman explanations & exact steps to take
        """
        clean_type = (doc_type or "general_agreement").strip().lower().replace(" ", "_")
        if clean_type not in CHECKLIST_DATA:
            if "rent" in clean_type or "lease" in clean_type or "tenan" in clean_type:
                clean_type = "rental_agreement"
            elif "service" in clean_type:
                clean_type = "service_agreement"
            elif "employ" in clean_type:
                clean_type = "employment_agreement"
            elif "nda" in clean_type or "confidential" in clean_type:
                clean_type = "nda_non_disclosure"
            else:
                clean_type = "general_agreement"

        checklist = CHECKLIST_DATA.get(clean_type, CHECKLIST_DATA.get("general_agreement", {}))
        required_clauses = checklist.get("required_clauses", [])

        # Step 1: Detect missing clauses using semantic keyword & regex scan
        missing_clauses = self._detect_missing_clauses(document_text, required_clauses)

        # Step 2: Detect identified high-risk / one-sided clauses
        detected_risks = self._detect_contract_risks(document_text)

        # Step 3: Factor in Stamp Report risks if present
        stamp_summary = "No stamp report available."
        stamp_risk_val = "low"
        if stamp_report:
            stamp_risk_val = stamp_report.risk_level.value
            failed_checks = [c.detail for c in stamp_report.checks if c.status in ["fail", "warning"]]
            stamp_summary = f"Confidence: {stamp_report.confidence_score}/100. Issues: {'; '.join(failed_checks) if failed_checks else 'None'}"
            if stamp_report.risk_level.value == "high" or (stamp_report.deficit_cure_amount and stamp_report.deficit_cure_amount > 0):
                deficit = stamp_report.deficit_cure_amount or 0
                penalty = stamp_report.statutory_penalty_estimate or (deficit * 10)
                detected_risks.insert(0, IdentifiedRiskItem(
                    category="statutory",
                    severity=SeverityLevel.HIGH,
                    title="Deficient Stamp Paper / Unenforceability Risk (Section 35 Indian Stamp Act)",
                    clause_name="Deficient Stamp Paper / Unenforceability Risk",
                    clause_excerpt=f"Stamp Certificate: {stamp_report.fields.serial_or_uin or 'N/A'}, Denomination Paid: ₹{stamp_report.fields.denomination or 0}",
                    explanation=f"Shortfall of ₹{deficit:.0f} detected. Under Section 35 of the Indian Stamp Act, 1899, an insufficiently stamped agreement CANNOT be admitted as evidence in any Indian court or acted upon by any public officer.",
                    statutory_reference="Section 35, Indian Stamp Act, 1899",
                    remedy=f"Immediately remit the deficit stamp duty of ₹{deficit:.0f} plus compounding penalty (est. ₹{penalty:.0f}) to the District Registrar / Sub-Registrar before signing or initiating legal action.",
                    suggested_revision=f"Procure a fresh e-stamp certificate of adequate statutory value (minimum ₹{stamp_report.minimum_duty_required or 100:.0f}).",
                    plain_english_danger="What this means for you: If the other party cheats you or refuses to pay, you CANNOT show this document to a judge or police officer until you pay a heavy 10x fine."
                ))

        # Step 4: Call LLM for enriched context if available
        prompt = llm_service.load_prompt(
            "risk_analysis.txt",
            doc_type=clean_type.replace("_", " ").title(),
            checklist=json.dumps(required_clauses, indent=2),
            text=document_text[:5000],
            stamp_summary=stamp_summary
        )

        llm_output = await llm_service.generate_text(prompt) if prompt else ""
        
        # Merge LLM items if valid JSON
        llm_data = {}
        try:
            clean = llm_output.strip()
            if clean.startswith("```json"):
                clean = clean.replace("```json", "", 1)
            if clean.startswith("```"):
                clean = clean.replace("```", "", 1)
            if clean.endswith("```"):
                clean = clean[:-3]
            llm_data = json.loads(clean.strip())
        except Exception:
            llm_data = {}

        # Merge recommendations
        recommendations = llm_data.get("recommendations", [])
        if not recommendations:
            recommendations = self._generate_default_recommendations(missing_clauses, detected_risks)

        # Compute dynamic risk score
        high_cnt = sum(1 for r in detected_risks if r.severity == SeverityLevel.HIGH)
        med_cnt = sum(1 for r in detected_risks if r.severity == SeverityLevel.MEDIUM)
        risk_score, overall = compute_contract_risk(
            missing_clauses_count=len(missing_clauses),
            high_risks_count=high_cnt,
            medium_risks_count=med_cnt,
            stamp_risk_level=stamp_risk_val
        )

        critical_missing = sum(1 for m in missing_clauses if m.criticality == SeverityLevel.HIGH)

        # Concrete actionable steps for everyday citizens
        what_steps = self._generate_actionable_steps(missing_clauses, detected_risks, clean_type)

        plain_summary = (
            f"Your document was evaluated with an overall {overall.upper()} legal risk profile (Score: {risk_score}/100). "
            f"We detected {len(missing_clauses)} missing rules/clauses and {len(detected_risks)} dangerous one-sided clauses. "
            f"Please read the action steps below before signing or making payments."
        )

        return RiskReport(
            document_id=document_id,
            overall_risk=SeverityLevel(overall),
            overall_risk_level=overall.upper(),
            risk_score=risk_score,
            summary=llm_data.get("summary") or plain_summary,
            plain_english_summary=plain_summary,
            critical_clauses_missing_count=critical_missing,
            high_risks_count=high_cnt,
            medium_risks_count=med_cnt,
            missing_clauses=missing_clauses,
            identified_risks=detected_risks,
            recommendations=recommendations,
            what_steps_to_take=what_steps
        )

    def _detect_missing_clauses(self, text: str, required_clauses: List[Dict[str, Any]]) -> List[MissingClauseItem]:
        text_lower = text.lower()
        missing = []

        keywords_map = {
            "parties": ["between", "lessor", "lessee", "party of the first part", "employer", "employee", "client", "service provider"],
            "premises": ["demised premises", "schedule of property", "situated at", "premises bearing", "flat no", "boundaries"],
            "term_and_rent": ["tenure", "term of", "monthly rent", "rent of rs", "payment schedule", "payable on or before"],
            "security_deposit": ["security deposit", "interest-free", "refundable deposit", "caution deposit"],
            "maintenance_and_utilities": ["electricity", "water charges", "maintenance charges", "utility bills", "society maintenance"],
            "termination_and_notice": ["termination", "notice period", "days prior written notice", "prior written notice", "vacate"],
            "entry_inspection_notice": ["24 hours notice", "prior notice before entry", "inspection notice", "reasonable hours"],
            "registration_clause": ["sub-registrar", "registered under section 17", "registration act", "duly registered"],
            "dispute_resolution": ["arbitration", "dispute resolution", "arbitrator", "arbitration and conciliation act", "civil courts"],
            "governing_law": ["governing law", "laws of india", "jurisdiction of courts", "subject to"],
            "scope_of_work": ["scope of work", "deliverables", "milestones", "specifications"],
            "payment_terms": ["invoicing", "invoice", "payment within", "consideration"],
            "confidentiality": ["confidential information", "non-disclosure", "proprietary information", "trade secrets"],
            "intellectual_property": ["intellectual property", "work for hire", "ip rights", "ownership of deliverables"],
            "limitation_of_liability": ["limitation of liability", "indirect damages", "consequential damages", "aggregate liability", "liability cap"],
            "indemnification": ["indemnify", "indemnification", "hold harmless", "defend and hold"],
            "force_majeure": ["force majeure", "act of god", "unforeseen event", "epidemic", "lockdown"]
        }

        for clause in required_clauses:
            cid = clause.get("id", "")
            tokens = keywords_map.get(cid, [clause.get("name", "").lower()])
            found = any(k in text_lower for k in tokens)
            if not found:
                missing.append(MissingClauseItem(
                    clause_name=clause.get("name", cid),
                    criticality=SeverityLevel(clause.get("criticality", "medium")),
                    impact=f"Absence of '{clause.get('name')}' leaves critical legal rights unprotected under Indian law.",
                    why_needed_in_plain_words=clause.get("why_needed_in_plain_words", "Protects your rights against unexpected disputes.")
                ))

        return missing

    def _detect_contract_risks(self, text: str) -> List[IdentifiedRiskItem]:
        risks = []
        text_lower = text.lower()

        # 1. Unilateral Indemnity
        if "indemnif" in text_lower:
            if "party b shall indemnify" in text_lower or ("indemnify" in text_lower and "mutual" not in text_lower and "each party" not in text_lower):
                risks.append(IdentifiedRiskItem(
                    category="one_sided",
                    severity=SeverityLevel.HIGH,
                    title="Unilateral Indemnity Exposure (Indemnity Trap)",
                    clause_name="Unilateral Indemnity Exposure",
                    clause_excerpt="Party shall indemnify, protect, defend, and hold harmless without reciprocal indemnification.",
                    explanation="You bear absolute defense and compensation costs for all claims without reciprocal liability on the counterparty.",
                    statutory_reference="Section 124 & 125, Indian Contract Act, 1872",
                    remedy="Convert into a mutual indemnification clause with a reasonable monetary cap on claims.",
                    suggested_revision="Both parties agree to mutually indemnify each other against direct losses arising from gross negligence, capped at total 6 months fees/rent.",
                    plain_english_danger="What this means for you: If a third party sues, YOU have to pay all their lawyer fees and compensation alone, while the other party pays ₹0."
                ))

        # 2. Unlimited Liability / Missing Liability Cap
        if "consequential damages" in text_lower or "unlimited liability" in text_lower or ("limitation of liability" not in text_lower and "liability cap" not in text_lower):
            risks.append(IdentifiedRiskItem(
                category="unlimited_liability",
                severity=SeverityLevel.HIGH,
                title="Absence of Limitation of Liability Cap",
                clause_name="Absence of Limitation of Liability Cap",
                clause_excerpt="No cap on indirect, special, punitive, or consequential damages.",
                explanation="Exposes you to unlimited financial ruin in case of incidental performance disruption or property damage.",
                statutory_reference="Section 73, Indian Contract Act, 1872",
                remedy="Insert standard limitation capping cumulative liability to total contract fees or 1 year rent.",
                suggested_revision="Neither party shall be liable for indirect or consequential damages. Maximum aggregate liability shall not exceed total fees/rent paid in preceding 12 months.",
                plain_english_danger="What this means for you: There is no limit on how much money the other party can demand from you if something goes wrong."
            ))

        # 3. Unilateral Termination / No Cure Window (Section 106 TP Act)
        if "terminate immediately" in text_lower or "without notice" in text_lower or "sole discretion to terminate" in text_lower:
            risks.append(IdentifiedRiskItem(
                category="termination",
                severity=SeverityLevel.HIGH,
                title="Immediate Termination Without Notice or Cure Window",
                clause_name="Immediate Termination Without Notice",
                clause_excerpt="Right to terminate immediately without notice, assigning reasons, or providing cure period.",
                explanation="Deprives you of the statutory 15 to 30 days reasonable notice required to cure bona fide operational or rental lapses.",
                statutory_reference="Section 106, Transfer of Property Act, 1882",
                remedy="Mandate at least 15 to 30 calendar days written cure notice before any termination takes effect.",
                suggested_revision="In event of breach, non-defaulting party must issue written notice giving 15 calendar days to cure the breach before terminating.",
                plain_english_danger="What this means for you: You could be thrown out of the house or cancelled with zero warning tomorrow morning."
            ))

        # 4. Strict Lock-in Period Penal Forfeiture (Section 74 Contract Act)
        if "lock-in" in text_lower or "lock in" in text_lower:
            risks.append(IdentifiedRiskItem(
                category="termination",
                severity=SeverityLevel.HIGH,
                title="Strict Lock-In Period Penal Rent Forfeiture",
                clause_name="Strict Lock-In Period Penal Forfeiture",
                clause_excerpt="Entire balance of rent/fees for unexpired lock-in term forfeited immediately upon early exit.",
                explanation="Under Section 74 of the Indian Contract Act, penal forfeitures are illegal. Courts only award reasonable compensation for actual demonstrated loss.",
                statutory_reference="Section 74, Indian Contract Act, 1872 (Liquidated Damages vs Penalty)",
                remedy="Cap early departure compensation to maximum 1 to 2 months rent as genuine pre-estimate of loss.",
                suggested_revision="In case of early vacation during lock-in, tenant shall forfeit maximum 1 month rent or actual vacancy period loss until replacement tenant is found, whichever is less.",
                plain_english_danger="What this means for you: If you have a job transfer or emergency and move out early, the owner wants to keep 10-20 lakhs of your rent money illegally."
            ))

        # 5. Non-Refundable / Arbitrary Deposit Deductions
        if "non-refundable" in text_lower and "deposit" in text_lower:
            risks.append(IdentifiedRiskItem(
                category="financial",
                severity=SeverityLevel.HIGH,
                title="Non-Refundable Security Deposit Clause",
                clause_name="Non-Refundable Security Deposit",
                clause_excerpt="Security deposit is designated as non-refundable or subject to arbitrary owner deductions.",
                explanation="Security deposit in tenancy is an interest-free advance held in trust and MUST be refundable within 7-14 days after deducting legitimate electricity/repair bills.",
                statutory_reference="Section 108(q), Transfer of Property Act, 1882",
                remedy="Explicitly designate deposit as interest-free refundable deposit payable within 7 business days of handing over peaceful vacant possession.",
                suggested_revision="Lessor shall refund full security deposit within 7 days of key handover, with itemized tax invoices provided for any legitimate deductions.",
                plain_english_danger="What this means for you: The owner is attempting to permanently keep your hard-earned security deposit money."
            ))

        # 6. Arbitrary Rent Escalation
        if "escalat" in text_lower or "rent increase" in text_lower or "hike" in text_lower:
            if "sole discretion" in text_lower or ("escalat" in text_lower and "%" not in text_lower and "percent" not in text_lower):
                risks.append(IdentifiedRiskItem(
                    category="financial",
                    severity=SeverityLevel.MEDIUM,
                    title="Uncapped Arbitrary Rent Escalation",
                    clause_name="Uncapped Rent Escalation",
                    clause_excerpt="Lessor may revise or hike rent at discretion upon renewal without statutory ceiling.",
                    explanation="Absence of a defined rent escalation percentage cap allows landlord to demand exorbitant 30-50% hikes upon renewal.",
                    statutory_reference="State Tenancy & Rent Control Regulations",
                    remedy="Cap annual rent increase strictly between 5% and 10% upon completion of 11-month tenure.",
                    suggested_revision="Upon mutual renewal after 11 months, monthly rent shall increase by no more than 5% (five percent).",
                    plain_english_danger="What this means for you: The owner can arbitrarily raise your rent to whatever huge number they want next year."
                ))

        # 7. Asymmetric Jurisdiction (distant courts)
        distant_cities = ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "bangalore", "singapore", "london"]
        found_distant = [c for c in distant_cities if c in text_lower]
        if found_distant and ("hyderabad" in text_lower or "telangana" in text_lower or "andhra" in text_lower or "visakhapatnam" in text_lower):
            risks.append(IdentifiedRiskItem(
                category="jurisdiction",
                severity=SeverityLevel.MEDIUM,
                title=f"Distant Court Jurisdiction ({found_distant[0].title()})",
                clause_name=f"Distant Court Jurisdiction ({found_distant[0].title()})",
                clause_excerpt=f"Exclusive jurisdiction conferred upon courts in {found_distant[0].title()}.",
                explanation="Litigating in an out-of-state forum multiplies travel, lodging, advocate fees, and procedural hurdles.",
                statutory_reference="Section 20, Code of Civil Procedure, 1908 (Place of Suing)",
                remedy="Amend jurisdiction to local district courts where the demised premises or performance is located.",
                suggested_revision="This agreement shall be subject to the exclusive jurisdiction of the competent civil courts at Hyderabad / Amaravati.",
                plain_english_danger="What this means for you: If any fight happens, you will have to fly to another city and hire expensive outstation lawyers to defend yourself."
            ))

        # 8. Unreasonable Landlord Right of Entry / Lockout
        if "lockout" in text_lower or "re-enter without notice" in text_lower or "disconnect electricity" in text_lower:
            risks.append(IdentifiedRiskItem(
                category="possession",
                severity=SeverityLevel.HIGH,
                title="Illegal Landlord Disconnection & Lockout Clause",
                clause_name="Illegal Disconnection & Lockout Clause",
                clause_excerpt="Lessor may re-enter premises, disconnect electricity/water, or change locks upon default.",
                explanation="Disconnection of essential services and forcible physical eviction without due process of law is strictly unconstitutional and a criminal trespass in India.",
                statutory_reference="Bishandas v. State of Punjab (Supreme Court) / Section 441 IPC (Criminal Trespass)",
                remedy="Remove any clause permitting summary re-entry or disconnection of basic utility services.",
                suggested_revision="Lessor shall not disconnect essential utilities or physically re-enter except through lawful eviction order passed by a competent court.",
                plain_english_danger="What this means for you: Landlord is reserving the right to cut your power/water or lock you out on the street, which is completely illegal under Indian law."
            ))

        return risks

    def _generate_default_recommendations(self, missing: List[MissingClauseItem], risks: List[IdentifiedRiskItem]) -> List[str]:
        recs = []
        if any(r.severity == SeverityLevel.HIGH for r in risks):
            recs.append("Restructure the indemnity, liability, and lock-in penalty clauses to ensure bilateral protection and a definitive financial damages ceiling.")
        if missing:
            recs.append(f"Incorporate missing essential clauses: {', '.join([m.clause_name for m in missing[:3]])}.")
        recs.append("Verify stamp duty adequacy on the official SHCIL / IGRS portal prior to execution or payment.")
        recs.append("Consult a practicing advocate to vet jurisdiction and notice period before signing.")
        return recs

    def _generate_actionable_steps(self, missing: List[MissingClauseItem], risks: List[IdentifiedRiskItem], doc_type: str) -> List[str]:
        steps = []
        steps.append("Step 1 (Do Not Sign As-Is): Request the owner / employer / counterparty to amend the identified one-sided clauses before executing the agreement.")
        
        high_risk_titles = [r.title for r in risks if r.severity == SeverityLevel.HIGH]
        if high_risk_titles:
            steps.append(f"Step 2 (Clause Revision Demand): Send a written revision request (via WhatsApp/Email) to replace: {', '.join(high_risk_titles[:2])}.")

        if any("Stamp" in r.title for r in risks):
            steps.append("Step 3 (Stamp Regularisation): Pay the deficit stamp duty at the Sub-Registrar Office to ensure your agreement is admissible in court under Section 35 of the Stamp Act.")

        if missing:
            missing_names = [m.clause_name for m in missing[:3]]
            steps.append(f"Step 4 (Insert Missing Protections): Add the missing protective rules into the draft: {', '.join(missing_names)}.")

        steps.append("Step 5 (Payment Safety): Always pay rent, security deposits, or fees through verifiable banking channels (NEFT/RTGS/UPI); never pay cash without an official signed receipt.")
        steps.append("Step 6 (Legal Notice If Disputed): In case of existing breach or non-refund, use our 'Legal Notice & PDF Drafter' tab to issue a 15-day formal RPAD demand notice.")
        return steps

risk_analyzer = RiskAnalyzer()
