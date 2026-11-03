import os
import uuid
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from app.core.config import settings

def generate_docx_document(title: str, content: str, subtitle: str = "Official Legal Instrument") -> str:
    """
    Renders a formatted Microsoft Word DOCX document with headers, title, and body.
    """
    filename = f"legal_draft_{uuid.uuid4().hex[:10]}.docx"
    output_path = settings.STORAGE_DIR / "docx" / filename
    os.makedirs(settings.STORAGE_DIR / "docx", exist_ok=True)

    doc = Document()

    # Title
    heading = doc.add_heading(title, level=0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if subtitle:
        sub = doc.add_paragraph(subtitle)
        sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in sub.runs:
            run.font.size = Pt(10)
            run.font.italic = True
            run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph("") # Spacer

    # Paragraphs
    paragraphs = content.split("\n\n")
    for para in paragraphs:
        text = para.strip()
        if not text:
            continue

        if text.isupper() and len(text) < 100:
            h = doc.add_heading(text, level=2)
            h.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif text.startswith("WHEREAS") or text.startswith("NOW THIS"):
            p = doc.add_paragraph(text)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        else:
            p = doc.add_paragraph(text)
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    doc.save(str(output_path))
    return str(output_path)

