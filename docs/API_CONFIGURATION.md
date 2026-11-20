# PulseBridge Duo — API & Integration Configuration Guide

This guide documents all environment variables, API integrations, third-party connectors, and security boundaries in the PulseBridge Duo platform.

---

## 1. Security Architecture & Boundary Principles

PulseBridge Duo enforces strict isolation between public client applications and private server infrastructure:

```mermaid
flowchart LR
    Client[Frontend Browser Bundle] -->|Public API Calls| ReverseProxy[FastAPI Backend :8000]
    ReverseProxy -->|JWT Verification| AuthGuard[RBAC Middleware]
    AuthGuard -->|Read/Write| DB[(Relational Database: SQLite / PostgreSQL)]
    AuthGuard -.->|Optional Server-Only| CloudAI[Google Gemini API]
    AuthGuard -.->|Optional Server-Only| Telegram[Telegram Bot API]
    AuthGuard -.->|Optional Server-Only| Supabase[Supabase Cloud]

    subgraph ClientSafe[Client-Side Safe]
        Client
    end

    subgraph ProtectedBackend[Protected Server Environment]
        ReverseProxy
        AuthGuard
        DB
        CloudAI
        Telegram
        Supabase
    end
```

### Key Security Principles:
1. **Zero Secret Leakage to Frontend:** No private API keys, database passwords, or JWT secrets are bundled into client-side JavaScript. Only non-sensitive variables prefixed with `VITE_` (such as `VITE_API_BASE_URL`) are exposed to the browser.
2. **Deterministic Offline Capability:** PulseBridge Duo's core clinical logic (ECG analysis, Atrial Fibrillation matching, biomarker parsing) is 100% deterministic and runs offline without requiring external AI vendor APIs.
3. **Controlled Provisioning:** System Administrator accounts cannot be registered through public forms; they are bootstrapped securely via server environment variables.

---

## 2. Configuration Matrix

The table below outlines all environment variables supported by the platform:

