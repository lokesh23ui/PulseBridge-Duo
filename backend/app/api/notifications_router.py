from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.connection import get_db
from backend.app.models.entities import User, Notification, utc_now
from backend.app.schemas.notifications import NotificationResponse, NotificationCountResponse
from backend.app.core.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(limit).all()

    results = []
    for n in notifs:
        patient = db.query(User).filter(User.id == n.patient_id).first()
        results.append(NotificationResponse(
            id=n.id,
            recipient_user_id=n.recipient_user_id,
            patient_id=n.patient_id,
            patient_name=patient.full_name if patient else "Patient",
            title=n.title,
            message=n.message,
            severity=n.severity,
            parameter=n.parameter,
            value=n.value,
            unit=n.unit,
            alert_id=n.alert_id,
            is_read=n.is_read,
            read_at=n.read_at,
            created_at=n.created_at
        ))
    return results

@router.get("/unread-count", response_model=NotificationCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    unread = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).count()
    total = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id
    ).count()
    return NotificationCountResponse(unread_count=unread, total_count=total)

@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_read(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.recipient_user_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    notif.read_at = utc_now()
    db.commit()
    db.refresh(notif)

    patient = db.query(User).filter(User.id == notif.patient_id).first()
    return NotificationResponse(
        id=notif.id,
        recipient_user_id=notif.recipient_user_id,
        patient_id=notif.patient_id,
        patient_name=patient.full_name if patient else "Patient",
        title=notif.title,
        message=notif.message,
        severity=notif.severity,
        parameter=notif.parameter,
        value=notif.value,
        unit=notif.unit,
        alert_id=notif.alert_id,
        is_read=notif.is_read,
        read_at=notif.read_at,
        created_at=notif.created_at
    )

@router.post("/read-all")
@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True, "read_at": utc_now()})
    db.commit()
    return {"message": "All notifications marked as read"}
