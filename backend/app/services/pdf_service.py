import os
import re
import uuid
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle

from app.core.config import settings
from app.core.logging import logger

def generate_pdf_document(
    title: str,
    content: str,
    subtitle: str = "Official Legal Instrument"
) -> str:
    """
    Renders an authentic, neat, court-ready Indian legal document using ReportLab.
    Features:
    - Official Chamber of Advocates letterhead banner
    - Formal RPAD / Speed Post dispatch notice
    - Ref No. & execution date alignment
    - Structured Subject Callout Box
    - Justified legal body paragraphs with proper indentations
    - Dual Advocate & Client signature blocks with Bar enrollment details
    """
    filename = f"legal_doc_{uuid.uuid4().hex[:10]}.pdf"
    output_path = settings.GENERATED_PDF_DIR / filename

    try:
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=44,
            rightMargin=44,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        # Styles definition
        header_firm = ParagraphStyle(
            'ChamberFirm',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#14213d'),
            spaceAfter=2
        )

        header_sub = ParagraphStyle(
            'ChamberSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#55607a'),
            spaceAfter=3
        )

        dispatch_style = ParagraphStyle(
            'DispatchTag',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#b3261e')
        )

        meta_left = ParagraphStyle(
            'MetaLeft',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            alignment=TA_LEFT,
            textColor=colors.HexColor('#14213d')
        )

        meta_right = ParagraphStyle(
            'MetaRight',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#14213d')
        )

        subject_style = ParagraphStyle(
            'SubjectStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=14,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor('#14213d')
        )

        body_style = ParagraphStyle(
            'LegalBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.8,
            leading=15,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor('#14213d'),
            spaceAfter=8
        )

        sign_bold = ParagraphStyle(
            'SignBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor('#14213d')
        )

        sign_sub = ParagraphStyle(
            'SignSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#55607a')
        )

        story = []

        # 1. Chamber Letterhead
        story.append(Paragraph("CHAMBER OF ADVOCATES & LEGAL CONSULTANTS", header_firm))
        story.append(Paragraph("HIGH COURT OF TELANGANA & ANDHRA PRADESH &bull; DISTRICT CIVIL COURTS", header_sub))
        story.append(Paragraph("Chambers: High Court Advocates Complex, Hyderabad &bull; District Court Complex, Visakhapatnam", header_sub))
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#14213d'), spaceBefore=2, spaceAfter=8))

        # 2. Dispatch Tag Table
        dispatch_table = Table(
            [[Paragraph("BY REGISTERED POST WITH ACKNOWLEDGEMENT DUE (RPAD) & SPEED POST", dispatch_style)]],
            colWidths=[507]
        )
        dispatch_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f2f5f9')),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#c9d1dc')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(dispatch_table)
        story.append(Spacer(1, 8))

        # 3. Ref & Date metadata line
        ref_id = f"LEX/NOT/2026/{uuid.uuid4().hex[:6].upper()}"
        cur_date = datetime.now().strftime("%B %d, %Y")
        meta_table = Table(
            [[
                Paragraph(f"<b>REF NO:</b> {ref_id}", meta_left),
                Paragraph(f"<b>DATE:</b> {cur_date}", meta_right)
            ]],
            colWidths=[253, 254]
        )
        meta_table.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 6))

        # 4. Extract subject line if present, else format from title
        blocks = [b.strip() for b in re.split(r'\n\s*\n', content) if b.strip()]
        subject_text = ""
        body_blocks = []

        for block in blocks:
            # Check if this block is the subject
            first_line = block.split("\n")[0].strip()
            if re.match(r'^(SUBJECT|SUB)[:\s]', first_line, re.IGNORECASE):
                subject_text = block.replace("\n", " ").strip()
            elif block.strip().upper() in ["LEGAL DEMAND NOTICE", "LEGAL NOTICE", "BY REGISTERED POST WITH ACKNOWLEDGEMENT DUE (RPAD) & SPEED POST"]:
                continue
            else:
                body_blocks.append(block)

        if not subject_text:
            subject_text = f"SUBJECT: {title.upper()}"

        # Subject callout box
        sub_table = Table(
            [[Paragraph(f"<b>{escape_p(subject_text)}</b>", subject_style)]],
            colWidths=[507]
        )
        sub_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#14213d')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(sub_table)
        story.append(Spacer(1, 8))

        # 5. Body Paragraphs
        for block in body_blocks:
            lines = [l.strip() for l in block.split("\n") if l.strip()]
            if not lines:
                continue
            first_line = lines[0]

            if re.match(r'^(TO:|FROM:|UNDER INSTRUCTIONS)', first_line, re.IGNORECASE):
                # Format multi-line address/header
                header_html = "<br/>".join([f"<b>{escape_p(l)}</b>" if i == 0 else escape_p(l) for i, l in enumerate(lines)])
                story.append(Paragraph(header_html, body_style))
                story.append(Spacer(1, 3))
            elif re.match(r'^(SIR|MADAM|DEAR|RESPECTED)', first_line, re.IGNORECASE):
                story.append(Paragraph(f"<b>{escape_p(' '.join(lines))}</b>", body_style))
                story.append(Spacer(1, 3))
            elif re.match(r'^[0-9]+\.\s+', first_line):
                # Clean numbered legal paragraph, lines joined smoothly for full justification
                joined = " ".join(lines)
                story.append(Paragraph(escape_p(joined), body_style))
                story.append(Spacer(1, 3))
            elif "NOW THEREFORE" in block or "TAKE NOTICE" in block:
                joined = " ".join(lines)
                story.append(Paragraph(f"<b>{escape_p(joined)}</b>", body_style))
                story.append(Spacer(1, 4))
            elif re.match(r'^(YOURS|WITH REGARDS|SINCERELY)', first_line, re.IGNORECASE):
                closing_html = "<br/>".join([escape_p(l) for l in lines])
                story.append(Paragraph(closing_html, body_style))
                story.append(Spacer(1, 3))
            else:
                joined = " ".join(lines)
                story.append(Paragraph(escape_p(joined), body_style))
                story.append(Spacer(1, 3))

        # 6. Attestation space
        story.append(Spacer(1, 10))
        story.append(Paragraph("<i>A copy of this notice is retained in our chamber records for production as admissible electronic evidence in competent court proceedings.</i>", sign_sub))
        story.append(Spacer(1, 10))

        # 7. Signature Blocks Table
        sig_data = [
            [
                Paragraph("<b>FOR LEGAL COUNSEL:</b><br/><br/><br/><br/>___________________________<br/><b>Adv. Ramesh V. Kulkarni</b><br/>Enrolled Advocate, Bar Council<br/>High Court of Telangana & AP<br/>Chamber Seal & Signature", sign_bold),
                Paragraph("<b>FOR CLIENT / SENDER:</b><br/><br/><br/><br/>___________________________<br/><b>Client / Authorized Signatory</b><br/>Complainant / Disclosing Party<br/>Verification & Concurrence", sign_bold)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[253, 254])
        sig_table.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(sig_table)

        # 8. Footer Rule
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#c9d1dc'), spaceBefore=6, spaceAfter=6))
        story.append(Paragraph("LexAdvisor AI Official Legal Drafting &bull; Admissible Electronic Record under BSA 2023 &bull; Page 1 of 1", header_sub))

        doc.build(story)
        logger.info(f"Generated neat document PDF at: {output_path}")
        return str(output_path)

    except Exception as e:
        logger.error(f"Failed to generate neat PDF: {e}")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"{title}\n\n{content}")
        return str(output_path)

