import requests
import time
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def test_full_two_user_booking_and_status_sync():
    ts = int(time.time())
    
    # 1. Register Advocate A
    adv_email = f"advocate_{ts}@lexadvisor.ai"
    adv_reg_payload = {
        "name": f"Adv. Rajeshwar Rao {ts}",
        "email": adv_email,
        "password": "Password@123",
        "role": "advocate",
        "phone": f"+91 9849{ts % 100000:05d}",
        "city": "Hyderabad",
        "bar_council_id": f"TS/{ts % 9000 + 1000}/2014",
        "state_bar_council": "Bar Council of Telangana",
        "specialization": "Civil, Property & Tenancy Litigation",
        "experience_years": 12,
        "address": "Chamber 402, High Court Buildings, Hyderabad",
        "consultation_fee": 2500,
        "languages_spoken": "English, Telugu, Hindi"
    }
    adv_res = requests.post(f"{BASE_URL}/api/v1/auth/register", json=adv_reg_payload)
    assert adv_res.status_code == 200, f"Advocate registration failed: {adv_res.text}"
    adv_data = adv_res.json()
    adv_token = adv_data["access_token"]
    adv_id = adv_data.get("advocate_id")
    assert adv_id is not None, "advocate_id missing in registration response"
    adv_headers = {"Authorization": f"Bearer {adv_token}"}
    
    # 2. Register Client B
    client_email = f"client_{ts}@test.com"
    client_reg_payload = {
        "name": f"Sri Suresh Thakur {ts}",
        "email": client_email,
        "password": "Password@123",
        "role": "client",
        "phone": f"+91 9848{ts % 100000:05d}",
        "city": "Hyderabad"
    }
    client_res = requests.post(f"{BASE_URL}/api/v1/auth/register", json=client_reg_payload)
    assert client_res.status_code == 200, f"Client registration failed: {client_res.text}"
    client_data = client_res.json()
    client_token = client_data["access_token"]
    client_headers = {"Authorization": f"Bearer {client_token}"}

    # 3. Client B checks Advocate A's available slots
    today = datetime.now()
    target_date = (today + timedelta(days=5)).strftime("%Y-%m-%d")
    slots_res = requests.get(f"{BASE_URL}/api/v1/advocates/{adv_id}/slots?date={target_date}")
    assert slots_res.status_code == 200, f"Get slots failed: {slots_res.text}"
    slots_data = slots_res.json()
    available_slots = slots_data["available_slots"]
    assert len(available_slots) > 0, "No available slots returned for advocate"
    selected_slot = available_slots[0]

    # 4. Client B books Advocate A
    booking_payload = {
        "advocate_id": adv_id,
        "client_name": client_reg_payload["name"],
        "client_phone": client_reg_payload["phone"],
        "client_email": client_email,
        "appointment_date": target_date,
        "time_slot": selected_slot,
        "consultation_type": "Video Call",
        "case_subject": "Tenancy Lock-in & Deposit Recovery under Section 74 ICA",
        "case_notes": "Lessor attempted arbitrary ₹1,50,000 security deposit forfeiture.",
        "fee": 2500
    }
    book_res = requests.post(f"{BASE_URL}/api/v1/advocates/appointments", json=booking_payload, headers=client_headers)
    assert book_res.status_code == 200, f"Booking failed: {book_res.text}"
    booking_record = book_res.json()
    appointment_id = booking_record["id"]
    assert booking_record["status"] == "pending", f"Initial status should be pending, got {booking_record['status']}"
    assert booking_record["fee"] == 2500, "Agreed consultation fee snapshot mismatch"

    # 5. Advocate A queries Pending Consultations
    adv_pending_res = requests.get(f"{BASE_URL}/api/v1/advocate/consultations/pending", headers=adv_headers)
    assert adv_pending_res.status_code == 200, f"Advocate pending consultations failed: {adv_pending_res.text}"
    pending_list = adv_pending_res.json()
    matching = [p for p in pending_list if p["id"] == appointment_id]
    assert len(matching) == 1, f"Appointment {appointment_id} did not appear in Advocate A's pending list"
    assert matching[0]["client_name"] == client_reg_payload["name"]
    assert matching[0]["time_slot"] == selected_slot
    assert matching[0]["fee"] == 2500

    # 6. Advocate A accepts the consultation
    accept_res = requests.post(f"{BASE_URL}/api/v1/advocate/consultations/{appointment_id}/accept", headers=adv_headers)
    assert accept_res.status_code == 200, f"Accept failed: {accept_res.text}"

    # 7. Client B queries appointments -> sees confirmed/accepted
    client_apps_res = requests.get(f"{BASE_URL}/api/v1/advocates/appointments/my", headers=client_headers)
    assert client_apps_res.status_code == 200, f"Client appointments failed: {client_apps_res.text}"
    client_apps = client_apps_res.json()
    c_match = [a for a in client_apps if a["id"] == appointment_id]
    assert len(c_match) == 1, "Appointment missing from Client B's list"
    assert c_match[0]["status"] == "confirmed", f"Status should be confirmed, got {c_match[0]['status']}"

    # 8. Register Advocate C and assert Advocate C cannot access Advocate A's appointment (403 Forbidden)
    adv_c_email = f"advocate_c_{ts}@lexadvisor.ai"
    adv_c_payload = {
        "name": f"Adv. Cross Counsel {ts}",
        "email": adv_c_email,
        "password": "Password@123",
        "role": "advocate",
        "phone": f"+91 9847{ts % 100000:05d}",
        "city": "Hyderabad",
        "bar_council_id": f"TS/{ts % 9000 + 2000}/2018",
        "state_bar_council": "Bar Council of Telangana",
        "specialization": "Criminal Defense",
        "experience_years": 6,
        "address": "Chamber 101, Nampally Criminal Courts, Hyderabad",
        "consultation_fee": 1800,
        "languages_spoken": "English, Telugu"
    }
    c_res = requests.post(f"{BASE_URL}/api/v1/auth/register", json=adv_c_payload)
    assert c_res.status_code == 200
    adv_c_token = c_res.json()["access_token"]
    adv_c_headers = {"Authorization": f"Bearer {adv_c_token}"}

    forbidden_res = requests.get(f"{BASE_URL}/api/v1/advocates/appointments/{appointment_id}", headers=adv_c_headers)
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden for cross-advocate access, got {forbidden_res.status_code}"

    # 9. Advocate A updates consultation fee to 5000 -> existing appointment retains 2500 snapshot fee
    fee_update_res = requests.patch(f"{BASE_URL}/api/v1/advocates/me", json={"consultation_fee": 5000}, headers=adv_headers)
    assert fee_update_res.status_code == 200

    recheck_app = requests.get(f"{BASE_URL}/api/v1/advocates/appointments/{appointment_id}", headers=adv_headers)
    assert recheck_app.status_code == 200
    assert recheck_app.json()["fee"] == 2500, "Existing appointment fee must remain unchanged after advocate fee update!"

    print("ALL TWO-USER BOOKING & CROSS-ROLE SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_two_user_booking_and_status_sync()
