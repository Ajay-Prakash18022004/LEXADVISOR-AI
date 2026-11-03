from app.services.llm_service import llm_service
from app.schemas.generation import AgreementGenerateRequest

async def generate_agreement(req: AgreementGenerateRequest) -> str:
    """
    Drafts enforceable Indian agreement tailored to state jurisdiction (TS or AP).
    """
    state_name = "Telangana" if req.state.upper() == "TS" else "Andhra Pradesh" if req.state.upper() == "AP" else req.state
    prompt = llm_service.load_prompt(
        "generation_agreement.txt",
        doc_type=req.doc_type.replace("_", " ").title(),
        party_one=req.party_one,
        party_two=req.party_two,
        details=req.details,
        state=state_name
    )
    
    if not prompt:
        prompt = f"Draft {req.doc_type} between {req.party_one} and {req.party_two} in {state_name} with details: {req.details}"
        
    agreement_text = await llm_service.generate_text(prompt)
    return agreement_text
