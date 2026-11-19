#!/usr/bin/env python3
"""
PulseBridge Duo — Physical Serial Bridge for ESP32 / Wokwi Hardware Emulation
Reads JSON telemetry lines from a USB serial port (e.g., COM3 or /dev/ttyUSB0)
and forwards them to the local FastAPI backend (POST /api/sensor-data).

Usage:
    python scripts/serial_bridge.py [COM_PORT] [BAUD_RATE] [API_URL]
Example:
    python scripts/serial_bridge.py COM3 115200 http://localhost:8000/api/sensor-data
"""

import sys
import json
import time
import urllib.request
import urllib.error

DEFAULT_PORT = "COM3"
DEFAULT_BAUD = 115200
DEFAULT_API_URL = "http://localhost:8000/api/sensor-data"

def forward_payload(api_url: str, payload: dict) -> bool:
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            api_url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status in (200, 201):
                res_body = json.loads(resp.read().decode())
                print(f"[BRIDGE] Forwarded successfully. Alerts: {res_body.get('alerts_generated', 0)}")
                return True
    except urllib.error.URLError as e:
        print(f"[BRIDGE ERROR] Backend unreachable: {e}")
    except Exception as e:
        print(f"[BRIDGE ERROR] Ingestion failed: {e}")
    return False

def run_serial_bridge(port: str, baud: int, api_url: str):
    print(f"==================================================")
    print(f" PulseBridge Duo Serial Bridge")
    print(f" Port: {port} @ {baud} bps")
    print(f" Target API: {api_url}")
    print(f"==================================================")

    try:
        import serial # Requires: pip install pyserial
    except ImportError:
        print("[NOTICE] 'pyserial' not installed. Running in mock demonstration loop mode.")
        print("To install: pip install pyserial\n")
        # Run demo loop sending canonical Wokwi packet every 5 seconds
        sample = {
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
        while True:
            print(f"[MOCK SERIAL] Sending ESP32 packet...")
            forward_payload(api_url, sample)
            time.sleep(5)

    try:
        ser = serial.Serial(port, baud, timeout=1)
        print(f"[BRIDGE] Connected to {port}. Listening for JSON packets...")
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and line.startswith("{") and line.endswith("}"):
                try:
                    payload = json.loads(line)
                    forward_payload(api_url, payload)
                except json.JSONDecodeError:
                    print(f"[BRIDGE WARN] Ignored non-JSON line: {line}")
    except Exception as e:
        print(f"[BRIDGE FATAL] Serial communication error: {e}")

if __name__ == "__main__":
    port_arg = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PORT
    baud_arg = int(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_BAUD
    url_arg = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_API_URL
    run_serial_bridge(port_arg, baud_arg, url_arg)
