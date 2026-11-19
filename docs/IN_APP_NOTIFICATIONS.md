# PulseBridge Duo — In-App Care Notification System

## 1. Overview

PulseBridge Duo features an in-app notification engine designed specifically for connected caregiving. Rather than sending spammy SMS or requiring external messaging subscriptions during testing, notifications are persisted locally in SQLite, broadcast over WebSockets, and surfaced in real-time through an interactive Notification Bell in the application header.

---

## 2. Notification Data Model

Notifications are persisted in the `notifications` table (`backend/app/models/entities.py`):

```python
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO") # INFO, WARNING, CRITICAL
    category = Column(String(50), default="ALERT")
    parameter = Column(String(50), nullable=True)
    value = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    alert_id = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
```

---

## 3. Evaluation Engine & Cooldown Prevention

To prevent notification floods during prolonged abnormal episodes, the Alert Engine (`backend/app/services/alert_engine.py`) enforces a configurable **cooldown period** (default: 300 seconds / 5 minutes) per rule:

```python
# Check rule cooldown
if rule.last_triggered_at:
    elapsed = (utc_now() - rule.last_triggered_at).total_seconds()
    if elapsed < rule.cooldown_seconds:
        continue  # In cooldown; skip notification dispatch
```

When an alert fires:
1. `rule.last_triggered_at` is updated to the current timestamp.
2. A `HealthAlert` entity is recorded.
3. Active, approved caregivers connected to the patient with `acknowledge_alerts` or monitoring permissions are identified.
4. Individual `Notification` entities are created for each caregiver recipient and the patient.
5. Events are broadcast across active WebSockets.

---

## 4. In-App User Experience

### Header Notification Bell
- **Unread Badge**: A red pulse counter shows the total unread alert count (e.g. `1`, `2`, or `9+`).
- **Interactive Popover**:
  - Displays notifications ordered chronologically by newest first.
  - Severity color coding: Red for `CRITICAL` (e.g. Hypoxia, Severe Arrhythmia), Amber for `WARNING`, Blue for `INFO`.
  - Timestamp with formatted relative time.
  - One-click checkmark to mark an individual notification as read.
  - "Mark all read" button to clear the badge in a single action.

---

## 5. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notifications?limit=50` | Retrieves recent notifications for the authenticated user. |
| `GET` | `/api/notifications/unread-count` | Returns `{ "unread_count": N, "total_count": M }`. |
| `PUT` | `/api/notifications/{id}/read` | Marks a specific notification as read. |
| `POST` / `PUT` | `/api/notifications/read-all` | Marks all notifications for the user as read. |
