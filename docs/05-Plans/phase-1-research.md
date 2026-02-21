---
title: "Phase 1: Research — Summary & Gaps"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - plan
  - meta
  - research
related:
  - "[[01-Project/3d-pen-MOC]]"
  - "[[05-Plans/phase-2-design]]"
---

# Phase 1: Research — Summary & Gaps

## Completed Research

### Hardware Domain (4 notes)

| Note | Key Outcome |
|------|-------------|
| [[02-Research/hardware/flex-pcb-design\|Flex PCB Design]] | 2-layer pure flex + stiffeners recommended; IPC-2223 bend radius met at 3mm min; JLCPCB/PCBWay can manufacture |
| [[02-Research/hardware/sensor-selection\|Sensor Selection]] | ICM-42688-P IMU (0.91mm height, 32kHz ODR); Interlink FSR 400 Short (0.3mm); Azoteq IQS263 touch (0.75mm DFN); all fit 2.5mm gap with 1.33mm margin |
| [[02-Research/hardware/wireless-charging\|Wireless Charging]] | TI BQ51003 receiver IC; axial planar coil recommended for v1; 10180 Li-ion cell (70-100mAh); ~40-52% charging efficiency |
| [[02-Research/hardware/mechanical-design\|Mechanical Design]] | 11mm diameter is very tight — consider 11.5-12mm; M10x0.75 nib thread; PC shell, 14-22g weight target |

### Embedded Domain (4 notes)

| Note | Key Outcome |
|------|-------------|
| [[02-Research/embedded/mcu-selection\|MCU Selection]] | nRF52840 (QFN48, 6x6mm) recommended; 200ksps ADC with DMA; integrated 2.4GHz radio; 8kHz needs only 24% ADC budget |
| [[02-Research/embedded/wireless-protocols\|Wireless Protocols]] | Nordic ESB at 2Mbps primary (gaming mouse protocol); BLE secondary for config/DFU; 920kbps needed with overhead |
| [[02-Research/embedded/firmware-architecture\|Firmware Architecture]] | Zephyr RTOS via nRF Connect SDK; DMA-driven ADC with double buffering; cooperative threads; 150-200KB flash footprint |
| [[02-Research/embedded/power-management\|Power Management]] | ~5.8mA active current; 100mAh cell provides 8-14+ hours; MAX17048 fuel gauge; 3-state power management |

### ML Domain (4 notes)

| Note | Key Outcome |
|------|-------------|
| [[02-Research/ml/sensor-fusion-models\|Sensor Fusion Models]] | MoE architecture (touching/hovering experts); TCN displacement mapping (0.176 NER); REWI CNN+BiLSTM for recognition |
| [[02-Research/ml/handwriting-recognition\|Handwriting Recognition]] | OnHW dataset most relevant (STABILO sensor pen, 14 IMU channels); IMU2Text CNN+GNN (99.74% accuracy); future phase |
| [[02-Research/ml/training-pipeline\|Training Pipeline]] | DTW for sensor-scan alignment; writer-based train/val/test splits; jittering/rotation/time-warp augmentation |
| [[02-Research/ml/realtime-inference\|Real-Time Inference]] | RT-TCN for O(1) streaming inference; ONNX Runtime recommended; 5-9ms total pipeline latency achievable |

### Software Domain (4 notes)

| Note | Key Outcome |
|------|-------------|
| [[02-Research/software/hid-protocol\|HID Protocol]] | Usage Page 0x0D, Usage 0x02 (Pen); 12-byte report descriptor (X, Y, pressure, tilt); report descriptor format documented |
| [[02-Research/software/device-drivers\|Device Drivers]] | Windows: VHF/UMDF; macOS: IOHIDUserDevice; Linux: uhid/uinput; OpenTabletDriver as reference architecture |
| [[02-Research/software/canvas-rendering\|Canvas Rendering]] | Pointer Events API for cross-platform; Catmull-Rom→Bezier for smooth strokes; 10-40ms end-to-end rendering |
| [[02-Research/software/os-input-registration\|OS Input Registration]] | BTN_TOOL_PEN (Linux), Usage 0x02 (Windows), proximity events (macOS) are key classification triggers |

## Identified Gaps

### High Priority — Must resolve before design phase

1. **Flex PCB detailed geometry** — Need actual helical wrap angle calculation, component zone mapping onto flattened PCB layout, and DRC-compliant routing plan
2. **11mm vs 12mm diameter decision** — Hardware research flagged 11mm as extremely tight; this affects every other subsystem and needs a formal decision
3. **ESB packet format definition** — Wireless protocol selected but no concrete packet structure defined; needed for firmware and host driver development
4. **Sensor-to-ML data format contract** — Channel ordering, timestamp format, normalization expectations not yet formalized
5. **Training data collection rig** — Physical apparatus needed for recording sensor sessions + synchronized paper scanning

### Medium Priority — Can proceed in parallel with early design

6. **Antenna design** — PCB trace antenna geometry for 2.4GHz on flex substrate; impedance matching
7. **USB receiver dongle design** — Separate PCB with nRF52840 + USB; firmware for ESB RX + USB HID TX
8. **Cross-platform driver packaging** — How to distribute and install virtual HID drivers on each OS
9. **Model architecture selection** — TCN vs MoE vs hybrid; need prototype experiments
10. **Battery thermal analysis** — Li-ion in tight enclosure; charging heat dissipation

### Low Priority — Future phases

11. **OTA firmware update** — Bootloader design, secure update protocol
12. **Handwriting recognition model** — Phase 2+ feature
13. **WebHID browser companion** — Nice-to-have alternative interface
14. **Manufacturing partner selection** — Flex PCB fabrication quotes, assembly options

## Tool Readiness

| Domain | Primary Tools | Status |
|--------|--------------|--------|
| Hardware | KiCad 8+, LTspice, Fusion 360 | Ready — all ADOPT verdict |
| Embedded | Zephyr/nRF Connect SDK, J-Link | Ready — all ADOPT verdict |
| ML | PyTorch, ONNX Runtime, DVC | Ready — all ADOPT verdict |
| Software | HIDAPI, evdev/uinput, Raw Canvas 2D | Ready — all ADOPT verdict |
| Agents | Claude Code, MCP, Dataview | Ready — ADOPT |

## Next Steps

1. Create decision log for outer diameter: [[06-Decisions/dec-0001-outer-diameter]]
2. Define interface contracts between all domains (integration-agent task)
3. Proceed to [[05-Plans/phase-2-design|Phase 2: Design]]
