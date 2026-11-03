import os
import subprocess
import time
import shutil
from pathlib import Path

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:5173"
OUT_DIR = Path(r"C:\Users\prem\OneDrive\Desktop\LexAdvisor-AI\screenshots")
ARTIFACT_DIR = Path(r"C:\Users\prem\.gemini\antigravity\brain\a5db483c-9ed0-4d3f-a962-dabf9db6f4ff")

OUT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

SCREENS = [
    ("01_master_dashboard.png", f"{BASE_URL}/"),
    ("02_document_analysis.png", f"{BASE_URL}/document-analysis"),
    ("03_clause_risk_analyzer.png", f"{BASE_URL}/clause-risk-analyzer"),
    ("04_stamp_duty_auditor.png", f"{BASE_URL}/stamp-duty-auditor"),
    ("05_legal_action_roadmap.png", f"{BASE_URL}/legal-action-roadmap"),
    ("06_rent_deadline_management.png", f"{BASE_URL}/rent-and-deadlines"),
    ("07_advocate_directory.png", f"{BASE_URL}/advocate-directory"),
    ("08_ai_legal_counsel.png", f"{BASE_URL}/ai-legal-counsel"),
]

def capture(idx, filename, url, width=1440, height=900):
    dest_path = OUT_DIR / filename
    art_path = ARTIFACT_DIR / filename
    temp_profile = Path(r"C:\Users\prem\AppData\Local\Temp") / f"ch_prof_{idx}_{int(time.time())}"
    temp_profile.mkdir(parents=True, exist_ok=True)

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        f"--user-data-dir={str(temp_profile)}",
        f"--window-size={width},{height}",
        f"--screenshot={str(dest_path)}",
        url
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        # Clean up temp profile
        shutil.rmtree(temp_profile, ignore_errors=True)
        if dest_path.exists() and dest_path.stat().st_size > 1000:
            with open(dest_path, "rb") as rf, open(art_path, "wb") as wf:
                wf.write(rf.read())
            print(f"[SUCCESS] {filename} ({dest_path.stat().st_size:,} bytes) from {url}")
            return True
        else:
            print(f"[FAIL] {filename} (stdout: {proc.stdout.strip()} stderr: {proc.stderr.strip()})")
            return False
    except Exception as e:
        shutil.rmtree(temp_profile, ignore_errors=True)
        print(f"[ERROR] {filename}: {e}")
        return False

def main():
    print("--- Capturing Remaining Main Screen Desktop Screenshots ---")
    results = {}
    for idx, (filename, url) in enumerate(SCREENS):
        results[filename] = capture(idx, filename, url, 1440, 900)
        time.sleep(1)

    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    print(f"\nCompleted: {success_count}/{total_count} main screen screenshots verified on disk.")

if __name__ == "__main__":
    main()