def escape_p(text: str) -> str:
    """Escapes XML entities for ReportLab Paragraph elements."""
    if not text:
        return ""
    return (
        str(text).replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
    )

def generate_risk_report_pdf(
    risk_data: dict,
    document_title: str = "Contract Risk Report",
    state: str = "Telangana",
    doc_type: str = "Contract / Agreement"
) -> str:
    """
    Renders an authentic, comprehensive, executive Contract Risk Audit PDF using ReportLab.
    Features:
    - Official LexAdvisor AI Letterhead & Audit Reference
    - Color-coded Risk Level (HIGH / MEDIUM / LOW) & Vulnerability Score
    - Plain-English Executive Summary
    - Risk Statistics Table (High risks, Medium risks, Missing rules)
    - Identified Traps & Dangerous Covenants (Title, Excerpt, Danger, Statutory Grounds, Safe Revision)
    - Missing Rules & Protective Clauses Table
    - Immediate Action Roadmap (What steps to take right now)
    - Bar Council Legal Advisory & Dual Signature Block
    """
    filename = f"risk_report_{uuid.uuid4().hex[:10]}.pdf"
    output_path = settings.GENERATED_PDF_DIR / filename

    try:
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=38,
            rightMargin=38,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        brand_header = ParagraphStyle(
            'BrandHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=19,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=2
        )

        brand_sub = ParagraphStyle(
            'BrandSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#475569'),
            spaceAfter=3
        )

        sec_heading = ParagraphStyle(
            'SecHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=10,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13.5,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=4
        )

        danger_style = ParagraphStyle(
            'DangerStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.8,
            leading=12.5,
            textColor=colors.HexColor('#b91c1c')
        )

        safe_style = ParagraphStyle(
            'SafeStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.8,
            leading=12.5,
            textColor=colors.HexColor('#15803d')
        )

        quote_style = ParagraphStyle(
            'QuoteStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#334155')
        )

        sign_bold = ParagraphStyle(
            'SignBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor('#0f172a')
        )

        story = []

        # 1. Official Header
        story.append(Paragraph("LEXADVISOR AI &mdash; LEGAL DECISION SUPPORT SYSTEM", brand_header))
        story.append(Paragraph("CONTRACT RISK AUDIT &bull; STATUTORY ADMISSIBILITY &bull; CLAUSE VULNERABILITY REPORT", brand_sub))
        story.append(Paragraph("Bar Council of Telangana &amp; Andhra Pradesh &bull; Indian Contract Act, 1872 &bull; Indian Stamp Act, 1899", brand_sub))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=2, spaceAfter=6))

        # 2. Audit Document Meta Table
        ref_id = f"LEX/RISK/2026/{uuid.uuid4().hex[:6].upper()}"
        cur_date = datetime.now().strftime("%B %d, %Y")
        meta_table = Table(
            [
                [
                    Paragraph(f"<b>DOCUMENT:</b> {escape_p(document_title)}", body_style),
                    Paragraph(f"<b>AUDIT DATE:</b> {cur_date}", body_style)
                ],
                [
                    Paragraph(f"<b>CATEGORY:</b> {escape_p(str(doc_type).replace('_', ' ').title())} &bull; <b>STATE:</b> {escape_p(state)}", body_style),
                    Paragraph(f"<b>REPORT REF:</b> {ref_id}", body_style)
                ]
            ],
            colWidths=[270, 249]
        )
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 8))

        # 3. Overall Risk Banner Box
        overall_level = str(risk_data.get("overall_risk_level") or risk_data.get("overall_risk") or "MEDIUM").upper()
        risk_score = risk_data.get("risk_score", 50)
        
        if overall_level == "HIGH":
            banner_bg = colors.HexColor('#fee2e2')
            banner_border = colors.HexColor('#ef4444')
            banner_text_color = '#991b1b'
            status_desc = "CRITICAL VULNERABILITY &mdash; Action Required Before Signing / Payment"
        elif overall_level == "LOW":
            banner_bg = colors.HexColor('#dcfce7')
            banner_border = colors.HexColor('#22c55e')
            banner_text_color = '#166534'
            status_desc = "SAFE CONTRACT PROFILE &mdash; Standard Bilateral Terms with Minimal Legal Risk"
        else:
            banner_bg = colors.HexColor('#fef3c7')
            banner_border = colors.HexColor('#f59e0b')
            banner_text_color = '#92400e'
            status_desc = "MODERATE RISK &mdash; Review One-Sided Clauses &amp; Add Missing Protections"

        identified_risks = risk_data.get("identified_risks", []) or []
        missing_clauses = risk_data.get("missing_clauses", []) or []
        high_cnt = sum(1 for r in identified_risks if str(r.get("severity", "")).lower() == "high")
        med_cnt = sum(1 for r in identified_risks if str(r.get("severity", "")).lower() == "medium")

        banner_text = f"""
        <para align="center">
        <b><font size="14" color="{banner_text_color}">{overall_level} CONTRACT RISK &bull; SCORE: {risk_score} / 100</font></b><br/>
        <font size="8.5" color="#334155">{status_desc}</font><br/>
        <font size="8" color="#475569"><b>{high_cnt} Critical / High Risks</b> &bull; <b>{med_cnt} Moderate Risks</b> &bull; <b>{len(missing_clauses)} Missing Protective Rules</b></font>
        </para>
        """

        banner_table = Table([[Paragraph(banner_text, styles['Normal'])]], colWidths=[519])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), banner_bg),
            ('BOX', (0,0), (-1,-1), 1.2, banner_border),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(banner_table)
        story.append(Spacer(1, 8))

        # 4. Plain-English Executive Summary
        summary_text = risk_data.get("plain_english_summary") or risk_data.get("summary") or "Comprehensive risk evaluation completed."
        summary_p = Paragraph(f"<b>💡 Plain-English Summary:</b><br/>{escape_p(summary_text)}", body_style)
        sum_table = Table([[summary_p]], colWidths=[519])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 8))

        # 5. Identified Risky Clauses
        if identified_risks:
            story.append(Paragraph("1. IDENTIFIED UNFAIR TRAPS &amp; DANGEROUS COVENANTS", sec_heading))
            for idx, r in enumerate(identified_risks, 1):
                sev = str(r.get("severity", "MEDIUM")).upper()
                sev_color = '#dc2626' if sev == 'HIGH' else '#d97706' if sev == 'MEDIUM' else '#16a34a'
                title = r.get("title") or r.get("clause_name") or f"Risk Item {idx}"
                excerpt = r.get("clause_excerpt") or ""
                danger = r.get("plain_english_danger") or r.get("explanation") or ""
                statutory = r.get("statutory_reference") or "Indian Contract Act, 1872"
                remedy = r.get("suggested_revision") or r.get("remedy") or ""

                risk_cell_data = [
                    Paragraph(f"<b>#{idx}. {escape_p(title)}</b> &nbsp;&nbsp; <font color='{sev_color}'><b>[{sev} SEVERITY]</b></font>", body_style)
                ]

                if excerpt and excerpt != "N/A":
                    risk_cell_data.append(Paragraph(f'<i>"{escape_p(excerpt)}"</i>', quote_style))

                if danger:
                    risk_cell_data.append(Paragraph(f"<b>⚠️ Why this hurts you:</b> {escape_p(danger)}", danger_style))

                if statutory:
                    risk_cell_data.append(Paragraph(f"<b>Statutory Basis:</b> {escape_p(statutory)}", body_style))

                if remedy:
                    risk_cell_data.append(Paragraph(f"<b>Safe Revision Demand:</b> {escape_p(remedy)}", safe_style))

                risk_box = Table([[risk_cell_data]], colWidths=[519])
                risk_box.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
                    ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#e2e8f0')),
                    ('LINELEFT', (0,0), (0,0), 3, colors.HexColor(sev_color)),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 8),
                    ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(risk_box)
                story.append(Spacer(1, 4))

        # 6. Missing Rules
        if missing_clauses:
            story.append(Spacer(1, 4))
            story.append(Paragraph(f"2. MISSING ESSENTIAL RULES &amp; PROTECTIVE CLAUSES ({len(missing_clauses)})", sec_heading))
            missing_rows = [
                [
                    Paragraph("<b>Clause Name</b>", body_style),
                    Paragraph("<b>Priority</b>", body_style),
                    Paragraph("<b>Why Everyday Citizens Need This Rule</b>", body_style)
                ]
            ]
            for m in missing_clauses:
                crit = str(m.get("criticality", "medium")).upper()
                c_color = '#dc2626' if crit == 'HIGH' else '#d97706'
                missing_rows.append([
                    Paragraph(f"<b>{escape_p(m.get('clause_name', ''))}</b>", body_style),
                    Paragraph(f"<font color='{c_color}'><b>{crit}</b></font>", body_style),
                    Paragraph(escape_p(m.get("why_needed_in_plain_words") or m.get("impact") or ""), body_style)
                ])

            missing_table = Table(missing_rows, colWidths=[140, 60, 319])
            missing_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#fffbeb')),
                ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#fde68a')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fef3c7')),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(missing_table)
            story.append(Spacer(1, 8))

        # 7. Action Roadmap
        steps = risk_data.get("what_steps_to_take", []) or []
        if steps:
            story.append(Paragraph("3. PRIORITIZED ACTION ROADMAP (WHAT STEP YOU SHOULD TAKE)", sec_heading))
            step_paras = [Paragraph(f"<b>{escape_p(s)}</b>", body_style) for s in steps]
            step_box = Table([[step_paras]], colWidths=[519])
            step_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
                ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#bbf7d0')),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(step_box)
            story.append(Spacer(1, 8))

        # 8. Signature Block & Attestation
        story.append(Spacer(1, 8))
        sig_data = [
            [
                Paragraph("<b>PREPARED BY AI LEGAL COUNSEL:</b><br/><br/><br/>___________________________<br/><b>LexAdvisor Proactive Legal Auditor</b><br/>Automated Contract Risk Intelligence<br/>Validated under Indian Jurisprudence", sign_bold),
                Paragraph("<b>REVIEWED BY ADVOCATE / CLIENT:</b><br/><br/><br/>___________________________<br/><b>Advocate / Client Signature</b><br/>Bar Council Enrolled Counsel<br/>Verification &amp; Concurrence", sign_bold)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[259, 260])
        sig_table.setStyle(TableStyle([
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(sig_table)

        # 9. Footer
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=4))
        story.append(Paragraph("LexAdvisor AI Official Risk Audit Report &bull; Statutory Evaluation under BSA 2023 &amp; Indian Contract Act &bull; Page 1 of 1", brand_sub))

        doc.build(story)
        logger.info(f"Generated Risk Report PDF at: {output_path}")
        return str(output_path)

    except Exception as e:
        logger.error(f"Failed to generate Risk Report PDF: {e}")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"Contract Risk Report - {document_title}\n\n{risk_data}")
        return str(output_path)


def generate_action_plan_pdf(
    plan_data: dict,
    document_title: str = "Legal Action Roadmap",
    client_name: str = "Client"
) -> str:
    """
    Renders an actionable legal roadmap PDF with step-by-step guidance, timelines, and statutory references.
    """
    filename = f"legal_roadmap_{uuid.uuid4().hex[:10]}.pdf"
    output_path = settings.GENERATED_PDF_DIR / filename

    try:
        doc = SimpleDocTemplate(
            str(output_path),
            pagesize=A4,
            leftMargin=38,
            rightMargin=38,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        brand_title = ParagraphStyle(
            'RoadmapTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=19,
            alignment=TA_LEFT,
            textColor=colors.HexColor('#0f172a')
        )

        sub_title = ParagraphStyle(
            'RoadmapSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            alignment=TA_LEFT,
            textColor=colors.HexColor('#64748b')
        )

        sec_heading = ParagraphStyle(
            'RoadmapSec',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=10,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            'RoadmapBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=12.5,
            textColor=colors.HexColor('#334155')
        )

        step_title_style = ParagraphStyle(
            'StepTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#0f172a')
        )

        def escape_p(val):
            return str(val).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

        story = []

        # 1. Header Banner
        header_table = Table([
            [
                Paragraph("<b>LEXADVISOR AI &bull; RECOMMENDED LEGAL ACTION ROADMAP</b>", brand_title),
                Paragraph(f"<b>DATE:</b> {datetime.now().strftime('%d %b %Y')}<br/><b>CLIENT:</b> {escape_p(client_name)}", sub_title)
            ]
        ], colWidths=[350, 169])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(header_table)
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=2, spaceAfter=8))

        # 2. Document & Urgency Callout
        urgency = str(plan_data.get("action_urgency", "MODERATE")).upper()
        urg_color = '#dc2626' if urgency == 'IMMEDIATE' else '#d97706' if urgency == 'MODERATE' else '#16a34a'
        summary_text = plan_data.get("summary") or "Comprehensive step-by-step strategy for protecting legal rights."

        summary_box = Table([
            [
                Paragraph(f"<b>ACTION URGENCY: <font color='{urg_color}'>{urgency}</font></b> &bull; Document: <i>{escape_p(document_title)}</i><br/>{escape_p(summary_text)}", body_style)
            ]
        ], colWidths=[519])
        summary_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(urg_color)),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(summary_box)
        story.append(Spacer(1, 8))

        # 3. Action Steps
        steps = plan_data.get("steps", [])
        if steps:
            story.append(Paragraph(f"RECOMMENDED SEQUENTIAL ACTIONS ({len(steps)} STEPS)", sec_heading))
            for s in steps:
                s_num = s.get("step_number", 1)
                s_title = s.get("title", f"Step {s_num}")
                s_prio = str(s.get("priority", "HIGH")).upper()
                s_time = s.get("timeframe", "Immediate")
                s_desc = s.get("description", "")
                s_basis = s.get("legal_basis", "")
                s_deliv = s.get("deliverable", "")

                p_color = '#dc2626' if s_prio == 'HIGH' else '#d97706' if s_prio == 'MEDIUM' else '#16a34a'

                step_content = [
                    Paragraph(f"<b>Step {s_num}: {escape_p(s_title)}</b> &nbsp; <font color='{p_color}'><b>[{s_prio} PRIORITY]</b></font> &bull; Timeline: <b>{escape_p(s_time)}</b>", step_title_style),
                    Paragraph(f"{escape_p(s_desc)}", body_style),
                ]
                if s_basis:
                    step_content.append(Paragraph(f"<b>Legal Basis:</b> {escape_p(s_basis)}", body_style))
                if s_deliv:
                    step_content.append(Paragraph(f"<b>Action Deliverable:</b> <i>{escape_p(s_deliv)}</i>", body_style))

                step_box = Table([[step_content]], colWidths=[519])
                step_box.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
                    ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#e2e8f0')),
                    ('LINELEFT', (0,0), (0,0), 3.5, colors.HexColor(p_color)),
                    ('TOPPADDING', (0,0), (-1,-1), 5),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ]))
                story.append(step_box)
                story.append(Spacer(1, 4))

        # 4. Notice Outline if present
        notice = plan_data.get("sample_notice_outline")
        if notice and notice.get("subject"):
            story.append(Spacer(1, 4))
            story.append(Paragraph("RECOMMENDED FORMAL NOTICE OUTLINE", sec_heading))
            notice_pts = notice.get("key_points", [])
            notice_text = f"<b>Subject:</b> {escape_p(notice.get('subject'))}<br/><b>Statutory Demand Window:</b> {notice.get('suggested_demand_period_days', 15)} Days<br/>"
            if notice_pts:
                notice_text += "<br/><b>Key Demand Clauses:</b><br/>" + "<br/>".join([f"&bull; {escape_p(pt)}" for pt in notice_pts])

            n_box = Table([[Paragraph(notice_text, body_style)]], colWidths=[519])
            n_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fffbeb')),
                ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#fde68a')),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(n_box)

        # 5. Advocate Consultation Brief if present
        adv_brief = plan_data.get("advocate_consultation_brief")
        if adv_brief:
            story.append(Spacer(1, 4))
            story.append(Paragraph("PREPARED ADVOCATE CONSULTATION BRIEF", sec_heading))
            a_box = Table([[Paragraph(escape_p(adv_brief), body_style)]], colWidths=[519])
            a_box.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
                ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#bbf7d0')),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(a_box)

        # 6. Attestation
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#cbd5e1'), spaceBefore=4, spaceAfter=4))
        story.append(Paragraph("LexAdvisor AI &bull; Automated Action Roadmap &bull; Generated for Client Self-Empowerment", sub_title))

        doc.build(story)
        logger.info(f"Generated Action Plan PDF at: {output_path}")
        return str(output_path)

    except Exception as e:
        logger.error(f"Failed to generate Action Plan PDF: {e}")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"Legal Action Roadmap - {document_title}\n\n{plan_data}")
        return str(output_path)


