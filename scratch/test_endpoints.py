import urllib.request
import json

endpoints = [
    '/api/v1/documents/doc-comm-4921/download',
    '/api/v1/documents/doc-ts-hyd-8842/download',
    '/api/v1/risk/doc-comm-4921/pdf',
    '/api/v1/risk/doc-ts-hyd-8842/pdf',
    '/api/v1/actions/doc-comm-4921/pdf',
    '/api/v1/actions/doc-ts-hyd-8842/pdf',
    '/api/v1/auth/me'
]

for ep in endpoints:
    url = f'http://127.0.0.1:8000{ep}'
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req)
        content_type = resp.headers.get('Content-Type')
        data = resp.read()
        print(f"SUCCESS {ep} => {resp.status} | {content_type} | Length: {len(data)} bytes")
    except Exception as e:
        print(f"FAILED  {ep} => {e}")

