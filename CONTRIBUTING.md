# Contributing to PulseBridge Duo

Thank you for contributing to PulseBridge Duo!

## Development Guidelines
1. **Preserve Prototype Transparency**: Never remove simulation badges or ethical disclaimers. Always clearly differentiate between simulated data and certified clinical measurements.
2. **Stable Component IDs**: Maintain the canonical IDs `R01`–`R11` for the Smart Ring and `W01`–`W15` for the Smartwatch across 3D models, exploded views, and technical panels.
3. **Preserve Wokwi Integration**: Never break the `PB-ESP32-01` JSON data contract. All hardware emulation adapters must accept the canonical payload.
4. **Code Quality**: Ensure all frontend code is typed with TypeScript and formatted cleanly. Ensure all backend endpoints are validated with Pydantic and backed by automated tests.
