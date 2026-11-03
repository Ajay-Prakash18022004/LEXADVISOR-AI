from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
    GoogleAuthRequest,
    UserProfileUpdate,
    AdvocateProfileUpdate
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user, require_advocate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_role = (user_in.role or "client").lower()
    if user_role not in ["client", "advocate"]:
        user_role = "client"

    new_user = models.User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        phone=user_in.phone,
        city=user_in.city or "Hyderabad",
        state=user_in.state or "Telangana",
        role=user_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    advocate_id = None
    verification_status = None

    if user_role == "advocate":
        # Create an advocate profile with strictly PENDING verification
        advocate = models.Advocate(
            user_id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            phone=user_in.phone or "+91 98490 00000",
            bar_council_id=user_in.bar_council_id or "TS/BC/PENDING",
            state_bar_council=user_in.state_bar_council or "Bar Council of Telangana",
            specialization=user_in.specialization or "Civil, Property & Commercial Law",
            experience_years=user_in.experience_years or 5,
            consultation_fee=user_in.consultation_fee or 1500.0,
            address=user_in.address or "High Court Road, Hyderabad",
            city=user_in.city or "Hyderabad",
            state=user_in.state or "Telangana",
            lat=17.3660,
            lng=78.4760,
            verification_status="pending", # Strictly pending upon new registration
            bio="Practicing legal advocate specializing in client advisory and document litigation.",
            languages_spoken=user_in.languages_spoken or "English, Hindi, Telugu"
        )
        db.add(advocate)
        db.commit()
        db.refresh(advocate)
        advocate_id = advocate.id
        verification_status = advocate.verification_status

    token = create_access_token({
        "sub": str(new_user.id),
        "user_id": new_user.id,
        "email": new_user.email,
        "role": user_role
    })

    return TokenResponse(
        access_token=token,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=user_role,
        advocate_id=advocate_id,
        verification_status=verification_status
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    email = login_data.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # If login form specified a required role (e.g. advocate login vs client login), check role
    if login_data.role and user.role != login_data.role:
        if login_data.role == "advocate":
            raise HTTPException(status_code=403, detail="This account is registered as a Client. Please use the Client Login.")
        elif login_data.role == "client":
            raise HTTPException(status_code=403, detail="This account is registered as an Advocate. Please use the Advocate Login.")

    advocate_id = None
    verification_status = None
    if user.role == "advocate":
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()
        if adv:
            advocate_id = adv.id
            verification_status = adv.verification_status
            if not adv.user_id:
                adv.user_id = user.id
                db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    })

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        advocate_id=advocate_id,
        verification_status=verification_status
    )

@router.post("/google", response_model=TokenResponse)
def google_auth(google_in: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or auto-register via Google Account.
    Respects selected role (client or advocate).
    """
    email = (google_in.email or "sureshtakur194@gmail.com").strip().lower()
    name = (google_in.name or "Suresh Thakur").strip()
    target_role = (google_in.role or "client").lower()

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        user = models.User(
            name=name,
            email=email,
            role=target_role,
            hashed_password=get_password_hash("GoogleAuthPass@2026")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if target_role == "advocate":
            adv = models.Advocate(
                user_id=user.id,
                name=user.name,
                email=user.email,
                phone="+91 98490 11223",
                bar_council_id="TS/BC/PENDING",
                specialization="Civil & Property Law",
                verification_status="pending", # Initial Google signup as advocate starts pending
                city="Hyderabad",
                state="Telangana",
                lat=17.3850,
                lng=78.4867
            )
            db.add(adv)
            db.commit()

    advocate_id = None
    verification_status = None
    if user.role == "advocate":
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()
        if adv:
            advocate_id = adv.id
            verification_status = adv.verification_status

    token = create_access_token({
        "sub": str(user.id),
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    })

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        advocate_id=advocate_id,
        verification_status=verification_status
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    advocate_id = None
    verification_status = None
    if user.role == "advocate":
        adv = db.query(models.Advocate).filter(
            (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
        ).first()
        if adv:
            advocate_id = adv.id
            verification_status = adv.verification_status

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        city=user.city,
        state=user.state,
        preferred_language=user.preferred_language,
        advocate_id=advocate_id,
        verification_status=verification_status
    )

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Update profile details for the authenticated user (Client).
    """
    if profile_in.name is not None:
        user.name = profile_in.name
    if profile_in.phone is not None:
        user.phone = profile_in.phone
    if profile_in.city is not None:
        user.city = profile_in.city
    if profile_in.state is not None:
        user.state = profile_in.state
    if profile_in.preferred_language is not None:
        user.preferred_language = profile_in.preferred_language

    db.commit()
    db.refresh(user)
    return user

@router.put("/advocate/profile")
def update_advocate_profile(
    profile_in: AdvocateProfileUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_advocate)
):
    """
    Update advocate professional profile.
    Bar council ID and verification status CANNOT be manipulated by the advocate.
    """
    adv = db.query(models.Advocate).filter(
        (models.Advocate.user_id == user.id) | (models.Advocate.email == user.email)
    ).first()

    if not adv:
        raise HTTPException(status_code=404, detail="Advocate profile record not found.")

    if profile_in.name is not None:
        adv.name = profile_in.name
        user.name = profile_in.name
    if profile_in.phone is not None:
        adv.phone = profile_in.phone
        user.phone = profile_in.phone
    if profile_in.specialization is not None:
        adv.specialization = profile_in.specialization
    if profile_in.consultation_fee is not None:
        adv.consultation_fee = profile_in.consultation_fee
    if profile_in.bio is not None:
        adv.bio = profile_in.bio
    if profile_in.address is not None:
        adv.address = profile_in.address
    if profile_in.languages_spoken is not None:
        adv.languages_spoken = profile_in.languages_spoken
    if profile_in.available_days is not None:
        adv.available_days = profile_in.available_days
    if profile_in.available_time_slots is not None:
        adv.available_time_slots = profile_in.available_time_slots
    if profile_in.consultation_modes is not None:
        adv.consultation_modes = profile_in.consultation_modes
    if profile_in.slot_duration_mins is not None:
        adv.slot_duration_mins = profile_in.slot_duration_mins

    db.commit()
    db.refresh(adv)
    db.refresh(user)

    return {
        "status": "success",
        "message": "Advocate profile updated successfully",
        "advocate": {
            "id": adv.id,
            "name": adv.name,
            "email": adv.email,
            "phone": adv.phone,
            "bar_council_id": adv.bar_council_id,
            "state_bar_council": adv.state_bar_council,
            "verification_status": adv.verification_status,
            "specialization": adv.specialization,
            "consultation_fee": adv.consultation_fee,
            "bio": adv.bio,
            "address": adv.address,
            "languages_spoken": adv.languages_spoken,
            "available_days": adv.available_days,
            "available_time_slots": adv.available_time_slots,
            "consultation_modes": adv.consultation_modes,
            "slot_duration_mins": adv.slot_duration_mins
        }
    }
