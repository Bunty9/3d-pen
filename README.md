# 3D Pen

A smart pen that writes on real paper with a standard gel pen refill — while streaming real-time sensor data wirelessly to a host computer, where a deep learning model reconstructs your handwriting as digital strokes on any canvas application.

**The pen registers as an OS-level input device (like a Wacom pen), so it works with any drawing or writing app out of the box.**

![3D Pen Concept](docs/09-Assets/images/ai-renders/ChatGPT%20Image%20Feb%2021,%202026,%2001_06_18%20PM.png)

## How It Works

```
  Real Paper          Smart Pen              Wireless           Host Computer
 ┌──────────┐    ┌────────────────┐    ┌──────────────┐    ┌────────────────┐
 │ Write     │───▶│ 6 sensors      │───▶│ 2.4GHz ESB   │───▶│ ML inference   │
 │ normally  │    │ stream at 8kHz │    │ at 2Mbps     │    │ < 10ms latency │
 └──────────┘    └────────────────┘    └──────────────┘    └────────────────┘
                                                                    │
                                                                    ▼
                                                           ┌────────────────┐
                                                           │ OS input device│
                                                           │ (virtual pen)  │
                                                           │ ─── any app ───│
                                                           └────────────────┘
```

No special paper. No camera. No digitizer tablet. Just pick up the pen and write.

## Hardware

The entire electronics package fits inside a pen that looks and feels like a premium writing instrument.

![Exploded View](docs/09-Assets/images/ai-renders/Gemini_Generated_Image_svh0basvh0basvh0.png)

### Specifications

| Parameter | Value |
|---|---|
| Dimensions | 150mm x 11.5mm (similar to Lamy Safari) |
| Weight | 20-28g |
| Refill | Standard gel pen (Pilot G2 compatible) |
| Sensors | 2x IMU (32kHz), pressure, capacitive touch |
| MCU | nRF52840 (ARM Cortex-M4F, integrated 2.4GHz) |
| Wireless | Nordic ESB at 2Mbps, BLE secondary |
| Streaming | 8kHz sensor polling, 6 channels |
| Battery | 10180 Li-ion (100mAh), 8-14 hours active |
| Charging | Qi wireless, ~30 min charge time |
| Shell | Polycarbonate or Aluminum 6061 |

### Internal Architecture

![Exploded View Detail](docs/09-Assets/images/ai-renders/Gemini_Generated_Image_uo0fd5uo0fd5uo0f.png)

The pen houses a **helical flex PCB** (polyimide, 230mm x 10mm) that wraps around an inner cylindrical shell, placing components in 6 functional zones along the pen axis:

- **Zone A** (nib end): Pressure sensor + IMU #1
- **Zone B** (grip area): Capacitive touch slider + wake controller
- **Zone C** (mid-body): nRF52840 MCU + 2.4GHz antenna
- **Zone D** (upper body): Power management + IMU #2
- **Zone E** (end cap): Qi wireless charging coil

## Project Status

**Phase: Research Complete → Design Phase Starting**

The project has a comprehensive knowledge base with 50+ research documents covering four domains. No code or firmware exists yet — the next step is schematic capture and mechanical CAD.

| Domain | Status | Key Decision |
|---|---|---|
| Hardware | Research complete | Flex PCB + ICM-42688-P IMU + nRF52840 |
| Embedded | Research complete | Zephyr RTOS + ESB wireless + DMA-driven ADC |
| ML | Research complete | MoE architecture (TCN + RT-TCN streaming) |
| Software | Research complete | HID Usage Page 0x0D + virtual pen per OS |

## Project Structure

