import json
from typing import Optional, List
from app.schemas.actions import ActionPlanReport, ActionStep, NoticeOutline, UrgencyLevel, ActionPriority
from app.schemas.risk import RiskReport
from app.schemas.stamp import StampReport
from app.services.llm_service import llm_service
from app.core.logging import logger

class ActionEngine:
    async def recommend(
        self,
        document_text: str,
        risk_report: Optional[RiskReport] = None,
        stamp_report: Optional[StampReport] = None,
        document_id: Optional[int] = None
    ) -> ActionPlanReport:
        """
        Synthesizes contract findings, risks, and stamp authenticity to generate a
        prioritized, step-by-step legal action roadmap.
        """
        stamp_summary_str = "Stamp verified: OK"
        stamp_deficient = False
        if stamp_report:
            if stamp_report.risk_level.value == "high" or any(c.status == "fail" for c in stamp_report.checks):
                stamp_deficient = True
                stamp_summary_str = f"Stamp Deficient! Confidence: {stamp_report.confidence_score}/100. Issues: {'; '.join([c.detail for c in stamp_report.checks if c.status in ['fail', 'warning']])}"

        risk_summary_str = "Standard risks"
        has_high_risks = False
        if risk_report:
            has_high_risks = (risk_report.overall_risk.value == "high") or any(r.severity.value == "high" for r in risk_report.identified_risks)
            risk_summary_str = f"Overall Risk: {risk_report.overall_risk.value.upper()}. Score: {risk_report.risk_score}/100. Key items: {'; '.join([r.title for r in risk_report.identified_risks[:3]])}"

        # Determine urgency
        urgency = UrgencyLevel.IMMEDIATE if (stamp_deficient or has_high_risks) else UrgencyLevel.MODERATE

        prompt = llm_service.load_prompt(
            "action_plan.txt",
            text=document_text[:4000],
            stamp_report=stamp_summary_str,
            risk_report=risk_summary_str
        )

        llm_response = await llm_service.generate_text(prompt) if prompt else ""

        # Attempt to parse structured JSON
        parsed_plan = None
        try:
            clean = llm_response.strip()
            if clean.startswith("```json"):
                clean = clean.replace("```json", "", 1)
            if clean.startswith("```"):
                clean = clean.replace("```", "", 1)
            if clean.endswith("```"):
                clean = clean[:-3]
            data = json.loads(clean.strip())
            
            steps = [
                ActionStep(
                    step_number=s.get("step_number", i + 1),
                    title=s.get("title", f"Action Step {i+1}"),
                    action_type=s.get("action_type", "compliance"),
                    priority=ActionPriority(s.get("priority", "medium")),
                    timeframe=s.get("timeframe", "Immediate"),
                    description=s.get("description", ""),
                    legal_basis=s.get("legal_basis", "Indian Contract Act"),
                    deliverable=s.get("deliverable", "Documentary Proof")
                )
                for i, s in enumerate(data.get("steps", []))
            ]

            notice_data = data.get("sample_notice_outline", {})
            sample_notice = NoticeOutline(
                recommended=notice_data.get("recommended", True),
                subject=notice_data.get("subject", "LEGAL NOTICE: Demand for Rectification of Contractual Default"),
                key_points=notice_data.get("key_points", [
                    "Recital of contractual relationship and execution particulars",
                    "Statement of material default and failure to remedy",
                    "Statutory 15-day cure window",
                    "Reservation of right to initiate civil and criminal proceedings"
                ]),
                suggested_demand_period_days=notice_data.get("suggested_demand_period_days", 15)
            )

            parsed_plan = ActionPlanReport(
                document_id=document_id,
                action_urgency=UrgencyLevel(data.get("action_urgency", urgency.value)),
                summary=data.get("summary", "Prioritized legal action plan to protect rights and cure liabilities."),
                steps=steps,
                sample_notice_outline=sample_notice,
                advocate_consultation_brief=data.get("advocate_consultation_brief")
            )
        except Exception as e:
            logger.warning(f"Could not parse action plan JSON ({e}). Generating rule-based plan.")

        if not parsed_plan or not parsed_plan.steps:
            parsed_plan = self._build_deterministic_plan(document_id, stamp_deficient, has_high_risks, urgency)

        return parsed_plan

    def _build_deterministic_plan(self, document_id: Optional[int], stamp_deficient: bool, has_high_risks: bool, urgency: UrgencyLevel) -> ActionPlanReport:
        steps = []
        step_no = 1

        # Step 1: Evidence Preservation
        steps.append(ActionStep(
            step_number=step_no,
            title="Evidence & Digital Communications Preservation",
            action_type="evidence",
            priority=ActionPriority.HIGH,
            timeframe="Within 48 hours",
            description="Collate and securely archive signed agreement counterparts, bank payment records, WhatsApp/SMS exports, and official email trails with electronic hash integrity.",
            legal_basis="Section 65B Indian Evidence Act, 1872 / Section 63 BSA, 2023",
            deliverable="Certified chronological evidence dossier."
        ))
        step_no += 1

        # Step 2: Stamp duty cure if deficient
        if stamp_deficient:
            steps.append(ActionStep(
                step_number=step_no,
                title="Deficit Stamp Duty Remediation & Impounding Protection",
                action_type="compliance",
                priority=ActionPriority.HIGH,
                timeframe="Within 3 to 5 business days",
                description="Submit document to District Registrar / Sub-Registrar Office in Telangana or Andhra Pradesh for adjudication and voluntary payment of deficit duty to prevent court impounding.",
                legal_basis="Sections 31, 35, & 40 of Indian Stamp Act, 1899",
                deliverable="Endorsement certificate of validated stamp duty payment."
            ))
            step_no += 1

        # Step 3: Formal Legal Notice
        steps.append(ActionStep(
            step_number=step_no,
            title="Service of Formal Demand & Cure Notice (RPAD / Speed Post)",
            action_type="notice",
            priority=ActionPriority.HIGH,
            timeframe="Within 7 calendar days",
            description="Serve advocate-settled Legal Demand Notice giving the counterparty 15 days to cure contractual breaches or face civil suit / arbitration.",
            legal_basis="Section 106 Transfer of Property Act / Section 73 Indian Contract Act",
            deliverable="Signed legal notice, postal booking slips, and tracking delivery proof."
        ))
        step_no += 1

        # Step 4: Bilateral Negotiation
        steps.append(ActionStep(
            step_number=step_no,
            title="Structured Pre-Litigation Negotiation & Addendum Execution",
            action_type="negotiation",
            priority=ActionPriority.MEDIUM,
            timeframe="Days 8 to 20",
            description="Convene without-prejudice mediation session to execute a supplementary addendum resolving one-sided indemnity and establishing mutual liability caps.",
            legal_basis="Section 62 Indian Contract Act, 1872 (Novation and Alteration)",
            deliverable="Executed bilateral Supplementary Addendum."
        ))
        step_no += 1

        # Step 5: Advocate Consultation & Court Proceedings
        steps.append(ActionStep(
            step_number=step_no,
            title="Engagement of Bar Advocate for Interim Court Protection",
            action_type="advocate",
            priority=ActionPriority.MEDIUM,
            timeframe="Upon expiry of notice period",
            description="Consult practicing High Court or District Court advocate to file for ad-interim injunction or summary recovery suit.",
            legal_basis="Order 39 Rules 1 & 2 CPC 1908 (Temporary Injunctions)",
            deliverable="Plaint petition and injunction affidavit ready for court filing."
        ))

        return ActionPlanReport(
            document_id=document_id,
            action_urgency=urgency,
            summary="Strategic 5-phase legal roadmap prioritizing evidence preservation, stamp regularisation, formal RPAD demand notice, and judicial enforcement.",
            steps=steps,
            sample_notice_outline=NoticeOutline(
                recommended=True,
                subject="LEGAL NOTICE: Demand for Rectification of Contractual Default and Settlement of Claims",
                key_points=[
                    "Formal recital of agreement execution and valid consideration paid",
                    "Specific chronological itemization of contractual defaults and breaches",
                    "Peremptory demand to cure default within 15 calendar days",
                    "Warning of civil damages claim with 18% interest and cost of litigation"
                ],
                suggested_demand_period_days=15
            ),
            advocate_consultation_brief="Instruct the advocate on: (1) Admissibility under Telangana/AP Stamp schedules; (2) Electronic evidence certification; (3) Territorial jurisdiction of local district court."
        )

action_engine = ActionEngine()
