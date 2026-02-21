# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**3D Pen** — A smart pen hardware product that uses a standard gel pen refill inside a sensor-laden enclosure. The pen streams real-time sensor data (pressure, accelerometers, capacitive touch) wirelessly to a host, where a deep learning model interprets the data into digital strokes on a 2D canvas. The pen registers as an OS-level input device (like a digital pen) compatible with standard canvas apps.

This is a multi-disciplinary project spanning hardware design, embedded firmware, wireless communication, and ML/software.

## Project Status

Research phase complete. The repository contains an Obsidian vault knowledge base with 48+ documents covering all domains. No code or firmware exists yet — the vault is the foundation for all future design and development work.

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

## Obsidian Vault Knowledge Base

The `docs/` directory is an Obsidian vault. Open it in Obsidian for best navigation.

### Entry Points
- **`docs/Home.md`** — Vault home page with navigation to all sections
- **`docs/01-Project/3d-pen-MOC.md`** — Master Map of Content linking all 50+ notes
- **`docs/01-Project/vision.md`** — Structured product vision
- **`docs/01-Project/requirements.md`** — Functional & non-functional requirements
- **`docs/01-Project/architecture.md`** — System architecture with data flow and interfaces
- **`docs/01-Project/hardware-design-spec.md`** — Complete hardware geometry, materials, and dimensions for AI renders/CAD

### Vault Structure
```
docs/
├── Home.md                    # Vault entry point
├── 00-Inbox/                  # Raw/unprocessed notes
├── 01-Project/                # Vision, requirements, architecture, MOC
├── 02-Research/               # Domain research notes
│   ├── hardware/              # Flex PCB, sensors, charging, mechanical
│   ├── embedded/              # MCU, wireless, firmware, power
│   ├── ml/                    # Sensor fusion, training, inference
│   └── software/              # HID, drivers, canvas, OS integration
├── 03-SOPs/                   # 10 standard operating procedures
├── 04-Tools/                  # Tool evaluations (5 documents)
├── 05-Plans/                  # Phase plans and automation strategy
├── 06-Decisions/              # Architecture decision records
├── 07-References/             # Datasheets, papers
├── 08-Templates/              # 5 note templates
└── 09-Assets/images/          # Sketches, diagrams
```

### SOP Reading Order (for agents)
1. `docs/03-SOPs/sop-vault-contribution.md` — **Read first.** Frontmatter schema, naming, linking rules.
2. `docs/03-SOPs/sop-multi-agent-orchestration.md` — Agent roster, write scopes, handoff protocol.
3. `docs/03-SOPs/sop-research-agent.md` — Research methodology, citation format.
4. Domain-specific SOP (one of: `sop-hardware-agent.md`, `sop-embedded-agent.md`, `sop-ml-agent.md`, `sop-software-agent.md`)

### Agent Workflow Reference
- Each domain agent has an **exclusive write scope** (see SOP-0002 for roster table)
- All vault notes must have **YAML frontmatter** (see SOP-0001 for schema)
- Research notes follow `docs/08-Templates/_research-note.md` template
- Commits use format: `docs({domain}): {description}`
- Cross-domain conflicts go to `docs/06-Decisions/` as decision log entries

## Context Bundles (for agents)

Pre-distilled knowledge from completed research. Load the relevant bundle before working on a domain task.

### Hardware Context
- **Pen geometry**: 150mm x 11mm outer, 110mm x 6mm refill, 2.5mm annular gap for all electronics
- **Flex PCB**: 2-layer pure flex (polyimide) + stiffeners, helical wrap, rolled annealed copper, R ≥ 6×T bend radius, JLCPCB/PCBWay can manufacture
- **IMU**: TDK ICM-42688-P (2.5x3.0x0.91mm, 32kHz max ODR, SPI/I2C) — 2 units, one each end
- **Pressure**: Interlink FSR 400 Short (0.3mm thick, 5.6mm active area) for prototyping; PVDF piezo film for production; also consider GaPO4 crystals (Piezocryst T-Series, 3.5mm, 170kHz)
- **Touch**: Azoteq IQS263 (2x2x0.75mm DFN, built-in slider, proximity detection)
- **Charging**: TI BQ51003 Qi receiver + BQ25100 charger; also investigate Renesas WattUp RF option
- **Battery**: 10180 cylindrical Li-ion (10mm x 18mm, 70-100mAh)
- **Component height budget**: PCB+components ≤ 1.17mm leaves 1.33mm margin in 2.5mm gap
- **Shell**: Consider 11.5-12mm OD (11mm flagged as extremely tight); PC or ABS, 14-22g target weight
- **Prior art**: STABILO DigiPen (5 sensors, commercial), D-POINT (ArUco+IMU, open-source), Pen-Digitizer (ESP32+BLE, had drift/latency issues)

### Embedded Context
- **MCU**: nRF52840 (QFN48, 6x6mm, ARM Cortex-M4F, 256KB RAM, 1MB flash, integrated 2.4GHz radio, 200ksps 12-bit ADC with DMA)
- **Wireless**: Nordic ESB at 2Mbps (primary, ~500µs latency); BLE secondary for config/DFU. Throughput math: 6ch × 8kHz × 16-bit = 768kbps raw, ~920kbps with overhead — ESB at 2Mbps gives 2x margin
- **Firmware**: Zephyr RTOS via nRF Connect SDK; DMA-driven ADC, cooperative threads, double-buffered ring buffers; 150-200KB flash footprint
- **Power**: ~5.8mA active (optimistic), ~10mA (pessimistic); 100mAh cell → 8-14+ hours; MAX17048 fuel gauge; 3-state power management (Active/Idle/Deep Sleep)
- **Motion Sync**: Synchronize sensor sampling with wireless TX window to reduce deterministic delay to 0.0625ms at 8kHz
- **Key repos**: nRF52_Mesh (ESB reference), embedded-debugger-mcp (agent debugging via probe-rs), mcp-gdb (GDB agent integration)

