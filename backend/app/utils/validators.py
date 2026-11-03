import re
from typing import Optional

def validate_indian_phone(phone: str) -> bool:
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    return bool(re.match(r'^[6-9]\d{9}$', cleaned))

def validate_stamp_serial(serial: Optional[str]) -> bool:
    if not serial:
        return False
    # Validates e-stamp IN-TS... or IN-AP... or non-judicial standard patterns
    pattern = r'^(IN-(?:TS|AP)[0-9A-Z]{12,18}|[A-Z]{2}[0-9]{6,12}|(?:TS|AP)-[0-9]{4}-[0-9]{6,8})$'
    return bool(re.match(pattern, serial.strip()))
