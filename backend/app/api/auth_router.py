import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.entities import User, PatientProfile, CaregiverProfile, SystemConfig
from backend.app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from backend.app.core.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if public registration is enabled
    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == "app_settings").first()
    allow_reg = True
    if cfg and isinstance(cfg.config_value, dict) and "allow_public_registration" in cfg.config_value:
        allow_reg = bool(cfg.config_value["allow_public_registration"])
    elif os.getenv("ALLOW_PUBLIC_REGISTRATION", "true").lower() in ("false", "0", "no"):
        allow_reg = False

    if not allow_reg:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is currently disabled by system administrator."
        )

    # Check if email already registered
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Create user
    user = User(
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        full_name=req.full_name.strip(),
        role=req.role,
        status="active",
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create role profile
    if req.role == "patient":
        profile = PatientProfile(
            user_id=user.id,
            age=req.age,
            emergency_contact_name=req.emergency_contact_name,
            emergency_contact_phone=req.emergency_contact_phone,
            blood_type=req.blood_type,
            medical_conditions=req.medical_conditions
        )
        db.add(profile)
    elif req.role == "caregiver":
        profile = CaregiverProfile(
            user_id=user.id,
            relationship_type=req.relationship_type or "Family Member",
            phone_number=req.phone_number
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if hasattr(user, "is_active") and not user.is_active or hasattr(user, "status") and user.status in ("suspended", "deactivated"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account has been {user.status or 'deactivated'}. Please contact your system administrator."
        )

    token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserResponse)
def get_authenticated_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout_user(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
