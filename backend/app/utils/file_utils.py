import os
from pathlib import Path

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()

def is_allowed_file(filename: str) -> bool:
    allowed = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".txt"}
    return get_file_extension(filename) in allowed

def ensure_directory(path: Path):
    os.makedirs(path, exist_ok=True)
