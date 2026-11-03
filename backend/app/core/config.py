import os
from pathlib import Path
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Explicitly load backend/.env into environment
env_file_path = BASE_DIR / ".env"
if env_file_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file_path, override=True)
    except ImportError:
        with open(env_file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")

class Settings(BaseSettings):
    PROJECT_NAME: str = "LexAdvisor AI - Indian Legal Decision Support System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET", "super-secret-lexadvisor-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Storage Paths
    BASE_DIR: Path = BASE_DIR
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    GENERATED_PDF_DIR: Path = BASE_DIR / "storage" / "generated_pdfs"
    CHROMA_PATH: Path = BASE_DIR / "storage" / "chroma_db"
    SQLITE_URL: str = os.getenv("SQLITE_URL", f"sqlite:///{BASE_DIR}/storage/legal_ai.db")
    
    # LLM Settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")

    # Email & SMTP Settings
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    CONSULTATION_NOTIFICATION_EMAIL: str = os.getenv("CONSULTATION_NOTIFICATION_EMAIL", "sureshtakur194@gmail.com")

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/login")

    # State Stamp Rules Path
    STAMP_RULES_PATH: Path = BASE_DIR / "app" / "data" / "stamp_rules.json"
    CLAUSE_CHECKLIST_PATH: Path = BASE_DIR / "app" / "data" / "clause_checklist.json"
    ADVOCATES_SEED_PATH: Path = BASE_DIR / "app" / "data" / "advocates_seed.json"
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "allow"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.GENERATED_PDF_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PATH, exist_ok=True)
