---
title: "3D Pen — System Architecture"
domain: "integration"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - architecture
  - integration
  - system-design
related:
  - "[[01-Project/vision]]"
  - "[[01-Project/requirements]]"
---

# 3D Pen — System Architecture

## System Block Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         PEN HARDWARE                          │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Pressure  │  │ IMU #1   │  │ IMU #2   │  │ Cap. Touch  │  │
│  │ (Piezo)   │  │ (Nib end)│  │ (Top end)│  │ (Strip)     │  │
│  └─────┬─────┘  └─────┬────┘  └─────┬────┘  └──────┬──────┘  │
│        │              │              │               │         │
│        └──────────┬───┴──────────┬───┘               │         │
│                   ▼              ▼                    ▼         │
│              ┌─────────────────────────────────────────┐       │
│              │              MCU (32-bit)                │       │
│              │  ┌──────┐  ┌──────┐  ┌───────────────┐ │       │
│              │  │ ADC  │  │ SPI/ │  │ Wireless TX   │ │       │
│              │  │ (DMA)│  │ I2C  │  │ (2.4GHz)      │ │       │
│              │  └──────┘  └──────┘  └───────┬───────┘ │       │
│              └──────────────────────────────┬┘         │       │
│                                             │          │       │
│  ┌─────────────┐  ┌──────────┐  ┌─────────┤          │       │
│  │ Haptic      │  │ Li-ion   │  │ Charge  │  Antenna  │       │
│  │ Motor       │  │ Battery  │  │ IC      │  (PCB)    │       │
│  └─────────────┘  └──────────┘  └─────────┘          │       │
│                        ↑                               │       │
│                   [Qi Charging Coils on Flex PCB]      │       │
└──────────────────────────────────────────────────────────────┘
                              │ RF (2.4GHz)
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      USB RECEIVER DONGLE                      │
│                                                               │
│  Antenna → Wireless RX → MCU → USB Interface                 │
└──────────────────────────┬───────────────────────────────────┘
                           │ USB
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       HOST SOFTWARE                           │
│                                                               │
│  ┌──────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │ USB/Wireless  │    │ ML Inference  │    │ Virtual HID   │  │
│  │ Driver        │───▶│ Pipeline      │───▶│ Device        │  │
│  │ (libusb/      │    │               │    │ (OS digitizer)│  │
│  │  hidapi)      │    │ Sensor data   │    │               │  │
│  └──────────────┘    │ → (x,y,p,tilt)│    │ HID reports   │  │
│                       └───────────────┘    └───────┬───────┘  │
│                                                     │         │
│                                                     ▼         │
│                                            ┌───────────────┐  │
│                                            │ OS Input       │  │
│                                            │ System         │  │
│                                            └───────┬───────┘  │
│                                                     │         │
│                                                     ▼         │
│                                            ┌───────────────┐  │
│                                            │ Canvas Apps   │  │
│                                            │ (Paint, PS,   │  │
│                                            │  OneNote...)  │  │
│                                            └───────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Sensors ─→ MCU (ADC/SPI/I2C) ─→ Wireless TX ─→ RF ─→ Wireless RX ─→ USB ─→ Host Driver
    ─→ ML Inference ─→ Virtual HID ─→ OS Input System ─→ Canvas Application
```

### Data Flow Stages

| Stage | Source | Destination | Data | Rate | Latency Budget |
|-------|--------|-------------|------|------|---------------|
| 1. Sensor sampling | Sensors | MCU ADC/bus | Raw analog/digital | 8kHz per channel | <0.125ms |
| 2. MCU processing | ADC/bus | Wireless TX buffer | Packed sensor data | ~768kbps | <0.5ms |
| 3. Wireless transmission | MCU TX | Receiver RX | RF packets | ~768kbps | <1ms |
| 4. USB transfer | Receiver | Host driver | USB packets | ~768kbps | <1ms |
| 5. ML inference | Driver | Virtual HID | (x, y, pressure, tilt) | Per sample | <10ms |
| 6. HID → OS | Virtual HID | OS input system | HID reports | Per sample | <1ms |
| **Total** | | | | | **<~14ms** |

## Interface Definitions

> These placeholders will be filled by domain agents after research and by the integration-agent during review.

### Interface 1: Sensor → MCU

| Parameter | Value | Notes |
|-----------|-------|-------|
| Pressure sensor output | TBD | Analog voltage or digital (SPI/I2C) |
| IMU output | TBD | SPI/I2C, specific registers |
| Capacitive touch output | TBD | I2C address, interrupt pin |
| Sampling rate | 8kHz target | Per channel |
| ADC resolution | TBD | 10-bit, 12-bit, or 16-bit |

### Interface 2: MCU → Wireless

| Parameter | Value | Notes |
|-----------|-------|-------|
| Protocol | TBD | BLE 5.x / ESB / Custom 2.4GHz |
| Packet format | TBD | Header + sensor payload + checksum |
| Packet rate | TBD | Depends on protocol and payload size |
| Error handling | TBD | CRC, retransmit, or accept loss |

### Interface 3: Wireless → Host Driver

| Parameter | Value | Notes |
|-----------|-------|-------|
| USB interface | TBD | HID / bulk / vendor-specific |
| Host library | TBD | libusb / hidapi / platform-native |
| Data format | TBD | Same as wireless packet or unpacked |

### Interface 4: Host Driver → ML Model

| Parameter | Value | Notes |
|-----------|-------|-------|
| Input tensor shape | TBD | (batch, channels, time_steps) |
| Channel order | TBD | pressure, accel_x1, accel_y1, ... |
| Normalization | TBD | Raw / standardized / min-max |
| Window size | TBD | Sliding window or streaming |

### Interface 5: ML Model → Virtual HID

| Parameter | Value | Notes |
|-----------|-------|-------|
| Output format | TBD | (x, y, pressure, tilt_x, tilt_y) |
| Coordinate system | TBD | Absolute / relative, range |
| Pressure range | TBD | 0-1023 / 0-4095 / 0-8191 |
| Update rate | TBD | Matches sensor rate or decimated |

### Interface 6: Virtual HID → OS

| Parameter | Value | Notes |
|-----------|-------|-------|
| HID Usage Page | 0x0D (Digitizers) | Standard |
| HID Usage | Pen (0x02) | Stylus digitizer |
| Report fields | TBD | X, Y, Tip Pressure, Barrel Switch, In Range, Tip Switch |
| Report rate | TBD | Matches model output rate |

## Power Architecture

```
[Qi Charging Dock] ─→ [Flex PCB Coils] ─→ [Charge IC] ─→ [Li-ion Cell]
                                                              │
                                                              ▼
                                                         [Power Reg]
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                           [MCU]         [Sensors]       [Wireless]
                                              │
                                              ▼
                                          [Haptic]
```

| Subsystem | Estimated Power | Notes |
|-----------|----------------|-------|
| MCU | TBD | Active + sleep modes |
| Sensors (all) | TBD | Continuous sampling |
| Wireless TX | TBD | Continuous streaming |
| Haptic | TBD | Intermittent |
| **Total Active** | TBD | |
| **Battery Capacity** | TBD | Target ≥8h active |
