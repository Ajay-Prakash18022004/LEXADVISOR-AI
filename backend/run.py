import os
import sys
from pathlib import Path
import uvicorn

# Add backend directory to sys.path so 'app' imports resolve cleanly
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    print("=" * 65)
    print("  LexAdvisor AI - Indian Legal Decision Support System")
    print("  Serving Application & API at: http://127.0.0.1:8000")
    print("  Interactive Swagger Docs at:   http://127.0.0.1:8000/docs")
    print("=" * 65)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