This repository is an **Obsidian vault** — open the `docs/` folder in [Obsidian](https://obsidian.md/) for the best navigation experience.

```
docs/
├── Home.md                          # Vault entry point
├── 01-Project/                      # Vision, requirements, architecture
│   ├── 3d-pen-MOC.md               # Master Map of Content (start here)
│   ├── vision.md                    # Product concept and constraints
│   ├── requirements.md              # Functional & non-functional requirements
│   ├── architecture.md              # System design and data flow
│   └── hardware-design-spec.md      # Full hardware geometry for CAD/renders
├── 02-Research/                     # Domain research (50+ notes)
│   ├── hardware/                    # Flex PCB, sensors, charging, mechanical
│   ├── embedded/                    # MCU, wireless, firmware, power
│   ├── ml/                          # Sensor fusion, training, inference
│   └── software/                    # HID, drivers, canvas, OS integration
├── 03-SOPs/                         # 10+ standard operating procedures
├── 04-Tools/                        # Tool evaluations
├── 05-Plans/                        # Phase plans
├── 06-Decisions/                    # Architecture decision records
├── 07-References/                   # Papers, datasheets
├── 08-Templates/                    # Note templates
└── 09-Assets/images/                # Sketches, renders
    ├── ai-renders/                  # AI-generated concept renders
    ├── refil/                       # Reference photos of gel pen refills
    └── pen-sketch-v0.jpg            # Original hand-drawn sketch
```

## Key Documents

| Document | Description |
|---|---|
| [Hardware Design Spec](docs/01-Project/hardware-design-spec.md) | Complete dimensions, materials, cross-sections for CAD modeling |
| [Architecture](docs/01-Project/architecture.md) | System block diagram, data flow, interface definitions |
| [Requirements](docs/01-Project/requirements.md) | 14 functional + 9 non-functional requirements |
| [Sensor Selection](docs/02-Research/hardware/sensor-selection.md) | ICM-42688-P, FSR 400, IQS263 evaluation |
| [MCU Selection](docs/02-Research/embedded/mcu-selection.md) | nRF52840 vs alternatives analysis |
| [Sensor Fusion Models](docs/02-Research/ml/sensor-fusion-models.md) | MoE architecture, TCN displacement mapping |
| [HID Protocol](docs/02-Research/software/hid-protocol.md) | USB HID digitizer spec for pen input |

## Getting Started

### Browse the Knowledge Base

```bash
# Clone the repository
git clone https://github.com/Bunty9/3d-pen.git

# Open docs/ as an Obsidian vault
# 1. Install Obsidian: https://obsidian.md/
# 2. Open Vault → select the docs/ folder
# 3. Navigate from Home.md
```

### For Contributors

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to any domain.

See [Developer Documentation](docs/DEVELOPER.md) for setup, vault conventions, and agent workflows.

## Multi-Agent Development

This project uses a multi-agent workflow where specialized AI agents work on different domains with exclusive write scopes. See [SOP-0002: Multi-Agent Orchestration](docs/03-SOPs/sop-multi-agent-orchestration.md) for the full protocol.

| Agent | Domain | Write Scope |
|---|---|---|
| hardware-agent | PCB, sensors, mechanical | `02-Research/hardware/` |
| embedded-agent | MCU, firmware, wireless | `02-Research/embedded/` |
| ml-agent | Models, training, inference | `02-Research/ml/` |
| software-agent | HID, drivers, canvas | `02-Research/software/` |
| integration-agent | Cross-domain alignment | `01-Project/architecture.md` |

## Roadmap

- [x] **Phase 1: Research** — Knowledge base with 50+ documents
- [ ] **Phase 2: Design** — Schematic capture, mechanical CAD, firmware architecture, ML model selection
- [ ] **Phase 3: Prototype** — PCB fabrication, component sourcing, firmware MVP, training data collection
- [ ] **Phase 4: Integration** — End-to-end sensor-to-canvas pipeline working

## License

This project is currently in early development. License TBD.

## Acknowledgments

Research informed by analysis of STABILO DigiPen, D-POINT, Livescribe, Neo Smartpen, and the OnHW dataset (Fraunhofer IIS / ACM IMWUT 2020). AI renders generated with Gemini and ChatGPT.
