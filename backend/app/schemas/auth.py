from pydantic import BaseModel
from typing import Optional, List

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "client" # "client" or "advocate"
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    # Advocate specific fields
    bar_council_id: Optional[str] = None
    state_bar_council: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = 5
    address: Optional[str] = None
    consultation_fee: Optional[float] = 1500.0
    languages_spoken: Optional[str] = "English, Hindi, Telugu"

class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None # Optional role check

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    role: str = "client"
    advocate_id: Optional[int] = None
    verification_status: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: Optional[str] = "client"
    city: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = "English"
    advocate_id: Optional[int] = None
    verification_status: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None

class AdvocateProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    address: Optional[str] = None
    languages_spoken: Optional[str] = None
    available_days: Optional[str] = None
    available_time_slots: Optional[str] = None
    consultation_modes: Optional[str] = None
    slot_duration_mins: Optional[int] = None

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = "sureshtakur194@gmail.com"
    name: Optional[str] = "Suresh Thakur"
    role: Optional[str] = "client"
    avatar: Optional[str] = None
