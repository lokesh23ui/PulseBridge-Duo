from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    role: str = Field(pattern="^(patient|caregiver)$")
    
    # Patient-specific optional fields
    age: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None

    # Caregiver-specific optional fields
    relationship_type: Optional[str] = "Family Member"
    phone_number: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class PatientProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    age: Optional[int] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_type: Optional[str] = None
    medical_conditions: Optional[str] = None

class CaregiverProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    relationship_type: Optional[str] = None
    phone_number: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str
    full_name: str
    created_at: datetime
    patient_profile: Optional[PatientProfileResponse] = None
    caregiver_profile: Optional[CaregiverProfileResponse] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
