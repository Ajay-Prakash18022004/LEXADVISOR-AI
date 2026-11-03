import urllib.request
import json

# Login as advocate
url = 'http://127.0.0.1:8000/api/v1/auth/google'
data = json.dumps({"email": "advocate@lexadvisor.ai", "name": "Adv. Rajeshwar Rao", "role": "advocate"}).encode()
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    resp = urllib.request.urlopen(req)
    adv_res = json.loads(resp.read().decode())
    print("Advocate Login Response:", adv_res)
    token = adv_res.get('access_token')

    # Fetch advocate dashboard stats
    stats_req = urllib.request.Request('http://127.0.0.1:8000/api/v1/advocates/dashboard/stats', headers={'Authorization': f'Bearer {token}'})
    stats_resp = urllib.request.urlopen(stats_req)
    stats_data = json.loads(stats_resp.read().decode())
    print("\nAdvocate Dashboard Stats:", json.dumps(stats_data, indent=2))
except Exception as e:
    print("Error:", e)

