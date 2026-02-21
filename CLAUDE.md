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
- **`docs/01-Project/3d-pen-MOC.md`** — Master Map of Content linking all 48+ notes
- **`docs/01-Project/vision.md`** — Structured product vision
- **`docs/01-Project/requirements.md`** — Functional & non-functional requirements
- **`docs/01-Project/architecture.md`** — System architecture with data flow and interfaces

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
