import requests
import json

BASE = "http://localhost:8000"

print("--- 1. Testing Health ---")
r = requests.get(f"{BASE}/health")
assert r.status_code == 200, f"Health failed: {r.text}"
print("[OK] Health status:", r.json())

print("\n--- 2. Register Client ---")
client_payload = {
    "name": "Ramesh Kumar",
    "email": "ramesh.client.test@lexadvisor.ai",
    "password": "Password@123",
    "role": "client",
    "phone": "+91 99887 76655",
    "city": "Hyderabad"
}
# Delete or login if exists
r = requests.post(f"{BASE}/auth/register", json=client_payload)
if r.status_code == 400:
    r = requests.post(f"{BASE}/auth/login", json={"email": client_payload["email"], "password": client_payload["password"], "role": "client"})
assert r.status_code == 200, f"Client auth failed: {r.text}"
client_token = r.json()["access_token"]
print("[OK] Client Token obtained, role:", r.json().get("role"))

print("\n--- 3. Register Advocate ---")
adv_payload = {
    "name": "Adv. Rajeshwar Rao",
    "email": "rajeshwar.advocate.test@lexadvisor.ai",
    "password": "AdvocatePass@123",
    "role": "advocate",
    "phone": "+91 98491 55443",
    "bar_council_id": "TS/1402/2014",
    "state_bar_council": "Bar Council of Telangana",
    "specialization": "Civil, Property & Real Estate Litigation",
    "experience_years": 12,
    "consultation_fee": 2000.0,
    "address": "Chamber 204, High Court Complex, Hyderabad",
    "languages_spoken": "English, Telugu, Hindi"
}
r = requests.post(f"{BASE}/auth/register", json=adv_payload)
if r.status_code == 400:
    r = requests.post(f"{BASE}/auth/login", json={"email": adv_payload["email"], "password": adv_payload["password"], "role": "advocate"})
assert r.status_code == 200, f"Advocate auth failed: {r.text}"
adv_data = r.json()
adv_token = adv_data["access_token"]
print("[OK] Advocate Token obtained, role:", adv_data.get("role"), "verification_status:", adv_data.get("verification_status"))
assert adv_data.get("verification_status") == "pending", "Newly registered advocate must start as pending!"

print("\n--- 4. Role Authorization: Client forbidden on advocate stats ---")
headers_client = {"Authorization": f"Bearer {client_token}"}
r = requests.get(f"{BASE}/advocate/dashboard/stats", headers=headers_client)
print("Client accessing advocate route status:", r.status_code)
assert r.status_code == 403, f"Expected 403 for client accessing advocate route, got {r.status_code}"
print("[OK] Backend authorization properly rejected client access to advocate portal!")

print("\n--- 5. Advocate accessing advocate dashboard stats ---")
headers_adv = {"Authorization": f"Bearer {adv_token}"}
r = requests.get(f"{BASE}/advocate/dashboard/stats", headers=headers_adv)
assert r.status_code == 200, f"Advocate stats failed: {r.text}"
stats = r.json()
print("[OK] Advocate Stats:", stats.get("stats"))

print("\n--- 6. Case Creation and Private Advocate Notes Separation ---")
case_payload = {
    "title": "Encroachment & Illegal Construction Dispute on Plot 45",
    "category": "Civil / Property",
    "description": "Neighbor built permanent boundary wall encroaching 3 feet onto registered property."
}
r = requests.post(f"{BASE}/cases", json=case_payload, headers=headers_adv)
assert r.status_code == 200, f"Create case failed: {r.text}"
case_info = r.json()
case_id = case_info["case_id"]
print(f"[OK] Case created: {case_info['case_number']} (ID: {case_id})")

# Advocate adds a public update
r = requests.post(f"{BASE}/cases/{case_id}/notes", json={
    "message": "Notice under Section 106 dispatched via registered speed post.",
    "is_private_to_advocate": False,
    "activity_type": "notice"
}, headers=headers_adv)
assert r.status_code == 200

# Advocate adds a PRIVATE internal legal note
r = requests.post(f"{BASE}/cases/{case_id}/notes", json={
    "message": "INTERNAL STRATEGY: Opponent title deed shows defect in survey number 142/B. Do not disclose before interim injunction hearing.",
    "is_private_to_advocate": True,
    "activity_type": "note"
}, headers=headers_adv)
assert r.status_code == 200
print("[OK] Added public milestone and private advocate strategy note.")

# Fetch case as advocate: MUST see 3 activities (initial + public + private)
r_adv_case = requests.get(f"{BASE}/cases/{case_id}", headers=headers_adv)
assert r_adv_case.status_code == 200
adv_activities = r_adv_case.json()["activities"]
print(f"Advocate sees {len(adv_activities)} activities (includes private: {any(a['is_private_to_advocate'] for a in adv_activities)})")
assert any(a['is_private_to_advocate'] for a in adv_activities), "Advocate should see private notes!"

# Fetch case as client: MUST NOT see the private note!
# (Assign case client to client_payload user first or check filtering)
from app.db.database import SessionLocal
from app.db import models
db = SessionLocal()
c_user = db.query(models.User).filter(models.User.email == client_payload["email"]).first()
case_obj = db.query(models.LegalCase).filter(models.LegalCase.id == case_id).first()
case_obj.client_id = c_user.id
db.commit()
db.close()

r_client_case = requests.get(f"{BASE}/cases/{case_id}", headers=headers_client)
assert r_client_case.status_code == 200
client_activities = r_client_case.json()["activities"]
print(f"Client sees {len(client_activities)} activities (includes private: {any(a['is_private_to_advocate'] for a in client_activities)})")
assert not any(a['is_private_to_advocate'] for a in client_activities), "CRITICAL LEAK: Client should NEVER see private advocate notes!"
print("[OK] Confirmed: Client is strictly shielded from private advocate notes!")

print("\n--- ALL BACKEND PORTAL VERIFICATION CHECKS PASSED ---")

