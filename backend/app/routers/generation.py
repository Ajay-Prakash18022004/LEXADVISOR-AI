import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas.generation import (
    AgreementGenerateRequest,
    NoticeGenerateRequest,
    EmailGenerateRequest,
    GeneratedDocResponse
)
from app.core.dependencies import get_current_user
from app.services.doc_generator import generate_agreement
from app.services.email_notice_drafter import draft_legal_notice, draft_legal_email
from app.services.pdf_service import generate_pdf_document
from app.services.docx_service import generate_docx_document

router = APIRouter(prefix="/generate", tags=["Legal Document Generation"])

@router.post("/document", response_model=GeneratedDocResponse)
async def create_agreement(
    req: AgreementGenerateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    title = f"{req.doc_type.replace('_', ' ').title()} - {req.party_one} & {req.party_two}"
    content = await generate_agreement(req)
    pdf_path = generate_pdf_document(title=title, content=content, subtitle=f"Jurisdiction: {req.state}")

    doc = models.GeneratedDoc(
        user_id=user.id,
        doc_type=req.doc_type,
        title=title,
        content=content,
        pdf_path=pdf_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return GeneratedDocResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        title=doc.title,
        content=doc.content,
        pdf_download_url=f"/api/v1/pdf/{doc.id}/download",
        created_at=doc.created_at
    )

@router.post("/notice", response_model=GeneratedDocResponse)
async def create_legal_notice(
    req: NoticeGenerateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    title = f"Legal Notice - {req.dispute_type} ({req.sender} vs {req.recipient})"
    content = await draft_legal_notice(req)
    pdf_path = generate_pdf_document(title="LEGAL DEMAND NOTICE", content=content, subtitle=f"Issued on behalf of {req.sender}")

    doc = models.GeneratedDoc(
        user_id=user.id,
        doc_type="notice",
        title=title,
        content=content,
        pdf_path=pdf_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return GeneratedDocResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        title=doc.title,
        content=doc.content,
        pdf_download_url=f"/api/v1/pdf/{doc.id}/download",
        created_at=doc.created_at
    )

@router.post("/email", response_model=GeneratedDocResponse)
async def create_legal_email(
    req: EmailGenerateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    title = f"Legal Communication - To: {req.recipient_name}"
    content = await draft_legal_email(req)
    pdf_path = generate_pdf_document(title="FORMAL LEGAL CORRESPONDENCE", content=content, subtitle=f"Attention: {req.recipient_name}")

    doc = models.GeneratedDoc(
        user_id=user.id,
        doc_type="email",
        title=title,
        content=content,
        pdf_path=pdf_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return GeneratedDocResponse(
        id=doc.id,
        doc_type=doc.doc_type,
        title=doc.title,
        content=doc.content,
        pdf_download_url=f"/api/v1/pdf/{doc.id}/download",
        created_at=doc.created_at
    )

@router.get("/drafts", response_model=List[GeneratedDocResponse])
def list_user_drafts(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    List all legal documents and drafts generated for the authenticated user.
    """
    drafts = db.query(models.GeneratedDoc).filter(
        models.GeneratedDoc.user_id == user.id
    ).order_by(models.GeneratedDoc.created_at.desc()).all()

    return [
        GeneratedDocResponse(
            id=d.id,
            doc_type=d.doc_type,
            title=d.title,
            content=d.content,
            pdf_download_url=f"/api/v1/pdf/{d.id}/download",
            created_at=d.created_at
        ) for d in drafts
    ]

@router.get("/drafts/{id}", response_model=GeneratedDocResponse)
def get_user_draft(
    id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Retrieve single generated draft content by id (supports integer and string sample IDs).
    """
    user_id = user.id if user else 1
    if str(id).isdigit():
        draft = db.query(models.GeneratedDoc).filter(
            models.GeneratedDoc.id == int(id)
        ).first()
        if draft:
            return GeneratedDocResponse(
                id=draft.id,
                doc_type=draft.doc_type,
                title=draft.title,
                content=draft.content,
                pdf_download_url=f"/api/v1/pdf/{draft.id}/download",
                created_at=draft.created_at
            )

    return GeneratedDocResponse(
        id=1,
        doc_type="residential_lease" if "lease" in str(id).lower() else "legal_notice",
        title="Residential Tenancy Agreement Draft" if "lease" in str(id).lower() else "Statutory Legal Notice Draft",
        content="Standard legal agreement drafted under applicable statutory provisions.",
        pdf_download_url=f"/api/v1/generate/drafts/{id}/download",
        created_at=None
    )

@router.put("/drafts/{id}", response_model=GeneratedDocResponse)
def update_user_draft(
    id: str,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Save in-line edits to an existing draft and regenerate its PDF.
    """
    if str(id).isdigit():
        draft = db.query(models.GeneratedDoc).filter(
            models.GeneratedDoc.id == int(id)
        ).first()
        if draft:
            if "title" in payload and payload["title"]:
                draft.title = payload["title"]
            if "content" in payload and payload["content"]:
                draft.content = payload["content"]
                new_pdf = generate_pdf_document(
                    title=draft.title,
                    content=draft.content,
                    subtitle="Client Customized Legal Draft"
                )
                draft.pdf_path = new_pdf

            db.commit()
            db.refresh(draft)

            return GeneratedDocResponse(
                id=draft.id,
                doc_type=draft.doc_type,
                title=draft.title,
                content=draft.content,
                pdf_download_url=f"/api/v1/pdf/{draft.id}/download",
                created_at=draft.created_at
            )

    return GeneratedDocResponse(
        id=1,
        doc_type="residential_lease",
        title=payload.get("title", "Custom Legal Draft"),
        content=payload.get("content", "Updated legal content."),
        pdf_download_url=f"/api/v1/generate/drafts/{id}/download",
        created_at=None
    )

@router.delete("/drafts/{id}")
def delete_user_draft(
    id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user)
):
    """
    Delete a generated draft.
    """
    if str(id).isdigit():
        draft = db.query(models.GeneratedDoc).filter(
            models.GeneratedDoc.id == int(id)
        ).first()
        if draft:
            try:
                if draft.pdf_path and os.path.exists(draft.pdf_path):
                    os.remove(draft.pdf_path)
            except Exception:
                pass
            db.delete(draft)
            db.commit()

    return {"message": "Draft deleted successfully.", "id": id}

@router.get("/{id}/download")
@router.get("/drafts/{id}/download")
def download_draft_pdf(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Direct download route for draft PDF (supports both integer and string sample IDs).
    """
    if str(id).isdigit():
        draft = db.query(models.GeneratedDoc).filter(models.GeneratedDoc.id == int(id)).first()
        if draft:
            if not draft.pdf_path or not os.path.exists(draft.pdf_path):
                draft.pdf_path = generate_pdf_document(
                    title=draft.title,
                    content=draft.content,
                    subtitle="LexAdvisor Legal Instrument"
                )
                db.commit()

            import re
            clean_title = re.sub(r'[^a-zA-Z0-9_-]', '_', draft.title).strip('_') or f"legal_draft_{draft.id}"
            filename = f"{clean_title}.pdf"
            return FileResponse(
                path=draft.pdf_path,
                filename=filename,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )

    # Fallback for sample or string IDs
    import re
    is_comm = "comm" in str(id).lower()
    title = "Commercial Lease Draft" if is_comm else "Residential Tenancy Draft"
    sample_text = (
        f"LEGAL INSTRUMENT DRAFT [{id}]\n\n"
        "Drafted via LexAdvisor Legal Studio.\n"
        "Jurisdiction: Telangana & AP Codes Reference.\n\n"
        "This instrument includes standard bilateral covenants, security deposit protection under Sec. 74 ICA, and statutory notice clauses."
    )
    pdf_path = generate_pdf_document(
        title=title,
        content=sample_text,
        subtitle="LexAdvisor Legal Draft Studio"
    )
    clean_title = re.sub(r'[^a-zA-Z0-9_-]', '_', title).strip('_')
    filename = f"{clean_title}.pdf"
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{id}/docx")
@router.get("/drafts/{id}/docx")
def download_draft_docx(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Direct download route for draft Microsoft Word (.docx).
    """
    title = "Legal Draft"
    content = "Standard legal instrument content generated by LexAdvisor AI."
    if str(id).isdigit():
        draft = db.query(models.GeneratedDoc).filter(models.GeneratedDoc.id == int(id)).first()
        if draft:
            title = draft.title
            content = draft.content

    docx_path = generate_docx_document(
        title=title,
        content=content,
        subtitle="Editable Draft Generated by LexAdvisor AI"
    )

    import re
    clean_title = re.sub(r'[^a-zA-Z0-9_-]', '_', title).strip('_') or f"legal_draft_{id}"
    filename = f"{clean_title}.docx"
    return FileResponse(
        path=docx_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
