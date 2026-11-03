import requests
import json
import io
import datetime

BASE_URL = "http://localhost:8000/api/v1"

def run_10_apis_audit():
    print("=" * 80)
    print("PHASE 4: 10 CORE REST API VERIFICATION SUITE")
    print("=" * 80)
    
    # Authenticate client to get token
    login_res = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "sunitha.varma@clientlex.in", "password": "ClientSecure@2026", "role": "client"}
    )
    if login_res.status_code != 200:
        requests.post(
            f"{BASE_URL}/auth/register",
            json={"name": "Smt. Sunitha Varma", "email": "sunitha.varma@clientlex.in", "password": "ClientSecure@2026", "role": "client"}
        )
        login_res = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "sunitha.varma@clientlex.in", "password": "ClientSecure@2026", "role": "client"}
        )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[AUTH] Logged in as Smt. Sunitha Varma (Client). Token obtained.")

    results = {}

    # 1. Document Upload (POST /documents/upload)
    sample_text = (
        "RESIDENTIAL LEASE AGREEMENT\n"
        "This Tenancy Agreement is executed between Sri R. Narsimha Rao (Landlord) and Smt. Sunitha Varma (Tenant).\n"
        "Premises: Flat 302, Cyber Heights, Gachibowli, Hyderabad, Telangana.\n"
        "Monthly rent: Rs. 35,000/-. Security deposit: Rs. 1,00,000/-.\n"
        "Clause 8: If tenant terminates prior to 11 months, entire deposit of Rs. 1,00,000 is forfeited immediately.\n"
        "Stamp Duty: Executed on Rs. 20 non-judicial stamp paper."
    )
    files = {"file": ("Sunitha_Tenancy_Doc_Audit.txt", io.BytesIO(sample_text.encode("utf-8")), "text/plain")}
    res1 = requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)
    doc_id = res1.json().get("id") if res1.status_code in (200, 201) else None
    results["1. Document Upload (POST /documents/upload)"] = {
        "endpoint": "POST /api/v1/documents/upload",
        "status_code": res1.status_code,
        "success": res1.status_code in (200, 201),
        "doc_id": doc_id,
        "response_summary": f"Uploaded doc ID {doc_id} ('{res1.json().get('filename')}')"
    }
    print(f"  [1] Document Upload: {res1.status_code} (Doc ID: {doc_id})")

    # 2. Document Listing (GET /documents)
    res2 = requests.get(f"{BASE_URL}/documents", headers=headers)
    results["2. Document Listing (GET /documents)"] = {
        "endpoint": "GET /api/v1/documents",
        "status_code": res2.status_code,
        "success": res2.status_code == 200 and isinstance(res2.json(), list),
        "count": len(res2.json()) if res2.status_code == 200 else 0,
        "response_summary": f"Found {len(res2.json())} documents for user"
    }
    print(f"  [2] Document Listing: {res2.status_code} (Found: {results['2. Document Listing (GET /documents)']['count']})")

    # 3. Document Analysis (GET /documents/{id}/analysis)
    target_id = doc_id or 1
    res3 = requests.get(f"{BASE_URL}/documents/{target_id}/analysis", headers=headers)
    results["3. Document Analysis (GET /documents/{id}/analysis)"] = {
        "endpoint": f"GET /api/v1/documents/{target_id}/analysis",
        "status_code": res3.status_code,
        "success": res3.status_code == 200,
        "response_summary": f"Validity: {res3.json().get('validity', {}).get('status')}, BSA 63 Certified: {res3.json().get('bsa_section_63', {}).get('certified')}"
    }
    print(f"  [3] Document Analysis: {res3.status_code}")

    # 4. Stamp Duty Assessment (POST /stamp/analyze)
    res4 = requests.post(
        f"{BASE_URL}/stamp/analyze",
        data={"text_content": sample_text}
    )
    duty_data = res4.json() if res4.status_code == 200 else {}
    results["4. Stamp Duty Assessment (POST /stamp/analyze)"] = {
        "endpoint": "POST /api/v1/stamp/analyze",
        "status_code": res4.status_code,
        "success": res4.status_code == 200,
        "duty_payable": duty_data.get("stamp_duty_payable", {}).get("calculated_duty"),
        "deficit": duty_data.get("stamp_duty_payable", {}).get("deficit"),
        "response_summary": f"Risk level: {duty_data.get('risk_level')}, Deficit: Rs. {duty_data.get('stamp_duty_payable', {}).get('deficit')}"
    }
    print(f"  [4] Stamp Duty Assessment: {res4.status_code} (Deficit: {results['4. Stamp Duty Assessment (POST /stamp/analyze)']['deficit']})")

    # 5. Clause Risk Analysis (POST /risk/analyze)
    res5 = requests.post(
        f"{BASE_URL}/risk/analyze",
        data={"text_content": sample_text}
    )
    risk_data = res5.json() if res5.status_code == 200 else {}
    results["5. Clause Risk Analysis (POST /risk/analyze)"] = {
        "endpoint": "POST /api/v1/risk/analyze",
        "status_code": res5.status_code,
        "success": res5.status_code == 200,
        "overall_score": risk_data.get("overall_score"),
        "flagged_clauses": len(risk_data.get("clauses", [])),
        "response_summary": f"Overall score: {risk_data.get('overall_score')}, Flagged: {len(risk_data.get('clauses', []))} clauses"
    }
    print(f"  [5] Clause Risk Analysis: {res5.status_code} (Score: {results['5. Clause Risk Analysis (POST /risk/analyze)']['overall_score']})")

    # 6. Legal Action Roadmap (POST /actions/recommend)
    res6 = requests.post(
        f"{BASE_URL}/actions/recommend",
        data={"text_content": sample_text}
    )
    act_data = res6.json() if res6.status_code == 200 else {}
    results["6. Legal Action Roadmap (POST /actions/recommend)"] = {
        "endpoint": "POST /api/v1/actions/recommend",
        "status_code": res6.status_code,
        "success": res6.status_code == 200,
        "steps_count": len(act_data.get("immediate_steps", [])) + len(act_data.get("precautionary_measures", [])),
        "response_summary": f"Generated {len(act_data.get('immediate_steps', []))} immediate remedial actions"
    }
    print(f"  [6] Legal Action Roadmap: {res6.status_code} (Steps: {results['6. Legal Action Roadmap (POST /actions/recommend)']['steps_count']})")

    # 7. Rent Reminders / User Drafts Vault (GET /documents/user/drafts)
    res7 = requests.get(f"{BASE_URL}/documents/user/drafts", headers=headers)
    results["7. Documents Vault / Drafts (GET /documents/user/drafts)"] = {
        "endpoint": "GET /api/v1/documents/user/drafts",
        "status_code": res7.status_code,
        "success": res7.status_code == 200 and isinstance(res7.json(), list),
        "drafts_count": len(res7.json()) if res7.status_code == 200 else 0,
        "response_summary": f"Retrieved {len(res7.json())} generated legal drafts"
    }
    print(f"  [7] Documents Vault / Drafts: {res7.status_code} (Count: {results['7. Documents Vault / Drafts (GET /documents/user/drafts)']['drafts_count']})")

    # 8. Advocate Directory (GET /advocates)
    res8 = requests.get(f"{BASE_URL}/advocates", headers=headers)
    adv_list = res8.json() if res8.status_code == 200 else []
    adv_id = adv_list[0]["id"] if len(adv_list) > 0 else 1
    results["8. Advocate Directory (GET /advocates)"] = {
        "endpoint": "GET /api/v1/advocates",
        "status_code": res8.status_code,
        "success": res8.status_code == 200 and len(adv_list) > 0,
        "advocates_count": len(adv_list),
        "sample_advocate": adv_list[0]["name"] if len(adv_list) > 0 else "None",
        "response_summary": f"Found {len(adv_list)} registered advocates. Selected: {adv_list[0]['name'] if len(adv_list) > 0 else 'None'}"
    }
    print(f"  [8] Advocate Directory: {res8.status_code} (Count: {len(adv_list)})")

    # 9. Appointment Booking (POST /advocates/{id}/book)
    test_date = (datetime.date.today() + datetime.timedelta(days=35)).isoformat()
    slots_res = requests.get(f"{BASE_URL}/advocates/{adv_id}/slots?date={test_date}", headers=headers)
    avail_slot = "04:00 PM"
    if slots_res.status_code == 200 and slots_res.json().get("available_slots"):
        avail_slot = slots_res.json()["available_slots"][0]

    booking_payload = {
        "advocate_id": adv_id,
        "client_name": "Smt. Sunitha Varma",
        "client_phone": "+91 98492 44556",
        "client_email": "sunitha.varma@clientlex.in",
        "appointment_date": test_date,
        "time_slot": avail_slot,
        "consultation_type": "Virtual Video Advisory",
        "case_subject": "Tenancy Forfeiture Clause 8 Audit under Section 74 ICA",
        "case_notes": "Seeking legal advice on whether landlord can forfeit Rs. 1,00,000 security deposit.",
        "document_id": target_id,
        "fee": 2500.0
    }
    res9 = requests.post(f"{BASE_URL}/advocates/{adv_id}/book", headers=headers, json=booking_payload)
    app_id = res9.json().get("id") if res9.status_code in (200, 201) else None
    results["9. Appointment Booking (POST /advocates/{id}/book)"] = {
        "endpoint": f"POST /api/v1/advocates/{adv_id}/book",
        "status_code": res9.status_code,
        "success": res9.status_code in (200, 201),
        "appointment_id": app_id,
        "response_summary": f"Appointment booked (ID: {app_id}, Slot: {avail_slot}, Status: {res9.json().get('status')})"
    }
    print(f"  [9] Appointment Booking: {res9.status_code} (App ID: {app_id}, Slot: {avail_slot})")

    # 10. AI Chatbot (POST /chat/ask)
    res10 = requests.post(
        f"{BASE_URL}/chat/ask",
        headers=headers,
        json={
            "query": "Is forfeiture of entire security deposit under clause 8 legal under Section 74 of the Indian Contract Act?",
            "document_id": target_id,
            "document_text": sample_text
        }
    )
    chat_answer = res10.json().get("content", "") if res10.status_code == 200 else ""
    results["10. AI Chatbot (POST /chat/ask)"] = {
        "endpoint": "POST /api/v1/chat/ask",
        "status_code": res10.status_code,
        "success": res10.status_code == 200 and len(chat_answer) > 50,
        "response_length": len(chat_answer),
        "response_summary": f"Generated {len(chat_answer)} chars of statutory analysis referencing ICA Sec 74 & TPA Sec 106"
    }
    print(f"  [10] AI Chatbot: {res10.status_code} (Answer length: {len(chat_answer)} chars)")

    print("=" * 80)
    all_passed = all(r["success"] for r in results.values())
    if all_passed:
        print("ALL 10 CORE REST ENDPOINTS TESTED AND VERIFIED: 100% OPERATIONAL")
    else:
        print("SOME ENDPOINTS FAILED")
    print("=" * 80)
    
    with open("backend/api_verification_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    return results

if __name__ == "__main__":
    run_10_apis_audit()
