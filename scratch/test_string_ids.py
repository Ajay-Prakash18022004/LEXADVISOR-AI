import urllib.request
import urllib.error

endpoints = [
    '/api/v1/documents/doc-comm-4921/download',
    '/api/v1/documents/doc-comm-4921',
    '/api/v1/pdf/doc-comm-4921/download',
    '/api/v1/generate/drafts/doc-comm-4921/download',
    '/api/v1/generate/drafts/doc-comm-4921/docx',
    '/api/v1/risk/doc-comm-4921/pdf',
    '/api/v1/actions/doc-comm-4921/pdf',
    '/api/v1/analysis/history/doc-comm-4921',
    '/api/v1/chat/proactive-brief/doc-comm-4921',
    '/api/v1/chat/history/doc-comm-4921'
]

for ep in endpoints:
    url = f'http://127.0.0.1:8000{ep}'
    try:
        req = urllib.request.Request(url)
        resp = urllib.request.urlopen(req)
        data = resp.read()
        print(f"OK {resp.status} : {ep} (Length: {len(data)} bytes, Content-Type: {resp.headers.get('Content-Type')})")
    except urllib.error.HTTPError as he:
        body = he.read().decode('utf-8', errors='ignore')
        print(f"HTTP ERROR {he.code} : {ep} -> {body[:150]}")
    except Exception as e:
        print(f"EXC : {ep} -> {e}")
