# PulseBridge Duo — REST & WebSocket API Specification

## 1. Overview
The PulseBridge Duo backend runs on FastAPI, providing asynchronous JSON REST endpoints and a WebSocket endpoint for real-time telemetry streaming and alerts.

Base URL: `http://localhost:8000`  
Interactive OpenAPI Documentation: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## 2. Endpoints

### 2.1 System Health
- **`GET /api/health`**
  - **Description**: Returns system status, database connectivity, and active device count.
  - **Response `200 OK`**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-11-16T14:00:00Z",
      "version": "1.0.0",
      "database": "connected",
      "active_devices": 2
    }
    ```

### 2.2 Device Registry
- **`GET /api/devices`**
  - **Description**: Retrieves all registered devices, configuration state, battery level, and link status.
  - **Response `200 OK`**:
    ```json
    [
      {
        "device_id": "PB-RING-01",
        "device_type": "ring",
        "name": "PulseBridge Smart Ring",
        "status": "connected",
        "battery_percent": 88,
        "last_seen": "2026-11-16T14:00:00Z",
        "signal_quality": 0.94
      },
      {
        "device_id": "PB-WATCH-01",
        "device_type": "watch",
        "name": "PulseBridge Smartwatch",
        "status": "connected",
        "battery_percent": 74,
        "last_seen": "2026-11-16T14:00:00Z",
        "signal_quality": 0.91
      }
    ]
    ```

### 2.3 Sensor Telemetry Ingestion
- **`POST /api/sensor-data`**
  - **Description**: Ingests sensor reading payloads from Wokwi simulation, browser simulators, or hardware bridges.
  - **Request Body (Wokwi Payload Example)**:
    ```json
    {
      "device_id": "PB-ESP32-01",
      "source": "WOKWI_SIMULATION",
      "simulated": true,
      "heart_rate_bpm": 104,
      "spo2_percent": 86,
      "bp_systolic_mmhg": 131,
      "bp_diastolic_mmhg": 89,
      "glucose_mg_dl": 182,
      "temperature_c": 36.8,
      "humidity_percent": 45.0,
      "activity_percent": 45,
      "demo_status": "REVIEW"
    }
    ```
  - **Response `201 Created`**:
    ```json
    {
      "success": true,
      "reading_id": "8c59911e-232a-4a25-94df-74f26b5c5e88",
      "timestamp": "2026-11-16T14:00:00Z",
      "normalized_source": "WOKWI_SIMULATION",
      "alerts_generated": 1
    }
    ```

### 2.4 Latest Telemetry
- **`GET /api/latest`**
  - **Query Parameters**: `device_id` (optional), `source` (optional)
  - **Response `200 OK`**:
    ```json
    {
      "reading_id": "8c59911e-232a-4a25-94df-74f26b5c5e88",
      "timestamp": "2026-11-16T14:00:00Z",
      "source": "WOKWI_SIMULATION",
      "simulated": true,
      "device_id": "PB-ESP32-01",
      "device_type": "esp32_gateway",
      "heart_rate_bpm": 104.0,
      "spo2_percent": 86.0,
      "bp_systolic_mmhg": 131.0,
      "bp_diastolic_mmhg": 89.0,
      "glucose_mg_dl": 182.0,
      "temperature_c": 36.8,
      "temperature_source": "ambient",
      "humidity_percent": 45.0,
      "activity_percent": 45.0,
      "signal_quality": 0.95,
      "demo_status": "CRITICAL"
    }
    ```

### 2.5 Historical Telemetry
- **`GET /api/history`**
  - **Query Parameters**: `hours` (default: 6, options: 1, 6, 24, 168), `device_id` (optional), `limit` (default: 100)
  - **Response `200 OK`**:
    ```json
    {
      "count": 48,
      "time_window_hours": 6,
      "earliest": "2026-11-16T08:00:00Z",
      "latest": "2026-11-16T14:00:00Z",
      "readings": [ ... ]
    }
    ```

### 2.6 Health Alerts & Rules
- **`GET /api/alerts`**
  - **Query Parameters**: `severity` (optional: CRITICAL, WARNING, ATTENTION), `acknowledged` (optional: boolean)
  - **Response `200 OK`**: Array of alert objects.
- **`POST /api/alerts/{id}/acknowledge`**
  - **Description**: Acknowledges an alert by ID.
  - **Response `200 OK`**:
    ```json
    {
      "alert_id": "alert-001",
      "status": "acknowledged",
      "acknowledged_at": "2026-11-16T14:01:00Z"
    }
    ```

### 2.7 Demonstration Threshold Configuration
- **`GET /api/configuration`**
  - Returns current threshold limits.
- **`POST /api/configuration`**
  - Updates demonstration threshold limits with validation.

---

## 3. WebSocket Streaming

- **Endpoint**: `ws://localhost:8000/ws/monitoring`
- **Protocol**: JSON text frames.
- **Outbound Stream**: Pushes new readings, dual-device correlation events, and newly triggered alerts in real time whenever sensor packets are ingested.
