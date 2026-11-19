from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.entities import (
    User, CaregiverInvitation, PatientCaregiverRelationship, 
    AccessPermission, AuditLog, utc_now
)
from backend.app.schemas.family import (
    InvitationResponse, RedeemInvitationRequest, 
    RelationshipResponse, AccessPermissionSchema, ApproveRequestPayload
)
from backend.app.core.auth import get_current_user, require_patient, require_caregiver
from backend.app.services.family_service import (
    create_invitation, redeem_invitation, approve_relationship, 
    reject_relationship, revoke_relationship
)

router = APIRouter(prefix="/family", tags=["Family Care Connections"])

# 1. Patient creates caregiver invitation
@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def post_invitation(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    invitation = create_invitation(db, current_user, expiry_hours=48)
    return invitation

# 2. Patient lists their active invitations
@router.get("/invitations", response_model=List[InvitationResponse])
def get_invitations(
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    invitations = db.query(CaregiverInvitation).filter(
        CaregiverInvitation.patient_id == current_user.id
    ).order_by(CaregiverInvitation.created_at.desc()).all()
    return invitations

# 3. Caregiver redeems invitation code
@router.post("/invitations/redeem", response_model=RelationshipResponse)
@router.post("/redeem", response_model=RelationshipResponse)
def post_redeem(
    req: RedeemInvitationRequest,
    current_user: User = Depends(require_caregiver),
    db: Session = Depends(get_db)
):
    rel = redeem_invitation(
        db=db, 
        caregiver=current_user, 
        code=req.invitation_code, 
        relationship_label=req.relationship_label or "Caregiver"
    )
    
    patient = db.query(User).filter(User.id == rel.patient_id).first()
    return RelationshipResponse(
        id=rel.id,
        patient_id=rel.patient_id,
        patient_name=patient.full_name if patient else "Patient",
        patient_email=patient.email if patient else "",
        caregiver_id=rel.caregiver_id,
        caregiver_name=current_user.full_name,
        caregiver_email=current_user.email,
        relationship_label=rel.relationship_label,
        status=rel.status,
        created_at=rel.created_at,
        approved_at=rel.approved_at,
        revoked_at=rel.revoked_at,
        permissions=AccessPermissionSchema.model_validate(rel.permissions) if rel.permissions else None
    )

# 4. List family relationships for authenticated user
@router.get("/relationships", response_model=List[RelationshipResponse])
def list_relationships(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        rels = db.query(PatientCaregiverRelationship).filter(
            PatientCaregiverRelationship.patient_id == current_user.id
        ).order_by(PatientCaregiverRelationship.created_at.desc()).all()
    else:
        rels = db.query(PatientCaregiverRelationship).filter(
            PatientCaregiverRelationship.caregiver_id == current_user.id
        ).order_by(PatientCaregiverRelationship.created_at.desc()).all()

    results = []
    for r in rels:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        caregiver = db.query(User).filter(User.id == r.caregiver_id).first()
        results.append(RelationshipResponse(
            id=r.id,
            patient_id=r.patient_id,
            patient_name=patient.full_name if patient else "Patient",
            patient_email=patient.email if patient else "",
            caregiver_id=r.caregiver_id,
            caregiver_name=caregiver.full_name if caregiver else "Caregiver",
            caregiver_email=caregiver.email if caregiver else "",
            relationship_label=r.relationship_label,
            status=r.status,
            created_at=r.created_at,
            approved_at=r.approved_at,
            revoked_at=r.revoked_at,
            permissions=AccessPermissionSchema.model_validate(r.permissions) if r.permissions else None
        ))
    return results

# 5. Patient approves request
@router.post("/requests/{id}/approve", response_model=RelationshipResponse)
def approve_request_endpoint(
    id: int,
    payload: Optional[ApproveRequestPayload] = None,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    perms: Optional[AccessPermissionSchema] = None
    if payload:
        if payload.permissions:
            perms = payload.permissions
        else:
            try:
                perms = AccessPermissionSchema.model_validate(payload.model_dump())
            except Exception:
                pass

    rel = approve_relationship(db, current_user, id, perms)
    patient = current_user
    caregiver = db.query(User).filter(User.id == rel.caregiver_id).first()
    return RelationshipResponse(
        id=rel.id,
        patient_id=rel.patient_id,
        patient_name=patient.full_name,
        patient_email=patient.email,
        caregiver_id=rel.caregiver_id,
        caregiver_name=caregiver.full_name if caregiver else "Caregiver",
        caregiver_email=caregiver.email if caregiver else "",
        relationship_label=rel.relationship_label,
        status=rel.status,
        created_at=rel.created_at,
        approved_at=rel.approved_at,
        revoked_at=rel.revoked_at,
        permissions=AccessPermissionSchema.model_validate(rel.permissions) if rel.permissions else None
    )

# 6. Patient rejects request
@router.post("/requests/{id}/reject")
def reject_request_endpoint(
    id: int,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    reject_relationship(db, current_user, id)
    return {"message": "Caregiver request rejected"}

# 7. Patient updates permissions
@router.put("/relationships/{id}/permissions", response_model=AccessPermissionSchema)
def update_permissions_endpoint(
    id: int,
    perms: AccessPermissionSchema,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db)
):
    rel = db.query(PatientCaregiverRelationship).filter(
        PatientCaregiverRelationship.id == id,
        PatientCaregiverRelationship.patient_id == current_user.id
    ).first()

    if not rel:
        raise HTTPException(status_code=404, detail="Relationship not found")

    if not rel.permissions:
        rel.permissions = AccessPermission(relationship_id=rel.id)
        db.add(rel.permissions)

    rel.permissions.view_live_readings = perms.view_live_readings
    rel.permissions.view_historical_readings = perms.view_historical_readings
    rel.permissions.view_medical_reports = perms.view_medical_reports
    rel.permissions.view_health_trends = perms.view_health_trends
    rel.permissions.create_manage_alert_rules = perms.create_manage_alert_rules
    rel.permissions.acknowledge_alerts = perms.acknowledge_alerts
    rel.permissions.view_device_status = perms.view_device_status
    rel.permissions.updated_at = utc_now()

    db.add(AuditLog(
        actor_user_id=current_user.id,
        target_patient_id=current_user.id,
        action="PERMISSIONS_UPDATED",
        details=perms.model_dump()
    ))
    db.commit()
    db.refresh(rel.permissions)
    return AccessPermissionSchema.model_validate(rel.permissions)

# 8. Patient or Caregiver revokes relationship
@router.delete("/relationships/{id}")
def revoke_relationship_endpoint(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    revoke_relationship(db, current_user, id)
    return {"message": "Relationship successfully revoked"}
