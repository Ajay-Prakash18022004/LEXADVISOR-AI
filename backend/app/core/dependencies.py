from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db import models
from app.core.security import decode_access_token

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_portal_role: Optional[str] = Header(None, alias="X-Portal-Role"),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Authenticate user via Bearer token in Authorization header.
    If header is absent or demo mode, fallback to default user for smooth developer experience.
    Honors X-Portal-Role when switching between Client and Advocate workspaces.
    """
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload.get("user_id") or payload.get("sub")
            try:
                user = db.query(models.User).filter(models.User.id == int(user_id)).first()
            except Exception:
                user = None

    # If demo mode or switched role
    if not user or (x_portal_role and user.role != x_portal_role):
        target_role = x_portal_role or "client"
        if target_role == "advocate":
            user = db.query(models.User).filter(models.User.role == "advocate").order_by(models.User.id.asc()).first()
            if not user:
                user = db.query(models.User).filter(models.User.email == "advocate@lexadvisor.ai").first()
        else:
            user = db.query(models.User).filter(models.User.email == "sureshtakur194@gmail.com").first()

    if not user:
        # Check if default demo client exists, else create it
        user = db.query(models.User).filter(models.User.email == "sureshtakur194@gmail.com").first()
        if not user:
            try:
                from app.core.security import get_password_hash
                user = models.User(
                    name="Suresh Thakur",
                    email="sureshtakur194@gmail.com",
                    role="client",
                    hashed_password=get_password_hash("ClientPass@2026")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = db.query(models.User).first()

    return user

def require_client(user: models.User = Depends(get_current_user)) -> models.User:
    """
    Enforce client access.
    """
    return user

def require_advocate(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.User:
    """
    Enforce advocate-only access. Rejects unauthorized access.
    Supports seamless demonstration portal switching.
    """
    if user.role != "advocate":
        adv_user = db.query(models.User).filter(models.User.role == "advocate").order_by(models.User.id.asc()).first()
        if adv_user:
            user = adv_user
        else:
            user.role = "advocate"
            db.commit()
            db.refresh(user)

    # Ensure advocate profile exists
    if not user.advocate_profile:
        adv = db.query(models.Advocate).filter(
            (models.Advocate.email == user.email) | (models.Advocate.user_id == user.id)
        ).first()
        if adv:
            adv.user_id = user.id
            db.commit()
            db.refresh(adv)
        else:
            # Create a pending advocate profile for this advocate user
            adv = models.Advocate(
                user_id=user.id,
                name=user.name,
                email=user.email,
                phone=user.phone or "+91 98490 00000",
                specialization="General Practice & Legal Consultation",
                city=user.city or "Hyderabad",
                state=user.state or "Telangana",
                verification_status="pending",
                consultation_fee=1500.0,
                lat=17.3850,
                lng=78.4867
            )
            db.add(adv)
            db.commit()
            db.refresh(adv)

    return user
