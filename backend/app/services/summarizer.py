from app.services.llm_service import llm_service

async def summarize_document(text: str) -> str:
    """
    Generates structured executive summary of legal document.
    """
    # Sample first ~5000 chars for prompt length
    trimmed = text[:5000] if len(text) > 5000 else text
    prompt = llm_service.load_prompt("summary.txt", text=trimmed)
    if not prompt:
        prompt = f"Summarize this legal document:\n\n{trimmed}"
    
    summary = await llm_service.generate_text(prompt)
    return summary
