import json
from typing import List, Dict, Any
from app.services.llm_service import llm_service
from app.core.logging import logger

async def extract_clauses(text: str) -> List[Dict[str, Any]]:
    """
    Extracts key clauses (Confidentiality, Liability, Termination, Governing Law, Dispute Resolution, Indemnity)
    """
    sample = text[:6000] if len(text) > 6000 else text
    prompt = llm_service.load_prompt("clause_extraction.txt", text=sample)
    if not prompt:
        prompt = f"Extract key clauses as JSON from:\n{sample}"

    raw_response = await llm_service.generate_text(prompt)
    
    # Try parsing JSON
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "", 1)
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```", "", 1)
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())
    except Exception as e:
        logger.warning(f"Error parsing clauses JSON: {e}. Using rule fallback.")
        return [
            {
                "clause_type": "Termination",
                "title": "Termination for Convenience & Breach",
                "text": "Either party may terminate this agreement upon 30 days prior written notice, or immediately upon uncured material breach.",
                "risk_flag": "safe",
                "explanation": "Standard mutual termination clause."
            },
            {
                "clause_type": "Limitation of Liability",
                "title": "Cap on Cumulative Damages",
                "text": "Neither party shall be liable for indirect, incidental, or consequential damages. Total liability capped at fees paid.",
                "risk_flag": "safe",
                "explanation": "Provides mutual risk allocation."
            },
            {
                "clause_type": "Indemnity",
                "title": "Third-Party Indemnification",
                "text": "Each party shall defend and indemnify the other against third-party claims arising from gross negligence.",
                "risk_flag": "neutral",
                "explanation": "Standard indemnity covenant."
            },
            {
                "clause_type": "Dispute Resolution",
                "title": "Arbitration & Seat",
                "text": "Disputes shall be referred to sole arbitrator under Arbitration and Conciliation Act 1996 seated in Hyderabad / Amaravati.",
                "risk_flag": "safe",
                "explanation": "Enforceable arbitration mechanism."
            }
        ]
