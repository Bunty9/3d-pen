---
title: "3D Pen — Product Vision"
domain: "meta"
status: "final"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - vision
  - meta
  - product
related:
  - "[[01-Project/requirements]]"
  - "[[01-Project/architecture]]"
---

# 3D Pen — Product Vision

## Product Concept

A smart pen that houses a standard gel pen refill inside a sensor-laden enclosure. The pen streams all sensor data wirelessly in real time to a host device, where a deep learning model translates the raw sensor stream into digital pen strokes on a 2D canvas. The pen registers as an OS-level input device (like a Wacom stylus) and works with any standard drawing or canvas application.

**The pen does no computation.** It is a pure sensor streamer — all intelligence lives on the host.

![[09-Assets/images/pen-sketch-v0.jpg]]

## Target User

- Digital artists and illustrators who prefer the feel of pen on paper
- Students and professionals who want handwritten notes digitized in real time
- Anyone who wants the tactile experience of a gel pen with digital capture

## Key Features

### Sensor Suite
- **Piezoelectric pressure sensor** — ~40mm zone directly behind the refill nib, measures writing pressure with high sensitivity
- **2x 3D accelerometer/IMU** — one at each end of the pen, provides real-time 3D position and orientation
- **Capacitive touch sensor array** — linear strip along pen body, used as multifunction tap buttons for modes and features
- **Haptic feedback** — low-energy haptics for tactile user feedback

### Communication
- High-bandwidth, low-latency wireless protocol (similar to wireless gaming mice)
- Target: ~8kHz polling rate at highest sensor resolution
- Dedicated USB receiver dongle on the host side

### Power
- Li-ion rechargeable battery
- Wireless charging (Qi-style) via copper coils built directly into the flex PCB
- Battery management system with monitoring

### Physical Design
- Standard gel pen refill compatibility (110mm x 6mm)
- Pen dimensions: ~150mm length, ~11mm outer diameter
- Nib end unscrews to insert/replace refill
- Hard outer shell with premium feel

### Intelligence (Host-Side)
- Deep learning model for sensor-to-stroke translation
- Training data: recorded sensor sessions paired with scanned paper (ground truth)
- Real-time inference: live sensor stream → live digital canvas strokes
- Future: handwriting/character recognition

## Hardware Constraints

| Constraint | Value | Impact |
|-----------|-------|--------|
| Refill dimensions | 110mm x 6mm diameter | Defines inner cavity |
| Outer shell | ~150mm x 11mm diameter | Defines total envelope |
| Annular gap | ~2.5mm radial clearance | ALL electronics must fit here |
| PCB type | Flexible, helically wrapped | Complex geometry, limited component height |
| Power budget | Ultra-low (battery in pen) | Every component must be low-power |
| Data rate | ~8kHz polling, all sensors | High-bandwidth wireless required |
| Latency | Minimal (real-time feel) | No buffering, streaming protocol |

## System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                      3D PEN                          │
│                                                      │
│  Pressure ─┐                                         │
│  IMU #1   ─┤                                         │
│  IMU #2   ─┼─→ MCU ─→ Wireless TX ─→ )))           │
│  Touch    ─┤         (8kHz stream)                   │
│  Haptics  ←┘                                         │
│                                                      │
│  [Li-ion Battery] ←── [Wireless Charging Coils]      │
└─────────────────────────────────────────────────────┘
                          ↓ RF
┌─────────────────────────────────────────────────────┐
│                    HOST DEVICE                        │
│                                                      │
│  USB Receiver ─→ Driver ─→ ML Model ─→ OS Input     │
│                            (inference)   (HID pen)   │
│                                             ↓        │
│                                       Canvas Apps    │
│                                    (Paint, Photoshop,│
│                                     OneNote, etc.)   │
└─────────────────────────────────────────────────────┘
```

## Success Criteria

1. **Writing feel** — Indistinguishable from a normal gel pen
2. **Digital accuracy** — Sub-millimeter stroke reconstruction on digital canvas
3. **Latency** — Imperceptible delay between physical writing and digital appearance
4. **Compatibility** — Works as a standard pen input device on Windows, macOS, Linux
5. **Battery life** — Full day of active use on a single charge
6. **Build quality** — Premium feel, comfortable weight and balance

## Original Ideation

The raw ideation notes that inspired this vision document are preserved in:
- [[00-Inbox/ideation-v0.0-raw|Raw Ideation Notes]]
- [[00-Inbox/gemini-thinking-raw|Initial Research Thinking Notes]]
