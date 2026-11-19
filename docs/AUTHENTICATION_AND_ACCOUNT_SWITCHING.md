# PulseBridge Duo — Authentication & Account Switching Specification

## 1. Authentication Architecture Overview

PulseBridge Duo implements a secure, stateless JWT (JSON Web Token) authentication architecture supporting two distinct, independent user personas:
1. **Patient (`UserRole.PATIENT`):** The individual wearing the health monitoring devices. Patients retain full data sovereignty, generate time-bounded caregiver invitations, and grant or revoke access permissions.
2. **Caregiver (`UserRole.CAREGIVER`):** Authorized family members, guardians, or clinicians who remotely observe patients, receive automated physiological notifications, and configure personalized alert boundaries.

The authentication system strictly preserves existing database records and registered users while providing flexible email-based credentials and instant evaluation access.

---

## 2. Pre-Seeded Evaluation Profiles

To facilitate immediate product assessment and clinical review without manual registration hurdles, the backend database is pre-seeded with two fully populated reference profiles:

| Role | Email Address | Default Password | Primary Identifier |
| :--- | :--- | :--- | :--- |
| **Patient Profile** | `patient@pulsebridge.demo` | `PulsePass123!` | John Doe (`User ID: 1`, `Profile ID: 1`) |
| **Caregiver Profile** | `caregiver@pulsebridge.demo` | `PulsePass123!` | Jane Doe (`User ID: 2`, `Profile ID: 2`) |

### Instant Evaluation Buttons
Both the `/login` page and the global navigation header feature dedicated **"Patient Profile"** and **"Caregiver Profile"** quick-access buttons. Clicking either button dispatches a standard `POST /api/auth/login` request, signs the user in via legitimate JWT tokens, and immediately redirects to the appropriate role-based landing page.

---

## 3. Email-Based Account Access & User Registration

Users can register new personal accounts as either a Patient or a Caregiver via the `/register` portal.

### 3.1 Client-Side Validation Rules
- **Email Format:** Validated against RFC 5322 email regular expressions.
- **Password Strength:** Minimum 6 characters required.
- **Password Confirmation:** Real-time confirmation matching; discrepancies display an explicit error (*"Passwords do not match"*).
- **Role-Specific Metadata:**
  - *Patient:* Captures Emergency Contact phone number and Primary Physician information.
  - *Caregiver:* Captures Relationship to Patient (e.g., Parent, Daughter, Son, Spouse, Physician) and Emergency Notification Phone.

### 3.2 Visual Show/Hide Password Controls
Both the `/login` and `/register` interfaces feature interactive eye icon toggles (`Eye` / `EyeOff` from Lucide) for password fields, preventing frustrating input errors on mobile touchscreens or shared workstations.

---

## 4. Token Storage, Persistence & Session Recovery

1. **Storage Mechanism:** Upon successful authentication, the backend issues an HS256-signed JWT token containing user identity and role claims. The token is safely persisted in the browser's `localStorage` under key `pulsebridge_token`.
2. **Remember Session Support:** Users can toggle the *"Remember my session"* checkbox on the login page to maintain persistent authentication across browser refreshes and tab re-openings.
3. **Automatic Session Recovery:** During application initialization, `AuthProvider` checks for an existing `pulsebridge_token`. If present, it executes `GET /api/auth/me` to rehydrate user profile data, unread notifications, and active permissions. If expired or invalid, the token is pruned cleanly without crashing the UI.

---

## 5. Account Switching & Safe Logout Workflow

Switching between Patient and Caregiver modes does not require deleting database records, clearing local cookies, or restarting backend server processes:
1. **Logout Action:** Invoked via the header account menu or the dedicated logout button (`LogOut` icon).
2. **State Teardown:**
   - Clears `pulsebridge_token` from `localStorage`.
   - Clears user context, connected patient lists, active notifications, and role permissions.
   - Resets telemetry streaming contexts.
   - Redirects cleanly to `/login`.
3. **Instant Role Switching:** Users can immediately sign in with alternative credentials or click the complementary evaluation profile button to view the platform from the other user's perspective.
