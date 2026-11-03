import hashlib
import hmac
import base64
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Secure SHA-256 salted hash for credentials."""
    salt = "lexadvisor_salt_secure_2026"
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": int(expire.timestamp())})
    header = {"alg": "HS256", "typ": "JWT"}
    
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    
    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{message}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        message = f"{header_b64}.{payload_b64}"
        expected_sig = base64.urlsafe_b64encode(
            hmac.new(settings.SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        
        if not hmac.compare_digest(sig_b64, expected_sig):
            return None
            
        # Add padding back if necessary
        payload_json = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4)).decode()
        payload = json.loads(payload_json)
        
        if "exp" in payload and payload["exp"] < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None
