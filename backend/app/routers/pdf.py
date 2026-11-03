import os
from typing import Union
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.services.pdf_service import generate_pdf_document

router = APIRouter(prefix="/pdf", tags=["PDF Downloads"])

@router.get("/{id}/download")
def download_generated_pdf(
    id: str,
    db: Session = Depends(get_db)
):
    if str(id).isdigit():
        numeric_id = int(id)
        doc = db.query(models.GeneratedDoc).filter(models.GeneratedDoc.id == numeric_id).first()
        if doc and doc.pdf_path and os.path.exists(doc.pdf_path):
            filename = f"{doc.doc_type}_{doc.id}.pdf"
            return FileResponse(
                path=doc.pdf_path,
                filename=filename,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
        
        # Check if it corresponds to an uploaded Document
        uploaded = db.query(models.Document).filter(models.Document.id == numeric_id).first()
        if uploaded:
            if uploaded.file_path and os.path.exists(uploaded.file_path):
                return FileResponse(
                    path=uploaded.file_path,
                    filename=uploaded.filename,
                    media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{uploaded.filename}"'}
                )
            pdf_path = generate_pdf_document(
                title=uploaded.filename.rsplit('.', 1)[0] if '.' in uploaded.filename else uploaded.filename,
                content=uploaded.extracted_text or "Instrument archived in LexAdvisor legal repository.",
                subtitle=f"Jurisdiction: {uploaded.state}"
            )
            filename = f"{uploaded.filename.rsplit('.', 1)[0]}.pdf"
            return FileResponse(
                path=pdf_path,
                filename=filename,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )

    # Fallback for string sample IDs (e.g. doc-comm-4921, doc-ts-hyd-8842, draft-1)
    is_comm = "comm" in str(id).lower()
    title = "Commercial Shop Lease Agreement" if is_comm else "Residential Tenancy Agreement"
    sample_content = (
        f"OFFICIAL SAMPLE LEGAL INSTRUMENT [{id}]\n\n"
        "Jurisdiction: Telangana (TS Stamp Act & Tenancy Act 2021 Reference)\n"
        "Status: Audited by LexAdvisor AI Statutory Decision Support Engine\n\n"
        "1. PARTIES: Deed between Lessor and Lessee in accordance with standard statutory tenancy covenants.\n"
        "2. CONSIDERATION: Monthly rent and standard security deposit subject to Section 74 Indian Contract Act.\n"
        "3. REGISTRATION & STAMP DUTY: Regulated under Schedule 1-A Article 35 Telangana Stamp Act."
    )
    pdf_path = generate_pdf_document(
        title=title,
        content=sample_content,
        subtitle="LexAdvisor AI Generated Demonstration Instrument"
    )
    filename = f"{title.replace(' ', '_')}.pdf"
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
