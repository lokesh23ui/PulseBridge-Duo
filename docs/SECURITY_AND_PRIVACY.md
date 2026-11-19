# PulseBridge Duo — Security, Privacy & Compliance Architecture

## 1. Core Security Philosophy

PulseBridge Duo is architected around the core healthcare principle: **The patient owns their medical data.**

Caregivers are never granted automatic or unrestricted access to a patient's historical telemetry, clinical notes, or medical records. Every view, alert configuration, and data query is gated by explicit patient authorization enforced at the database and API boundary.

---

## 2. Authentication & Credential Storage

### Password Hashing
Passwords are never stored in plaintext. Passwords are salted and hashed using `bcrypt` (`bcrypt.hashpw` with salt rounds = 12):
```python
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
```

### JSON Web Tokens (JWT)
Upon successful authentication (`/api/auth/login` or `/api/auth/register`), the backend issues a signed JWT (`HS256` algorithm) containing:
- `sub`: User ID
- `email`: User email address
- `role`: Role identifier (`"patient"` or `"caregiver"`)
- `exp`: Expiration timestamp (default: 72 hours)

Every subsequent protected request requires an `Authorization: Bearer <TOKEN>` header. FastAPI dependency injection (`get_current_user`, `require_patient`, `require_caregiver`) extracts and validates the token signature before routing to endpoint handlers.

---

## 3. Cryptographic Token Generation & Replay Protection

Caregiver invitation codes use Python's cryptographically secure random number generator:
- **Format**: `PBD-XXXX-XXXX`
- **Entropy**: 8 alphanumeric characters selected from 36 characters ($36^8 \approx 2.82 \times 10^{12}$ combinations).
- **Single-Use Enforcement**: Ingestion immediately shifts state from `active` to `redeemed`. Replay attempts return HTTP 404/400.
- **Time Expiry**: All tokens expire after 48 hours.

---

## 4. Server-Side Permission Isolation

Permission checks are strictly validated on the backend. Frontend UI hiding is merely a presentation convenience; direct API requests to `/api/patients/{id}/reports`, `/api/patients/{id}/overview`, or `/api/patients/{id}/history` by unapproved caregivers are intercepted by `verify_caregiver_access()`:

```python
if required_permission:
    perms = rel.permissions
    if not perms or not getattr(perms, required_permission, False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Access forbidden: Missing '{required_permission}' permission from patient"
        )
```

Attempts to bypass permissions result in `403 Forbidden` responses.

---

## 5. Audit Logging & Traceability

Every critical relationship state transition, permission update, and invitation event is immutably recorded in the `audit_logs` table:

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_patient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=utc_now)
```

Audited actions include:
- `INVITATION_CREATED`: Recorded when patient creates an invitation code.
- `INVITATION_REDEEMED`: Recorded when caregiver enters code.
- `RELATIONSHIP_APPROVED`: Recorded when patient approves caregiver.
- `PERMISSIONS_UPDATED`: Recorded when permissions are toggled.
- `RELATIONSHIP_REVOKED`: Recorded when patient terminates access.
- `ALERT_RULE_CREATED`: Recorded when custom threshold is defined.
