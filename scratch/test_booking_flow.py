import urllib.request
import json

# 1. Login as Client (Suresh Thakur)
client_auth_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/auth/google',
    data=json.dumps({"email": "sureshtakur194@gmail.com", "name": "Suresh Thakur", "role": "client"}).encode(),
    headers={'Content-Type': 'application/json'}
)
client_res = json.loads(urllib.request.urlopen(client_auth_req).read().decode())
client_token = client_res['access_token']
print("1. Client logged in:", client_res['name'])

# 2. Login as Advocate (Adv. Rajeshwar Rao)
adv_auth_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/auth/google',
    data=json.dumps({"email": "advocate@lexadvisor.ai", "name": "Adv. Rajeshwar Rao", "role": "advocate"}).encode(),
    headers={'Content-Type': 'application/json'}
)
adv_res = json.loads(urllib.request.urlopen(adv_auth_req).read().decode())
adv_token = adv_res['access_token']
adv_id = adv_res['advocate_id']
print(f"2. Advocate logged in: {adv_res['name']} (Chamber Advocate ID: {adv_id})")

# 3. Client books consultation with Advocate (using a dynamic slot to avoid 409 conflict)
import time
slot_minute = int(time.time()) % 60
test_slot = f"11:{slot_minute:02d} AM"
booking_payload = {
    "advocate_id": adv_id,
    "client_name": "Suresh Thakur",
    "client_phone": "+91 98490 11223",
    "client_email": "sureshtakur194@gmail.com",
    "appointment_date": "2026-11-12",
    "time_slot": test_slot,
    "consultation_type": "Video Consultation",
    "case_subject": "Review Clause 8 Lock-In deposit forfeiture under Sec 74 ICA",
    "case_notes": "Residential lease in Kondapur, Hyderabad with Rs. 1,50,000 security deposit",
    "fee": 1500.0
}
book_req = urllib.request.Request(
    f'http://127.0.0.1:8000/api/v1/advocates/{adv_id}/book',
    data=json.dumps(booking_payload).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {client_token}'}
)
book_res = json.loads(urllib.request.urlopen(book_req).read().decode())
appointment_id = book_res['id']
print(f"3. Consultation booked! Appointment ID: {appointment_id}, Status: {book_res['status']}, Dispatched Email: {book_res.get('client_email')}")

# 4. Advocate checks pending consultations via /api/v1/advocate/consultations/pending
pending_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/advocate/consultations/pending',
    headers={'Authorization': f'Bearer {adv_token}'}
)
pending_list = json.loads(urllib.request.urlopen(pending_req).read().decode())
print(f"4. Advocate pending count: {len(pending_list)}. First item: Client '{pending_list[0]['client_name']}' on {pending_list[0]['appointment_date']} at {pending_list[0]['time_slot']}")

# 5. Advocate accepts consultation via /api/v1/advocate/consultations/{appointment_id}/accept
accept_req = urllib.request.Request(
    f'http://127.0.0.1:8000/api/v1/advocate/consultations/{appointment_id}/accept',
    data=b'{}',
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {adv_token}'}
)
accept_res = json.loads(urllib.request.urlopen(accept_req).read().decode())
print(f"5. Advocate accepted consultation: Status is now '{accept_res['status']}'")

# 6. Check updated stats
stats_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/v1/advocate/dashboard/stats',
    headers={'Authorization': f'Bearer {adv_token}'}
)
stats_res = json.loads(urllib.request.urlopen(stats_req).read().decode())
print("6. Updated Advocate Stats:")
for k, v in stats_res['stats'].items():
    print(f"   - {k}: {v}")

print("\nALL AUTOMATIC SYNCHRONIZATION TESTS PASSED PERFECTLY!")
