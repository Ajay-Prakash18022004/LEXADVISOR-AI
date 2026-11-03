from app.services.llm_service import llm_service
from app.schemas.generation import NoticeGenerateRequest, EmailGenerateRequest

async def draft_legal_notice(req: NoticeGenerateRequest) -> str:
    state_name = "Telangana" if req.state.upper() == "TS" else "Andhra Pradesh" if req.state.upper() == "AP" else req.state
    prompt = llm_service.load_prompt(
        "generation_notice.txt",
        sender=req.sender,
        recipient=req.recipient,
        dispute_type=req.dispute_type,
        facts=req.facts,
        amount=req.amount or "Not specified",
        deadline_days=req.deadline_days,
        state=state_name
    )
    if not prompt:
        prompt = f"Draft legal notice from {req.sender} to {req.recipient} for {req.dispute_type} demanding resolution in {req.deadline_days} days."
    return await llm_service.generate_text(prompt)

async def draft_legal_email(req: EmailGenerateRequest) -> str:
    prompt = (
        f"You are a legal counsel drafting a formal communication email.\n"
        f"Recipient: {req.recipient_name}\n"
        f"Context & Dispute: {req.context}\n"
        f"Tone: {req.tone}\n"
        f"Action Requested: {req.action_requested}\n\n"
        f"Draft a clear, structured professional email with subject line, greeting, factual background, actionable request, and professional closing."
    )
    return await llm_service.generate_text(prompt)
