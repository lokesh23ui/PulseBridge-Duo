from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.connection import get_db
from backend.app.models.entities import User, AlertRule, HealthAlert, utc_now, AuditLog
from backend.app.schemas.alert_rules import AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse
from backend.app.schemas.telemetry import HealthAlertResponse, AlertAcknowledgeResponse
from backend.app.core.auth import get_current_user
from backend.app.services.family_service import verify_caregiver_access
from backend.app.api.patients_router import resolve_patient_user_id
from backend.app.api.websocket import manager

router = APIRouter(tags=["Personalized Alert Management"])

# 1. Get alert rules for a patient
@router.get("/patients/{patient_id}/alert-rules", response_model=List[AlertRuleResponse])
def get_patient_alert_rules(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = resolve_patient_user_id(db, patient_id)
    if current_user.role == "caregiver":
        verify_caregiver_access(db, caregiver_id=current_user.id, patient_id=pid)
    elif current_user.id != pid:
        raise HTTPException(status_code=403, detail="Not authorized for this patient")

    rules = db.query(AlertRule).filter(AlertRule.patient_id == pid).order_by(AlertRule.created_at.desc()).all()
    results = []
    for r in rules:
        creator = db.query(User).filter(User.id == r.created_by_user_id).first()
        results.append(AlertRuleResponse(
            id=r.id,
            patient_id=r.patient_id,
            created_by_user_id=r.created_by_user_id,
            created_by_name=creator.full_name if creator else "System",
            parameter=r.parameter,
            condition=r.condition,
            threshold=r.threshold,
            lower_limit=r.lower_limit,
            upper_limit=r.upper_limit,
            severity=r.severity,
            persistence_seconds=r.persistence_seconds,
            cooldown_seconds=r.cooldown_seconds,
            enabled=r.enabled,
            last_triggered_at=r.last_triggered_at,
            created_at=r.created_at
        ))
    return results

# 2. Create alert rule for a patient
@router.post("/patients/{patient_id}/alert-rules", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
def create_patient_alert_rule(
    patient_id: int,
    req: AlertRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pid = resolve_patient_user_id(db, patient_id)
    # Authorization & Permission check
    if current_user.role == "caregiver":
        verify_caregiver_access(
            db, 
            caregiver_id=current_user.id, 
            patient_id=pid, 
            required_permission="create_manage_alert_rules"
        )
    elif current_user.id != pid:
        raise HTTPException(status_code=403, detail="Not authorized to configure rules for this patient")

    rule = AlertRule(
        patient_id=pid,
        created_by_user_id=current_user.id,
        parameter=req.parameter,
        condition=req.condition,
        threshold=req.threshold,
        lower_limit=req.lower_limit,
        upper_limit=req.upper_limit,
        severity=req.severity,
        persistence_seconds=req.persistence_seconds,
        cooldown_seconds=req.cooldown_seconds,
        enabled=req.enabled
    )
    db.add(rule)
    db.add(AuditLog(
        actor_user_id=current_user.id,
        target_patient_id=pid,
        action="ALERT_RULE_CREATED",
        details=req.model_dump()
    ))
    db.commit()
    db.refresh(rule)

    return AlertRuleResponse(
        id=rule.id,
        patient_id=rule.patient_id,
        created_by_user_id=rule.created_by_user_id,
        created_by_name=current_user.full_name,
        parameter=rule.parameter,
        condition=rule.condition,
        threshold=rule.threshold,
        lower_limit=rule.lower_limit,
        upper_limit=rule.upper_limit,
        severity=rule.severity,
        persistence_seconds=rule.persistence_seconds,
        cooldown_seconds=rule.cooldown_seconds,
        enabled=rule.enabled,
        last_triggered_at=rule.last_triggered_at,
        created_at=rule.created_at
    )

# 3. Update alert rule
@router.put("/alerts/rules/{id}", response_model=AlertRuleResponse)
def update_alert_rule(
    id: int,
    req: AlertRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(AlertRule).filter(AlertRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")

    # Patient can edit any rule on their profile; Caregiver must have permission
    if current_user.role == "caregiver":
        verify_caregiver_access(
            db, 
            caregiver_id=current_user.id, 
            patient_id=rule.patient_id, 
            required_permission="create_manage_alert_rules"
        )
    elif current_user.id != rule.patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this rule")

    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(rule, field, val)

    db.add(AuditLog(
        actor_user_id=current_user.id,
        target_patient_id=rule.patient_id,
        action="ALERT_RULE_UPDATED",
        details=req.model_dump(exclude_unset=True)
    ))
    db.commit()
    db.refresh(rule)

    creator = db.query(User).filter(User.id == rule.created_by_user_id).first()
    return AlertRuleResponse(
        id=rule.id,
        patient_id=rule.patient_id,
        created_by_user_id=rule.created_by_user_id,
        created_by_name=creator.full_name if creator else "System",
        parameter=rule.parameter,
        condition=rule.condition,
        threshold=rule.threshold,
        lower_limit=rule.lower_limit,
        upper_limit=rule.upper_limit,
        severity=rule.severity,
        persistence_seconds=rule.persistence_seconds,
        cooldown_seconds=rule.cooldown_seconds,
        enabled=rule.enabled,
        last_triggered_at=rule.last_triggered_at,
        created_at=rule.created_at
    )

# 4. Delete alert rule
@router.delete("/alerts/rules/{id}")
def delete_alert_rule(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(AlertRule).filter(AlertRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")

    if current_user.role == "caregiver":
        verify_caregiver_access(
            db, 
            caregiver_id=current_user.id, 
            patient_id=rule.patient_id, 
            required_permission="create_manage_alert_rules"
        )
    elif current_user.id != rule.patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this rule")

    db.add(AuditLog(
        actor_user_id=current_user.id,
        target_patient_id=rule.patient_id,
        action="ALERT_RULE_DELETED",
        details={"rule_id": id, "parameter": rule.parameter}
    ))
    db.delete(rule)
    db.commit()
    return {"message": "Alert rule deleted successfully"}

# 5. Get alerts for patient
@router.get("/patients/{patient_id}/alerts", response_model=List[HealthAlertResponse])
def get_patient_alerts(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "caregiver":
        verify_caregiver_access(db, caregiver_id=current_user.id, patient_id=patient_id)
    elif current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized for this patient")

    alerts = db.query(HealthAlert).filter(
        (HealthAlert.patient_id == patient_id) | (HealthAlert.patient_id.is_(None))
    ).order_by(desc(HealthAlert.timestamp)).limit(50).all()
    return alerts
