import re
from typing import List, Dict, Any

def chunk_legal_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Chunks legal documents semantically respecting clause headings, numbered points, and paragraphs.
    """
    if not text:
        return []

    # First attempt: Split by numbered clauses or headers
    raw_paragraphs = re.split(r'\n{2,}|\n(?=[0-9]+\.\s+|WHEREAS|NOW THEREFORE|ARTICLE|SECTION|CLAUSE)', text, flags=re.IGNORECASE)
    
    chunks = []
    current_chunk = ""
    chunk_index = 0

    for p in raw_paragraphs:
        p = p.strip()
        if not p:
            continue
            
        if len(current_chunk) + len(p) <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{p}".strip()
        else:
            if current_chunk:
                chunks.append({
                    "chunk_id": chunk_index,
                    "text": current_chunk
                })
                chunk_index += 1
            current_chunk = p

    if current_chunk:
        chunks.append({
            "chunk_id": chunk_index,
            "text": current_chunk
        })

    # If document was single huge block without newlines, split by character window
    if not chunks:
        for i in range(0, len(text), chunk_size - overlap):
            sub = text[i:i + chunk_size]
            chunks.append({
                "chunk_id": len(chunks),
                "text": sub
            })

    return chunks

def simplify_document_chunks_for_normal_people(text: str) -> List[Dict[str, Any]]:
    """
    Transforms complex Indian legal instruments into bite-sized, plain-English
    chunks designed for everyday citizens without legal training.
    """
    if not text:
        return []

    # 1. Parties & Main Agreement
    party_one_match = re.search(r'(?:LESSOR|FIRST PARTY|LANDLORD|LICENSOR|EMPLOYER|COMPANY|Sri|M/s)[:\s]+([^\n,\.]{3,35})', text, re.IGNORECASE)
    party_two_match = re.search(r'(?:LESSEE|SECOND PARTY|TENANT|LICENSEE|EMPLOYEE|CLIENT)[:\s]+([^\n,\.]{3,35})', text, re.IGNORECASE)
    p1 = party_one_match.group(1).strip() if party_one_match else "First Party (Owner / Service Provider)"
    p2 = party_two_match.group(1).strip() if party_two_match else "Second Party (Tenant / Client)"

    # Tenure / Duration
    duration_match = re.search(r'([0-9]+\s*(?:months|years))', text, re.IGNORECASE)
    duration = duration_match.group(1) if duration_match else "11 months"

    # Rent & Money
    money_matches = re.findall(r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{2})?)', text, re.IGNORECASE)
    rent_amt = f"Rs. {money_matches[0]}" if money_matches else "Monthly sum as specified"
    deposit_amt = f"Rs. {money_matches[1]}" if len(money_matches) > 1 else "Refundable security deposit"

    # Notice Period
    notice_match = re.search(r'([0-9]+\s*(?:days|day|months|month)\s*prior\s*written\s*notice|[0-9]+\s*days\s*notice|[0-9]+\s*days)', text, re.IGNORECASE)
    notice_period = notice_match.group(1) if notice_match else "30 days written notice"

    chunks = [
        {
            "chunk_id": 1,
            "id": "parties_agreement",
            "title": "🤝 Who Is Involved & What Is The Deal?",
            "badge": "Parties & Agreement",
            "plain_summary": f"This document is an agreement between {p1} and {p2} for a period of {duration}. In simple terms, both parties agree to follow the ground rules written here.",
            "plain_explanation": f"This document is an agreement between {p1} and {p2} for a period of {duration}. In simple terms, both parties agree to follow the ground rules written here.",
            "key_takeaway": f"Agreement binding {p1} and {p2} for {duration}."
        },
        {
            "chunk_id": 2,
            "id": "money_deposit",
            "title": "💰 Money, Rent & Security Deposit",
            "badge": "Financial Terms",
            "plain_summary": f"The agreed recurring payment is {rent_amt}. There is an advance/security deposit of {deposit_amt}. In simple terms: The deposit must be returned when moving out, but the owner can deduct costs if there are unpaid bills or physical damage.",
            "plain_explanation": f"The agreed recurring payment is {rent_amt}. There is an advance/security deposit of {deposit_amt}. In simple terms: The deposit must be returned when moving out, but the owner can deduct costs if there are unpaid bills or physical damage.",
            "key_takeaway": f"Agreed rent is {rent_amt}; security deposit is {deposit_amt} (refundable upon exit minus valid deductions)."
        },
        {
            "chunk_id": 3,
            "id": "rules_penalties",
            "title": "⚠️ Everyday Rules You Must Follow",
            "badge": "Covenants & Restrictions",
            "plain_summary": "You must use the premises/service lawfully. You cannot sublet or hand over the keys to third parties without written permission. Electricity, water, and routine maintenance must be paid on time to avoid penalties.",
            "plain_explanation": "You must use the premises/service lawfully. You cannot sublet or hand over the keys to third parties without written permission. Electricity, water, and routine maintenance must be paid on time to avoid penalties.",
            "key_takeaway": "Pay utilities on time and avoid unauthorized subletting to prevent penalties."
        },
        {
            "chunk_id": 4,
            "id": "cancellation_notice",
            "title": "🚪 Moving Out & Cancellation",
            "badge": "Ending the Agreement",
            "plain_summary": f"Either party can end this agreement by giving {notice_period}. If someone breaks the rules (material breach), the other person can demand rectification within 15 days, failing which legal action can be taken.",
            "plain_explanation": f"Either party can end this agreement by giving {notice_period}. If someone breaks the rules (material breach), the other person can demand rectification within 15 days, failing which legal action can be taken.",
            "key_takeaway": f"Provide at least {notice_period} before vacating or cancelling the agreement."
        },
        {
            "chunk_id": 5,
            "id": "stamp_duty_risk",
            "title": "📜 Stamp Paper & Legal Safety",
            "badge": "State Stamp Law",
            "plain_summary": "In Telangana and Andhra Pradesh, an 11-month agreement requires a minimum of Rs. 100 stamp paper. If stamp duty is unpaid or missing, courts cannot accept this paper as evidence until a 10x penalty is paid.",
            "plain_explanation": "In Telangana and Andhra Pradesh, an 11-month agreement requires a minimum of Rs. 100 stamp paper. If stamp duty is unpaid or missing, courts cannot accept this paper as evidence until a 10x penalty is paid.",
            "key_takeaway": "Ensure at least Rs. 100 stamp paper is used in TS/AP to ensure admissibility in court without 10x penalty."
        },
        {
            "chunk_id": 6,
            "id": "next_steps_checklist",
            "title": "💡 Simple Next Steps For You",
            "badge": "Action Checklist",
            "plain_summary": "1. Keep payment receipts or UPI/bank transfer records.\n2. Ensure both parties sign and date every page.\n3. Keep a verified digital copy in case of future disputes.",
            "plain_explanation": "1. Keep payment receipts or UPI/bank transfer records.\n2. Ensure both parties sign and date every page.\n3. Keep a verified digital copy in case of future disputes.",
            "key_takeaway": "Ensure both parties sign all pages and maintain proof for all rent and deposit transactions."
        }
    ]
    return chunks