| Integration / Service | Purpose | Environment Variable | Configuration Location | Status in Project | Required / Optional |
|:---|:---|:---|:---|:---:|:---:|
| **Server Runtime** | API host, port, and debug configuration | `PORT`, `HOST`, `DEBUG`, `ENVIRONMENT` | `.env` / Server runtime | **Active** | **Required** |
| **CORS Policy** | Allowed origins for web and mobile clients | `CORS_ORIGINS` | `.env` | **Active** | **Required** |
| **Relational Database** | Primary persistent datastore (SQLite default or PostgreSQL) | `DATABASE_URL` | `.env` | **Active** | **Required** |
| **JWT Authentication** | HMAC-SHA256 signature key for bearer access tokens | `JWT_SECRET` / `JWT_SECRET_KEY` | `.env` | **Active** | **Required** |
| **JWT Session Duration** | Token validity window (default 168 hours / 7 days) | `JWT_EXPIRATION_HOURS` | `.env` | **Active** | Optional (defaults to 168) |
| **Admin Bootstrap** | Initial System Administrator credentials | `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_FULL_NAME` | `.env` | **Active** | **Required** for initial setup |
| **Supabase Cloud** | Managed PostgreSQL and cloud storage | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `.env` | Optional connector | Optional (defaults to local SQLite) |
| **Google Gemini API** | Optional AI narrative synthesis for health reports | `GEMINI_API_KEY`, `AI_PROVIDER` | `.env` | Optional connector | Optional (deterministic offline active) |
| **Telegram Bot API** | Dispatch real-time emergency arrhythmia alerts to caregiver chats | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DEFAULT_CHAT_ID` | `.env` | Optional connector | Optional (in-app notifications active) |
| **Public Registration** | Feature toggle to allow or disable public user registration | `ALLOW_PUBLIC_REGISTRATION` | `.env` / Admin Console | **Active** | Optional (defaults to true) |
| **Maintenance Mode** | Feature toggle to display scheduled downtime banners | `APP_MAINTENANCE_MODE` | `.env` / Admin Console | **Active** | Optional (defaults to false) |
| **Frontend Base URL** | Public API target URL for client fetch requests | `VITE_API_BASE_URL` | `frontend/.env` | **Active** | **Required** (defaults to localhost:8000/api) |

---

## 3. Detailed Service Configuration & Setup

### 3.1 Relational Database (`DATABASE_URL`)
- **Purpose:** Manages user credentials, patient profiles, caregiver relationships, permissions, sensor telemetry, medical reports, and immutable audit logs.
- **Default (Local Development):**
  ```env
  DATABASE_URL=sqlite:///./pulsebridge.db
  ```
- **Production (PostgreSQL / Supabase):**
  ```env
  DATABASE_URL=postgresql+psycopg2://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres
  ```

---

### 3.2 JWT Authentication (`JWT_SECRET`)
- **Purpose:** Signs and validates cryptographically secure JSON Web Tokens issued during login.
- **How to Configure:**
  Generate a high-entropy 256-bit random key in your terminal:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
  Set the value in your local `.env`:
  ```env
  JWT_SECRET=YOUR_GENERATED_32_BYTE_HEX_KEY
  JWT_EXPIRATION_HOURS=168
  ```

---

### 3.3 Initial Administrator Bootstrap (`ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`)
- **Purpose:** On server startup, if no administrator account exists in the database, PulseBridge Duo provisions the initial administrative user using these credentials.
- **Security Rule:** Administrator accounts cannot be created via `/api/auth/register` (which strictly permits `patient` or `caregiver` roles).
- **Configuration:**
  ```env
  ADMIN_EMAIL=admin@pulsebridge.health
  ADMIN_INITIAL_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD_HERE
  ADMIN_FULL_NAME="PulseBridge System Administrator"
  ```

---

### 3.4 Supabase Cloud Integration (Optional)
- **Purpose:** Enables deployment on Supabase-managed database infrastructure and encrypted storage buckets.
- **Status:** Optional cloud infrastructure. Local SQLite is active by default for hackathon demonstrations.
- **How to Configure:**
  1. Create a project at [supabase.com](https://supabase.com).
  2. Retrieve your project URL and public anon key from the Project Settings -> API page.
  3. Set placeholders in `.env`:
     ```env
     SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
     SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
     DATABASE_URL=postgresql+psycopg2://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
     ```

---

### 3.5 Google Gemini API (Optional)
- **Purpose:** Powers optional natural language explanations for patient diagnostic reports.
- **Status:** Optional cloud feature. PulseBridge Duo functions 100% deterministically offline without this key.
- **How to Configure:**
  1. Obtain an API key from Google AI Studio ([aistudio.google.com](https://aistudio.google.com)).
  2. Set in `.env`:
     ```env
     GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
     AI_PROVIDER=gemini
     ```
  3. When `AI_PROVIDER=none` or the key is absent, the application automatically uses built-in clinical rule engines.

---

### 3.6 Telegram Bot Clinical Alerts (Optional)
- **Purpose:** Dispatches real-time Atrial Fibrillation arrhythmia alerts to caregivers via Telegram messaging.
- **Status:** Optional delivery channel. In-app notifications and WebSocket real-time alerts are fully active regardless of Telegram configuration.
- **How to Configure:**
  1. Open Telegram and message `@BotFather` to create a bot and receive a bot token.
  2. Retrieve your chat ID by messaging `@userinfobot`.
  3. Set in `.env`:
     ```env
     TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
     TELEGRAM_DEFAULT_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_HERE
     ```

---

## 4. Admin Panel Integration Status Monitoring

In the PulseBridge Admin Console (`/admin/security`), administrators can inspect the live status of all service connectors without exposing secrets:

- **Configured:** Service credentials are present in the server environment and functional.
- **Missing configuration:** Required environment variables are absent.
- **Optional integration disabled:** Optional connectors (e.g. Gemini AI or Telegram) are running in deterministic offline fallback mode.

---

## 5. Netlify Production Deployment (Frontend SPA)

PulseBridge Duo's web application is a React 19 + TypeScript Single Page Application (SPA) powered by Vite and `react-router-dom`. When deploying to Netlify:

### 5.1 Architecture & Monorepo Base Directory
- **Repository Layout:** Monorepo with `frontend/` and `backend/`.
- **Netlify Build Configuration (`netlify.toml`):**
  - **Base directory:** `frontend`
  - **Build command:** `npm run build`
  - **Publish directory:** `dist` (relative to `frontend/`)
- **SPA Rewrites (`_redirects`):**
  Single-page routing requires all incoming URLs to route through `/index.html` with HTTP status `200` to prevent 404 errors on deep links or browser page reloads:
  ```text
  /* /index.html 200
  ```
  This rule is configured in `frontend/public/_redirects` (automatically copied to `dist/_redirects` by Vite) and redundantly declared in `netlify.toml`.

### 5.2 Environment Variables on Netlify
In Netlify Site Settings > **Environment variables**:
- `VITE_API_BASE_URL`: The URL of your deployed FastAPI backend (e.g., `https://api.pulsebridge.health/api`).
