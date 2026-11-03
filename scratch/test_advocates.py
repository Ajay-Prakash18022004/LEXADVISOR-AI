import urllib.request, json, sys
sys.path.insert(0, 'backend')
from app.core.security import create_access_token

def get(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

def post(url, data=None, token=None):
    body = json.dumps(data).encode('utf-8') if data else b'{}'
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

adv_token = create_access_token({'sub': 'advocate@lexadvisor.ai', 'role': 'advocate', 'user_id': 1})
client_token = create_access_token({'sub': 'sureshtakur194@gmail.com', 'role': 'client', 'user_id': 2})

print('=== Test 1: Profiles ===')
st, profiles = get('http://127.0.0.1:8000/api/v1/advocate/profiles', adv_token)
print('Profiles count:', len(profiles))
for p in profiles:
    print('  ID', p['id'], ':', p['name'], '(', p['bar_council_id'], ') - Pending:', p['pending_count'], 'Confirmed:', p['confirmed_count'])

print('\n=== Test 2: Adv 1 Stats (Adv. Rajeshwar Rao) ===')
st, s1 = get('http://127.0.0.1:8000/api/v1/advocate/dashboard/stats?advocate_id=1', adv_token)
print('Adv 1 Name:', s1.get('name'), '| Pending:', s1['stats']['pending_consultations'], '| Recent pending items:', len(s1['recent_pending']))

print('\n=== Test 3: Adv 3 Stats (Adv. Ramesh V. Kulkarni) ===')
st, s3 = get('http://127.0.0.1:8000/api/v1/advocate/dashboard/stats?advocate_id=3', adv_token)
print('Adv 3 Name:', s3.get('name'), '| Pending:', s3['stats']['pending_consultations'], '| Recent pending items:', len(s3['recent_pending']))

print('\n=== Test 4: Adv 11 Stats (Adv. Ch. Murali Krishna) ===')
st, s11 = get('http://127.0.0.1:8000/api/v1/advocate/dashboard/stats?advocate_id=11', adv_token)
print('Adv 11 Name:', s11.get('name'), '| Pending:', s11['stats']['pending_consultations'], '| Recent pending items:', len(s11['recent_pending']))

print('\n=== Test 5: Accept Consultation on Appointment 1 ===')
# Let's test accept on Appointment 1
st, acc = post('http://127.0.0.1:8000/api/v1/advocate/consultations/1/accept', token=adv_token)
print('Accept response status:', st, '| Message:', acc.get('message'))

print('\n=== Test 6: Verify Client Portal Appointments ===')
st, apps = get('http://127.0.0.1:8000/api/v1/advocates/appointments', client_token)
for a in apps[:5]:
    print('  App', a['id'], ':', a['advocate_name'], '| Status:', a['status'], '| Date:', a['appointment_date'])

