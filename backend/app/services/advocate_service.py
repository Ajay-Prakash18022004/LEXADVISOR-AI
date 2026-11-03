import json
import math
from typing import List, Optional
from app.core.config import settings
from app.schemas.advocate import AdvocateResponse

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in kilometers between two GPS coordinates."""
    r = 6371.0 # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)

def search_advocates(
    city: Optional[str] = None,
    state: Optional[str] = None,
    specialization: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    max_distance_km: Optional[float] = None
) -> List[AdvocateResponse]:
    """
    Searches advocate database with optional geographic distance ranking.
    """
    if not settings.ADVOCATES_SEED_PATH.exists():
        return []

    with open(settings.ADVOCATES_SEED_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for item in data:
        # Filter state
        if state and state.upper() in ["TS", "TELANGANA"]:
            if item["state"].lower() != "telangana":
                continue
        elif state and state.upper() in ["AP", "ANDHRA PRADESH"]:
            if item["state"].lower() != "andhra pradesh":
                continue

        # Filter city
        if city and city.lower() not in item["city"].lower():
            continue

        # Filter specialization
        if specialization and specialization.lower() not in item["specialization"].lower():
            continue

        dist = None
        if lat is not None and lng is not None:
            dist = haversine_km(lat, lng, item["lat"], item["lng"])
            if max_distance_km and dist > max_distance_km:
                continue

        advocate_dict = dict(item)
        advocate_dict["distance_km"] = dist
        advocate_dict["image_url"] = item.get("image_url") or item.get("avatar_url")
        advocate_dict["avatar_url"] = item.get("avatar_url") or item.get("image_url")
        results.append(AdvocateResponse(**advocate_dict))

    # Sort by distance if GPS provided, else by rating
    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999)
    else:
        results.sort(key=lambda x: x.rating, reverse=True)

    return results
