from pydantic import BaseModel
from typing import Optional, List

class AdvocateResponse(BaseModel):
    id: int
    name: str
    bar_council_id: Optional[str] = None
    specialization: str
    city: str
    area: Optional[str] = None
    state: str
    lat: float
    lng: float
    phone: Optional[str] = None
    email: Optional[str] = None
    experience_years: int
    rating: float
    consultation_fee: float
    address: Optional[str] = None
    verification_status: Optional[str] = "verified"
    languages_spoken: Optional[str] = "English, Telugu, Hindi"
    available_days: Optional[str] = "Monday,Tuesday,Wednesday,Thursday,Friday"
    available_time_slots: Optional[str] = None
    consultation_modes: Optional[str] = "In-Chamber, Phone Consultation, Video Call"
    distance_km: Optional[float] = None
    avatar_url: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class AdvocateSearchFilter(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    specialization: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    max_distance_km: Optional[float] = 50.0
