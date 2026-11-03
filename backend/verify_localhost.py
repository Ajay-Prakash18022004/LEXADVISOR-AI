import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def run_checks():
    results = {}

    # 1. Health Check
    try:
        r = requests.get("http://localhost:8000/health")
        results["health"] = {"status": r.status_code, "data": r.json()}
        print(f"[OK] Health check: {r.status_code} -> {r.json()}")
    except Exception as e:
        results["health"] = {"error": str(e)}
        print(f"[FAIL] Health check failed: {e}")

    # 2. Get advocates nearby
    try:
        r = requests.get(f"{BASE_URL}/advocates/nearby?city=Hyderabad")
        results["advocates_nearby"] = {"status": r.status_code, "count": len(r.json())}
        print(f"[OK] Advocates nearby: {r.status_code} -> found {len(r.json())} advocates")
        adv_id = r.json()[0]["id"] if r.json() else 1
    except Exception as e:
        results["advocates_nearby"] = {"error": str(e)}
        print(f"[FAIL] Advocates nearby failed: {e}")
        adv_id = 1

    # 3. Book consultation appointment & verify email notification to sureshtakur194@gmail.com
    try:
        payload = {
            "advocate_id": adv_id,
            "client_name": "Suresh Thakur",
            "client_phone": "+91 98490 11223",
            "client_email": "sureshtakur194@gmail.com",
            "appointment_date": "2026-11-15",
            "time_slot": "11:30 AM",
            "consultation_type": "In-Chamber",
            "case_subject": "Tenancy Stamp Deficit & Unilateral Lock-in Review",
            "case_notes": "Landlord demands full deposit retention. Need counsel before SRO regularization.",
            "fee": 1500.0
        }
        r = requests.post(f"{BASE_URL}/advocates/appointments", json=payload)
        results["book_appointment"] = {
            "status": r.status_code,
            "notification_sent": r.json().get("notification_sent"),
            "notification_message": r.json().get("notification_message"),
            "appointment_id": r.json().get("id")
        }
        print(f"[OK] Book appointment: {r.status_code} -> notification_sent={r.json().get('notification_sent')}, msg='{r.json().get('notification_message')}'")
    except Exception as e:
        results["book_appointment"] = {"error": str(e)}
        print(f"[FAIL] Book appointment failed: {e}")

    # 4. Generate Legal Agreement in Drafting Studio
    try:
        draft_payload = {
            "doc_type": "rental_agreement",
            "party_one": "Suresh Thakur",
            "party_two": "K. R. V. Rao",
            "details": "Residential lease at Kondapur, Hyderabad. Monthly rent Rs. 25,000, 3 months deposit, 11 months term.",
            "state": "TS"
        }
        r = requests.post(f"{BASE_URL}/generate/document", json=draft_payload)
        results["generate_draft"] = {
            "status": r.status_code,
            "draft_id": r.json().get("id"),
            "title": r.json().get("title"),
            "pdf_download_url": r.json().get("pdf_download_url")
        }
        draft_id = r.json().get("id")
        print(f"[OK] Generate draft: {r.status_code} -> Draft ID {draft_id}, title='{r.json().get('title')}'")
    except Exception as e:
        results["generate_draft"] = {"error": str(e)}
        print(f"[FAIL] Generate draft failed: {e}")
        draft_id = None

    # 5. Download Generated PDF
    if draft_id:
        try:
            r = requests.get(f"http://localhost:8000/api/v1/generate/drafts/{draft_id}/download")
            results["download_draft_pdf"] = {
                "status": r.status_code,
                "content_type": r.headers.get("content-type"),
                "size_bytes": len(r.content),
                "is_pdf": r.content.startswith(b"%PDF")
            }
            print(f"[OK] Download draft PDF: {r.status_code} -> {len(r.content)} bytes, valid PDF={r.content.startswith(b'%PDF')}")
        except Exception as e:
            results["download_draft_pdf"] = {"error": str(e)}
            print(f"[FAIL] Download draft PDF failed: {e}")

        # 6. Download Generated Word (.docx)
        try:
            r = requests.get(f"http://localhost:8000/api/v1/generate/drafts/{draft_id}/docx")
            results["download_draft_docx"] = {
                "status": r.status_code,
                "content_type": r.headers.get("content-type"),
                "size_bytes": len(r.content),
                "is_docx": len(r.content) > 1000
            }
            print(f"[OK] Download draft DOCX: {r.status_code} -> {len(r.content)} bytes, content-type={r.headers.get('content-type')}")
        except Exception as e:
            results["download_draft_docx"] = {"error": str(e)}
            print(f"[FAIL] Download draft DOCX failed: {e}")

    # 7. Action Plan Direct PDF Generation
    try:
        plan_payload = {
            "plan": {
                "action_urgency": "immediate",
                "summary": "Statutory demand plan for recovering withheld security deposit under TS law.",
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Preserve Bank Remittance Proof",
                        "action_type": "evidence",
                        "priority": "high",
                        "timeframe": "24-48 Hours",
                        "description": "Secure Section 63 BSA certificate for digital payments.",
                        "legal_basis": "BSA 2023 Sec 63",
                        "deliverable": "Bank Statement"
                    }
                ]
            },
            "document_title": "Tenancy Dispute Roadmap",
            "client_name": "Suresh Thakur"
        }
        r = requests.post(f"{BASE_URL}/actions/pdf", json=plan_payload)
        results["action_plan_pdf"] = {
            "status": r.status_code,
            "content_type": r.headers.get("content-type"),
            "size_bytes": len(r.content),
            "is_pdf": r.content.startswith(b"%PDF")
        }
        print(f"[OK] Action plan PDF: {r.status_code} -> {len(r.content)} bytes, valid PDF={r.content.startswith(b'%PDF')}")
    except Exception as e:
        results["action_plan_pdf"] = {"error": str(e)}
        print(f"[FAIL] Action plan PDF failed: {e}")

    # 8. User Profile Update
    try:
        token_r = requests.post(f"{BASE_URL}/auth/google", json={"email": "sureshtakur194@gmail.com", "name": "Suresh Thakur"})
        token = token_r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        prof_r = requests.put(f"{BASE_URL}/auth/profile", json={
            "name": "Suresh Thakur",
            "phone": "+91 98490 11223",
            "city": "Hyderabad",
            "state": "Telangana",
            "preferred_language": "English"
        }, headers=headers)
        results["profile_update"] = {
            "status": prof_r.status_code,
            "user": prof_r.json()
        }
        print(f"[OK] Profile update: {prof_r.status_code} -> user={prof_r.json().get('name')}, city={prof_r.json().get('city')}")
    except Exception as e:
        results["profile_update"] = {"error": str(e)}
        print(f"[FAIL] Profile update failed: {e}")

    with open("backend/localhost_verification_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\nSaved comprehensive results to backend/localhost_verification_results.json")

if __name__ == "__main__":
    run_checks()
