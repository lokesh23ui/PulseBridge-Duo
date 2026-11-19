import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.connection import Base, engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_device_registry():
    response = client.get("/api/devices")
    assert response.status_code == 200
    devices = response.json()
    assert len(devices) >= 2
    device_ids = [d["device_id"] for d in devices]
    assert "PB-RING-01" in device_ids
    assert "PB-WATCH-01" in device_ids

def test_wokwi_canonical_payload_ingestion():
    wokwi_payload = {
        "device_id": "PB-ESP32-01",
        "source": "WOKWI_SIMULATION",
        "simulated": True,
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

    response = client.post("/api/sensor-data", json=wokwi_payload)
    assert response.status_code == 201
    res = response.json()
    assert res["success"] is True
    assert res["normalized_source"] == "WOKWI_SIMULATION"
    assert res["alerts_generated"] >= 1  # SpO2 86% triggers CRITICAL hypoxia alert

def test_alert_generation_and_acknowledgement():
    # Ingest critical reading
    critical_reading = {
        "device_id": "PB-RING-01",
        "source": "RING_SIMULATOR",
        "simulated": True,
        "heart_rate_bpm": 145.0, # Tachycardia (>130 bpm)
        "spo2_percent": 85.0,    # Critical hypoxia (<90%)
        "signal_quality": 0.95
    }
    ingest_res = client.post("/api/sensor-data", json=critical_reading)
    assert ingest_res.status_code == 201

    # Fetch alerts
    alerts_res = client.get("/api/alerts?severity=CRITICAL")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1

    target_alert = alerts[0]
    alert_id = target_alert["alert_id"]
    assert target_alert["acknowledged"] is False

    # Acknowledge alert
    ack_res = client.post(f"/api/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"

    # Verify updated status
    check_res = client.get("/api/alerts")
    matching = [a for a in check_res.json() if a["alert_id"] == alert_id]
    assert len(matching) == 1
    assert matching[0]["acknowledged"] is True

def test_historical_telemetry_query():
    response = client.get("/api/history?hours=6")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "readings" in data
    assert isinstance(data["readings"], list)

def test_threshold_configuration_update():
    get_res = client.get("/api/configuration")
    assert get_res.status_code == 200
    orig_config = get_res.json()

    # Modify and update
    new_config = dict(orig_config)
    new_config["hr_high_warning"] = 110.0
    post_res = client.post("/api/configuration", json=new_config)
    assert post_res.status_code == 200
    assert post_res.json()["hr_high_warning"] == 110.0
