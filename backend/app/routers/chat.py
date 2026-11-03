from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db import models
from app.schemas.chat import (
    ChatQueryRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    ProactiveBriefResponse
)
from app.core.dependencies import get_current_user
from app.services.rag_service import rag_service

router = APIRouter(prefix="/chat", tags=["RAG Chatbot"])

@router.post("/ask", response_model=ChatMessageResponse)
async def ask_legal_question(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    RAG-powered conversational QA grounded in uploaded contract excerpts.
    """
    doc_num_id = int(req.document_id) if req.document_id and str(req.document_id).isdigit() else None

    # Save user message
    user_msg = models.ChatMessage(
        user_id=user.id,
        document_id=doc_num_id,
        role="user",
        content=req.query
    )
    db.add(user_msg)
    db.commit()

    # Retrieve context and answer strictly based on the document
    answer = await rag_service.answer_query(
        user_id=user.id,
        query=req.query,
        document_id=doc_num_id,
        document_text=req.document_text
    )

    # Save assistant message
    ai_msg = models.ChatMessage(
        user_id=user.id,
        document_id=doc_num_id,
        role="assistant",
        content=answer
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatMessageResponse(
        id=ai_msg.id,
        role="assistant",
        content=answer,
        created_at=ai_msg.created_at
    )

@router.post("/proactive-brief", response_model=ProactiveBriefResponse)
def get_proactive_brief_direct(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Generates a proactive analysis brief and context-aware suggested questions
    tailored to a selected document or pasted text.
    """
    doc_id = payload.get("document_id")
    text = payload.get("document_text", "")

    if not text and doc_id:
        doc = db.query(models.Document).filter(
            models.Document.id == doc_id,
            models.Document.user_id == user.id
        ).first()
        if doc:
            text = doc.extracted_text

    if not text:
        text = "General Contract between parties under Indian Law."

    brief = rag_service.get_proactive_brief(text, document_id=doc_id)
    return ProactiveBriefResponse(**brief)

@router.get("/proactive-brief/{doc_id}", response_model=ProactiveBriefResponse)
def get_proactive_brief_by_id(
    doc_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Fetches the proactive analysis brief for a specific document in repository.
    """
    user_id = user.id if user else 1
    if str(doc_id).isdigit():
        doc = db.query(models.Document).filter(
            models.Document.id == int(doc_id)
        ).first()
        if doc:
            brief = rag_service.get_proactive_brief(doc.extracted_text or "", document_id=int(doc_id))
            return ProactiveBriefResponse(**brief)

    brief = rag_service.get_proactive_brief(
        "Commercial or Residential lease deed under Telangana Tenancy Act 2021 with Clause 8 forfeiture and Rs. 2,300 stamp duty deficit.",
        document_id=1
    )
    return ProactiveBriefResponse(**brief)

@router.get("/history/{doc_id}", response_model=ChatHistoryResponse)
def get_chat_history(
    doc_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    user_id = user.id if user else 1
    numeric_id = int(doc_id) if str(doc_id).isdigit() else 1
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id,
        models.ChatMessage.document_id == numeric_id
    ).order_by(models.ChatMessage.created_at.asc()).all()

    return ChatHistoryResponse(
        document_id=numeric_id,
        messages=[
            ChatMessageResponse(id=m.id, role=m.role, content=m.content, created_at=m.created_at)
            for m in messages
        ]
    )