### ML Context
- **Architecture**: Mixture-of-Experts — Touching Expert (TCN, 2D stroke mapping) + Hovering Expert (3D positioning, drift correction); Reset Switch via LDA for static state detection
- **Key papers**: MoE trajectory (Imbert, 2025), ECHWR contrastive learning (Li, 2025), REWI CNN+BiLSTM (Li, iWOAR 2025)
- **Key repos**: REWI (writer-independent recognition), IMU2Text (CNN+GNN, 99.74%), imu_mnist (simple baseline)
- **Dataset**: OnHW (STABILO, 14 IMU channels, 100Hz, 31K chars, 119 writers) — most relevant existing dataset
- **Training**: DTW for sensor-scan alignment; writer-based train/val/test splits; augmentation: jitter, rotation, time warp, channel dropout
- **Inference**: RT-TCN for O(1) streaming; ONNX Runtime on desktop; target <10ms latency; 5ms windowed inference (40 samples at 8kHz)
- **Framework**: PyTorch (ADOPT), DVC for data versioning, W&B for experiment tracking

### Software Context
- **HID**: Usage Page 0x0D (Digitizers), Usage 0x02 (Pen); 12-byte report: X, Y, pressure, tilt X/Y, tip switch, barrel button, in-range, eraser
- **Haptic Pen**: Windows supports WAVEFORM_CLICK, WAVEFORM_INKCONTINUOUS via HID haptic collection (Usage Page 0x0E)
- **Virtual HID per OS**: Linux: uhid/uinput + `BTN_TOOL_PEN` + `INPUT_PROP_DIRECT`; Windows: VHF (KMDF) or vhidmini2 (UMDF); macOS: IOHIDUserDevice + proximity events
- **Host receiver**: HIDAPI library for USB dongle communication; Tauri (Rust backend) for host app
- **Canvas**: Pointer Events API (cross-platform); Catmull-Rom→Bezier for smooth strokes; pressure curve mapping (gamma/S-curve)
- **Reference**: OpenTabletDriver (cross-platform architecture, daemon/GUI split, platform-specific output modules)

### Hardware Design Quick Reference (for renders/CAD)
- **Full spec**: `docs/01-Project/hardware-design-spec.md` — 13-section comprehensive reference
- **Overall**: 150mm L x 11.5mm OD, 6.0mm bore, 2.75mm annular gap, 20-28g
- **12 parts (nib→cap)**: Nib cone (POM black), nib thread (POM black, M10x0.75), O-ring (silicone), refill (6mm), inner shell (POM cream, 7mm OD), flex PCB (amber polyimide, 230x10mm flat, helical wrap), stiffeners (x5 PI), battery (10180, silver), TPE grip (35mm, dark gray), 2x outer shell halves (PC matte black), end cap (PC/Al)
- **6 axial zones**: N=nib(0-15mm), A=pressure+IMU1(15-55mm), B=touch+wake(55-80mm), C=MCU+radio(80-110mm), D=power+IMU2(110-135mm), E=cap+Qi coil(135-150mm)
- **Key components on flex PCB**: 2x ICM-42688-P (0.91mm), nRF52840 QFN48 (6x6x0.85mm), IQS263 (2x2x0.75mm), ADXL367 (2.2x2.3x0.87mm), BQ51003 (4x4x0.8mm), BQ25100, MAX17048, FSR 400 Short (0.3mm), PCB IFA antenna
- **Shell**: 2-half split (longitudinal), ultrasonic weld or screw; PC (14-22g) or Al 6061 (19-32g)
- **Colorways**: Stealth Black (matte black PC, RAL 9005), Silver Studio (anodized Al), Translucent Tech (smoke PC)
- **Charging cradle**: 40mm dia x 40mm tall disc, 12mm bore, Qi TX pad at base, USB-C power

### Cross-Domain Interfaces (TBD — integration-agent will fill)
- Sensor → MCU: ADC channels, SPI/I2C bus, voltage levels, sampling sequence
- MCU → Wireless: ESB packet format (header + 6ch×16-bit payload + checksum)
- Wireless → Host: USB HID or vendor-specific on receiver dongle
- Host → ML: Input tensor shape, channel order, normalization
- ML → Virtual HID: Output (x, y, pressure, tilt_x, tilt_y), coordinate range
- Virtual HID → OS: HID report descriptor, report rate

## Conversation History

Raw research conversations from Gemini and ChatGPT are preserved in `docs/00-Inbox/`:
- `gemini-thinking-raw.md`, `gemini-report-raw.md` — Gemini deep research with URLs and analysis
- `chatgpt-thinking-raw.md`, `chatgpt-report-raw.md` — ChatGPT research plan with citations
- `ideation-v0.0-raw.md` — Original project ideation

These have been processed into vault notes. The curated reference library is at `docs/07-References/papers/curated-references.md`.
