import subprocess
import time
import os
import shutil

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\prem\.gemini\antigravity\brain\a5db483c-9ed0-4d3f-a962-dabf9db6f4ff"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

PAGES = [
    ("dashboard_reimagined", "http://localhost:5173/"),
    ("my_documents_vault", "http://localhost:5173/my-documents"),
    ("drafting_studio", "http://localhost:5173/drafting-studio"),
    ("stamp_paper_verification", "http://localhost:5173/stamp-paper-verification"),
    ("client_profile", "http://localhost:5173/profile"),
    ("advocate_connect", "http://localhost:5173/advocate-directory")
]

def capture():
    tmp_user_data = os.path.join(os.environ.get("TEMP", "C:\\temp"), "chrome_lex_shots")
    if os.path.exists(tmp_user_data):
        try: shutil.rmtree(tmp_user_data, ignore_errors=True)
        except: pass

    for name, url in PAGES:
        output_png = os.path.join(ARTIFACT_DIR, f"{name}.png")
        cmd = [
            CHROME_PATH,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            f"--user-data-dir={tmp_user_data}_{name}",
            "--window-size=1440,1024",
            f"--screenshot={output_png}",
            "--virtual-time-budget=4000",
            url
        ]
        print(f"Capturing {name} from {url}...")
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=20)
            if os.path.exists(output_png):
                print(f"[OK] Saved {output_png} ({os.path.getsize(output_png)} bytes)")
            else:
                print(f"[FAIL] Could not capture {name}")
        except Exception as e:
            print(f"[ERROR] {e}")

if __name__ == "__main__":
    capture()

