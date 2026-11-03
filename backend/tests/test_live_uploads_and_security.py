import json
import io
from pathlib import Path
import requests
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import docx

API_BASE = "http://localhost:8000/api/v1"

SAMPLE_DIR = Path("backend/tests/sample_docs")
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

# 1. Generate Realistic Residential Tenancy PDF
pdf_path = SAMPLE_DIR / "Residential_Lease_Agreement_Hyderabad.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=letter)
c.drawString(100, 750, "RESIDENTIAL TENANCY AGREEMENT (HYDERABAD, TELANGANA)")
c.drawString(100, 730, "This Agreement is made on this 1st day of October 2024 at Hyderabad, Telangana.")
c.drawString(100, 710, "BETWEEN: Sri K. R. V. Rao (Lessor) AND Smt. Deepa Nair (Lessee).")
c.drawString(100, 680, "1. TERM: The tenancy shall be for 11 months commencing from 01/10/2024 to 31/08/2025.")
c.drawString(100, 660, "2. RENT: The Lessee shall pay monthly rent of Rs. 38,000 on or before the 5th of every month.")
c.drawString(100, 640, "3. SECURITY DEPOSIT: The Lessee has deposited Rs. 1,90,000 as refundable interest-free security deposit.")
c.drawString(100, 610, "4. FORFEITURE COVENANT: In case of early termination before 11 months, the entire deposit shall be forfeited.")
c.drawString(100, 590, "5. INSPECTION: The Lessor reserves unrestricted right to enter the premises without notice at any hour.")
c.drawString(100, 570, "6. ARBITRATION: All disputes shall be referred to a sole arbitrator appointed solely by the Lessor.")
c.save()
print(f"Generated test PDF: {pdf_path} ({pdf_path.stat().st_size} bytes)")

# 2. Generate Realistic Commercial Lease DOCX
docx_path = SAMPLE_DIR / "Commercial_Lease_Deed_Hitec_City.docx"
doc = docx.Document()
doc.add_heading("COMMERCIAL LEASE DEED - HITEC CITY, TELANGANA", level=1)
doc.add_paragraph("This Commercial Lease Deed is executed on 15th October 2024 between CyberTech Properties Ltd (Lessor) and FinScale Solutions Pvt Ltd (Lessee).")
doc.add_paragraph("Clause 1 (Premises): Unit 402, Cyber Gateway, Hitec City, Hyderabad.")
doc.add_paragraph("Clause 2 (Monthly Consideration): INR 1,20,000 per month payable in advance.")
doc.add_paragraph("Clause 3 (Lock-in Period): Irrevocable 36-month lock-in. Breach attracts penalty equal to 12 months' gross rent.")
doc.add_paragraph("Clause 4 (Escalation): Mandatory annual rent escalation of 15% compounded annually.")
doc.add_paragraph("Clause 5 (Maintenance): Common area maintenance charges of INR 25,000 per month.")
doc.save(str(docx_path))
print(f"Generated test DOCX: {docx_path} ({docx_path.stat().st_size} bytes)")

# 3. Live API Test Suite
audit_results = {}

# Test A: Upload PDF Document
with open(pdf_path, "rb") as f:
    files = {"file": ("Residential_Lease_Agreement_Hyderabad.pdf", f, "application/pdf")}
    data = {
        "doc_type": "residential_tenancy",
        "state": "Telangana",
        "consideration_amount": 418000
    }
    r = requests.post(f"{API_BASE}/documents/upload", files=files, data=data)
    audit_results["pdf_upload"] = {
        "method": "POST",
        "endpoint": "/documents/upload",
        "status_code": r.status_code,
        "response": r.json() if r.status_code == 200 else r.text
    }
    pdf_doc_id = r.json().get("id") if r.status_code == 200 else None

# Test B: Upload DOCX Document
with open(docx_path, "rb") as f:
    files = {"file": ("Commercial_Lease_Deed_Hitec_City.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    data = {
        "doc_type": "commercial_lease",
        "state": "Telangana",
        "consideration_amount": 1440000
    }
    r = requests.post(f"{API_BASE}/documents/upload", files=files, data=data)
    audit_results["docx_upload"] = {
        "method": "POST",
        "endpoint": "/documents/upload",
        "status_code": r.status_code,
        "response": r.json() if r.status_code == 200 else r.text
    }
    docx_doc_id = r.json().get("id") if r.status_code == 200 else None

# Test C: Analyze Uploaded PDF
if pdf_doc_id:
    r = requests.post(f"{API_BASE}/analysis/{pdf_doc_id}")
    audit_results["pdf_analysis"] = {
        "method": "POST",
        "endpoint": f"/analysis/{pdf_doc_id}",
        "status_code": r.status_code,
        "response": r.json() if r.status_code == 200 else r.text
    }

# Test D: Analyze Uploaded DOCX
if docx_doc_id:
    r = requests.post(f"{API_BASE}/analysis/{docx_doc_id}")
    audit_results["docx_analysis"] = {
        "method": "POST",
        "endpoint": f"/analysis/{docx_doc_id}",
        "status_code": r.status_code,
        "response": r.json() if r.status_code == 200 else r.text
    }

# Test E: Security Check - Disallowed file extension (.exe)
fake_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00Malicious Executable Content")
files = {"file": ("malicious_payload.exe", fake_file, "application/octet-stream")}
r = requests.post(f"{API_BASE}/documents/upload", files=files)
audit_results["security_disallowed_extension"] = {
    "method": "POST",
    "endpoint": "/documents/upload",
    "status_code": r.status_code,
    "response": r.json() if r.headers.get("content-type") == "application/json" else r.text
}

# Test F: Error Handling - Non-existent Document ID 99999
r = requests.get(f"{API_BASE}/documents/99999")
audit_results["error_missing_document"] = {
    "method": "GET",
    "endpoint": "/documents/99999",
    "status_code": r.status_code,
    "response": r.json() if r.headers.get("content-type") == "application/json" else r.text
}

# Test G: SQL Injection / Malformed Input in Query Parameters
r = requests.get(f"{API_BASE}/deadlines?category=' OR 1=1 --")
audit_results["security_sqli_resilience"] = {
    "method": "GET",
    "endpoint": "/deadlines?category=' OR 1=1 --",
    "status_code": r.status_code,
    "response_is_list": isinstance(r.json(), list) if r.status_code == 200 else False
}

print("\n--- AUDIT RESULTS SUMMARY ---")
print(json.dumps(audit_results, indent=2))

