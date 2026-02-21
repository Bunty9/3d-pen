# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**3D Pen** — A smart pen hardware product that uses a standard gel pen refill inside a sensor-laden enclosure. The pen streams real-time sensor data (pressure, accelerometers, capacitive touch) wirelessly to a host, where a deep learning model interprets the data into digital strokes on a 2D canvas. The pen registers as an OS-level input device (like a digital pen) compatible with standard canvas apps.

This is a multi-disciplinary project spanning hardware design, embedded firmware, wireless communication, and ML/software.

## Project Status

Early ideation phase. No code or firmware exists yet. The repository currently contains:
- `docs/ideation/v0.0.md` — Full product vision, feature list, and hardware constraints
- `docs/assets/images/` — Hand-drawn sketches of pen internals and flex PCB layout

## Architecture (Planned Domains)

### Hardware / Flex PCB
- Single flexible PCB that wraps helically around an inner cylindrical shell housing the refill
- Components laid out so they align correctly when rolled: wireless charging coils (copper traces on flex PCB), MCU, sensors, communication circuit, antenna
- Pen dimensions: ~150mm length, ~11mm diameter outer; refill is 110mm x 6mm
- Nib end unscrews to insert a standard gel pen refill
- Debugging via flex PCB connector terminating to an external debug board

### Sensors
- **Pressure sensor** (piezo, high-sensitivity) — ~40mm zone behind the refill nib, measures writing pressure
- **2x 3D accelerometer/IMU** — one at each end of the pen, for real-time 3D position and orientation
- **Capacitive touch sensor array** — linear strip along pen body, used as multifunction tap buttons
- **Haptic feedback** — low-energy haptics for user feedback

### Embedded / MCU
- 32-bit low-power MCU; no on-pen computation — pen is a pure sensor streamer
- Streams all raw sensor data to host at highest possible resolution (~8 kHz target)
- Low-latency, high-bandwidth wireless protocol (similar to wireless gaming mice)
- Battery management system with Li-ion cell and wireless (Qi-style) charging

### Host Software
- Receives real-time sensor stream from pen
- ML inference pipeline: translates raw sensor data into 2D pen strokes on a digital canvas
- Registers as an OS input device so it works with any drawing/canvas application

### ML / Data Pipeline
- **Training data**: record sensor session + scan the physical paper used during that session as ground truth labels
- **Model**: maps sensor streams (pressure, acceleration, orientation) to 2D stroke coordinates
- **Goal**: real-time inference — live sensor stream in, live digital canvas strokes out; later extend to handwriting/character recognition

## Key Design Constraints
- All electronics must fit in the ~2.5mm annular gap between refill and outer shell
- Wireless data must match sensor resolution with minimal latency (target ~8 kHz polling)
- Power budget is extremely tight — everything must be low-energy (MCU, comms, haptics, sensors)
- Flex PCB geometry must be designed so components land in correct positions when helically wrapped
