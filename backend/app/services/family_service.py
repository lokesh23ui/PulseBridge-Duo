import secrets
import string
import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.entities import (
    User, CaregiverInvitation, PatientCaregiverRelationship, 
    AccessPermission, AuditLog, utc_now
)
from backend.app.schemas.family import AccessPermissionSchema

def generate_invitation_code() -> str:
    """Generates a random human-friendly invitation code e.g. PBD-7K92-AX51"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"PBD-{part1}-{part2}"

def create_invitation(db: Session, patient: User, expiry_hours: int = 48) -> CaregiverInvitation:
    """Creates a new secure single-use caregiver invitation."""
    if patient.role != "patient":
        raise HTTPException(status_code=400, detail="Only patients can generate caregiver invitations")

    code = generate_invitation_code()
    # Ensure unique
    while db.query(CaregiverInvitation).filter(CaregiverInvitation.invitation_code == code).first():
        code = generate_invitation_code()

    token_hash = secrets.token_hex(16)
    expires_at = utc_now() + datetime.timedelta(hours=expiry_hours)

    invitation = CaregiverInvitation(
        patient_id=patient.id,
        invitation_code=code,
        invitation_token_hash=token_hash,
        expires_at=expires_at,
        status="active"
    )
    db.add(invitation)
    
    # Audit log
    audit = AuditLog(
        actor_user_id=patient.id,
        target_patient_id=patient.id,
        action="INVITATION_CREATED",
        details={"invitation_code": code, "expires_at": expires_at.isoformat()}
    )
    db.add(audit)
    db.commit()
    db.refresh(invitation)
    return invitation

def redeem_invitation(
    db: Session, 
    caregiver: User, 
    code: str, 
    relationship_label: str = "Caregiver"
) -> PatientCaregiverRelationship:
    """Redeems an invitation code and creates a pending relationship."""
    if caregiver.role != "caregiver":
        raise HTTPException(status_code=400, detail="Only caregivers can redeem invitations")

    inv = db.query(CaregiverInvitation).filter(
        CaregiverInvitation.invitation_code == code.strip().upper(),
        CaregiverInvitation.status == "active"
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invalid or inactive invitation code")

    if inv.expires_at < utc_now():
        inv.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation code has expired")

    if inv.patient_id == caregiver.id:
        raise HTTPException(status_code=400, detail="You cannot connect to yourself as a caregiver")

    # Check if relationship already exists
    existing = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.patient_id == inv.patient_id,
        PatientCaregiverRelationship.caregiver_id == caregiver.id
    ).first()

    if existing and existing.status == "active":
        raise HTTPException(status_code=400, detail="You are already connected to this patient")

    if existing and existing.status == "pending_approval":
        raise HTTPException(status_code=400, detail="Access request is already pending patient approval")

    # Mark invitation used
    inv.status = "used"
    inv.used_at = utc_now()

    # Create relationship in pending status
    rel = PatientCaregiverRelationship(
        patient_id=inv.patient_id,
        caregiver_id=caregiver.id,
        relationship_label=relationship_label,
        status="pending_approval"
    )
    db.add(rel)
    db.flush()

    # Create default access permission record
    perm = AccessPermission(
        relationship_id=rel.id,
        view_live_readings=True,
        view_historical_readings=True,
        view_medical_reports=False,
        view_health_trends=True,
        create_manage_alert_rules=False,
        acknowledge_alerts=True,
        view_device_status=True
    )
    db.add(perm)

    audit = AuditLog(
        actor_user_id=caregiver.id,
        target_patient_id=inv.patient_id,
        action="INVITATION_REDEEMED",
        details={"relationship_id": rel.id, "label": relationship_label}
    )
    db.add(audit)
    db.commit()
    db.refresh(rel)
    return rel

def approve_relationship(
    db: Session, 
    patient: User, 
    relationship_id: int, 
    permissions: Optional[AccessPermissionSchema] = None
) -> PatientCaregiverRelationship:
    """Patient explicitly approves a caregiver connection and sets permissions."""
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.id == relationship_id,
        PatientCaregiverRelationship.patient_id == patient.id
    ).first()

    if not rel:
        raise HTTPException(status_code=404, detail="Relationship request not found")

    if rel.status != "pending_approval":
        raise HTTPException(status_code=400, detail=f"Cannot approve request with status '{rel.status}'")

    rel.status = "active"
    rel.approved_at = utc_now()

    if permissions and rel.permissions:
        rel.permissions.view_live_readings = permissions.view_live_readings
        rel.permissions.view_historical_readings = permissions.view_historical_readings
        rel.permissions.view_medical_reports = permissions.view_medical_reports
        rel.permissions.view_health_trends = permissions.view_health_trends
        rel.permissions.create_manage_alert_rules = permissions.create_manage_alert_rules
        rel.permissions.acknowledge_alerts = permissions.acknowledge_alerts
        rel.permissions.view_device_status = permissions.view_device_status
        rel.permissions.updated_at = utc_now()

    audit = AuditLog(
        actor_user_id=patient.id,
        target_patient_id=patient.id,
        action="ACCESS_APPROVED",
        details={"caregiver_id": rel.caregiver_id, "relationship_id": rel.id}
    )
    db.add(audit)
    db.commit()
    db.refresh(rel)
    return rel

def reject_relationship(db: Session, patient: User, relationship_id: int):
    """Patient rejects a pending connection request."""
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.id == relationship_id,
        PatientCaregiverRelationship.patient_id == patient.id
    ).first()

    if not rel:
        raise HTTPException(status_code=404, detail="Relationship request not found")

    rel.status = "rejected"
    audit = AuditLog(
        actor_user_id=patient.id,
        target_patient_id=patient.id,
        action="ACCESS_REJECTED",
        details={"caregiver_id": rel.caregiver_id}
    )
    db.add(audit)
    db.commit()
    return rel

def revoke_relationship(db: Session, user: User, relationship_id: int):
    """Revokes a connection immediately. Accessible by patient or caregiver."""
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.id == relationship_id
    ).first()

    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")

    if rel.patient_id != user.id and rel.caregiver_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this relationship")

    rel.status = "revoked"
    rel.revoked_at = utc_now()

    audit = AuditLog(
        actor_user_id=user.id,
        target_patient_id=rel.patient_id,
        action="ACCESS_REVOKED",
        details={"revoked_by_role": user.role, "relationship_id": rel.id}
    )
    db.add(audit)
    db.commit()
    return rel

def verify_caregiver_access(
    db: Session, 
    caregiver_id: int, 
    patient_id: int, 
    required_permission: Optional[str] = None
) -> PatientCaregiverRelationship:
    """
    Mandatory security check: Ensures caregiver has active, non-revoked connection
    to patient and possesses the required permission. Raises 403 on violation.
    """
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.caregiver_id == caregiver_id,
        PatientCaregiverRelationship.patient_id == patient_id,
        PatientCaregiverRelationship.status == "active"
    ).first()

    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: No active relationship with this patient"
        )

    if required_permission:
        if not rel.permissions or not getattr(rel.permissions, required_permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Patient has not granted '{required_permission}' permission"
            )

    return rel
