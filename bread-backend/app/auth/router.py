import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from app.database import get_db
from app.models.user import User
from app.auth.service import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    zipcode: Optional[str] = None


class SignInRequest(BaseModel):
    email: str
    password: str


class UpdateMeRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    zipcode: Optional[str] = None
    use_live_location: Optional[bool] = None
    favorite_products: Optional[Any] = None
    household_members: Optional[Any] = None
    household_public: Optional[bool] = None
    connected_accounts: Optional[Any] = None
    preferred_stores: Optional[Any] = None
    signup_onboarding_complete: Optional[bool] = None
    pantry_tutorial_completed: Optional[bool] = None
    subscription_status: Optional[str] = None
    bread_plus_active: Optional[bool] = None
    account_created_at: Optional[str] = None
    pantry_trial_end_date: Optional[str] = None
    following_list: Optional[Any] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    badges: Optional[Any] = None
    is_creator: Optional[bool] = None


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "is_creator": user.is_creator,
        "is_admin": user.is_admin,
        "role": user.role,
        "badges": user.badges or [],
        "followers_count": user.followers_count or 0,
        "following_count": user.following_count or 0,
        "following_list": user.following_list or [],
        "household_members": user.household_members or [],
        "household_public": user.household_public or False,
        "connected_accounts": user.connected_accounts or {},
        "preferred_stores": user.preferred_stores or [],
        "zipcode": user.zipcode,
        "use_live_location": user.use_live_location or False,
        "favorite_products": user.favorite_products or [],
        "subscription_status": user.subscription_status,
        "bread_plus_active": user.bread_plus_active or False,
        "creator_application_status": user.creator_application_status,
        "account_created_at": user.account_created_at.isoformat() if user.account_created_at else None,
        "pantry_trial_end_date": user.pantry_trial_end_date.isoformat() if user.pantry_trial_end_date else None,
        "pantry_tutorial_completed": user.pantry_tutorial_completed or False,
        "signup_onboarding_complete": user.signup_onboarding_complete or False,
        "created_date": user.created_date.isoformat() if user.created_date else None,
    }


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/signup")
def signup(body: SignUpRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        zipcode=body.zipcode,
        account_created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return {"token": token, "user": user_to_dict(user)}


@router.post("/signin")
def signin(body: SignInRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.email)
    return {"token": token, "user": user_to_dict(user)}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.patch("/me")
def update_me(
    body: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = body.model_dump(exclude_none=True)

    # Parse datetime strings back to datetime objects
    for field in ("account_created_at", "pantry_trial_end_date"):
        if field in data and isinstance(data[field], str):
            try:
                data[field] = datetime.fromisoformat(data[field].replace("Z", "+00:00"))
            except ValueError:
                pass

    for key, value in data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return user_to_dict(current_user)


@router.post("/logout")
def logout():
    # JWT is stateless — client drops the token. Nothing to do server-side.
    return {"ok": True}


# ── Password Reset ─────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a password-reset token for the given email.
    In production this would send an email; for now it returns the token
    directly so you can test the full flow immediately.
    """
    user = db.query(User).filter(User.email == body.email.lower()).first()

    # Always return 200 — don't leak whether the email exists.
    if not user:
        return {"ok": True, "message": "If that email is registered, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # TODO: swap this for a real email once SES / SendGrid is configured.
    # For now we return the token in the response so you can test immediately.
    return {
        "ok": True,
        "message": "If that email is registered, a reset link has been sent.",
        "dev_token": token,  # ← remove this line before going fully public
    }


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate the reset token and set a new password."""
    if not body.new_password or len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user = db.query(User).filter(User.password_reset_token == body.token).first()

    if not user or not user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.utcnow() > user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    user.password_hash = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"ok": True, "message": "Password updated successfully."}
