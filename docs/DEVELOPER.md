# Developer Documentation

Guide for developers and AI agents working on the 3D Pen project.

## Prerequisites

- [Obsidian](https://obsidian.md/) — for navigating the knowledge vault
- [Git](https://git-scm.com/) — version control
- [GitHub CLI](https://cli.github.com/) (`gh`) — for PR workflows

### Phase 2+ Tools (not needed yet)

- [KiCad 8+](https://www.kicad.org/) — schematic capture and PCB layout
- [Fusion 360](https://www.autodesk.com/products/fusion-360/) — mechanical CAD and simulation
- [nRF Connect SDK](https://www.nordicsemi.com/Products/Development-software/nRF-Connect-SDK) — firmware development (Zephyr RTOS)
- [PyTorch](https://pytorch.org/) — ML model training
- [Rust + Tauri](https://tauri.app/) — host application

## Setup

```bash
# Clone
git clone https://github.com/Bunty9/3d-pen.git
cd 3d-pen

# Open the vault in Obsidian
# File → Open Vault → select the docs/ folder

# Navigate from Home.md or 01-Project/3d-pen-MOC.md
```

## Vault Structure

The `docs/` directory is an Obsidian vault. All project knowledge lives here.

### Folder Map

| Folder | Purpose | Who Writes |
|---|---|---|
| `00-Inbox/` | Raw unprocessed notes, conversation dumps | Anyone |
| `01-Project/` | Vision, requirements, architecture, design specs | Orchestrator, integration-agent |
| `02-Research/hardware/` | Flex PCB, sensors, charging, mechanical design | hardware-agent |
| `02-Research/embedded/` | MCU, firmware, wireless protocols, power | embedded-agent |
| `02-Research/ml/` | Sensor fusion, training pipeline, inference | ml-agent |
| `02-Research/software/` | HID protocol, device drivers, canvas rendering | software-agent |
| `03-SOPs/` | Standard operating procedures | Orchestrator |
| `04-Tools/` | Tool evaluation documents | Domain agents |
| `05-Plans/` | Phase plans, roadmaps | Orchestrator |
| `06-Decisions/` | Architecture decision records (ADRs) | integration-agent, review-agent |
| `07-References/` | Curated papers, datasheets, links | research-agent |
| `08-Templates/` | Note templates for each document type | Orchestrator |
| `09-Assets/` | Images, sketches, renders | Anyone |

### Frontmatter Schema

Every vault note must have YAML frontmatter:

```yaml
---
title: "Note Title"
domain: "hardware"          # hardware | embedded | ml | software | meta
status: "draft"             # draft | review | final
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"    # agent name or human name
tags:
  - research
  - hardware
  - sensors
related:
  - "[[other-note]]"
---
```

### Linking Conventions

- Use `[[wikilinks]]` for internal references
- Use `[[path/to/note|Display Name]]` for cross-folder links
- Never use raw file paths in note content
- External URLs go in the `## References` section at the bottom

### File Naming

- Lowercase, hyphen-separated: `sensor-selection.md`, `flex-pcb-design.md`
- No spaces, no special characters
- Descriptive names that indicate the note's primary topic

## Key Documents to Read First

1. **[Vision](01-Project/vision.md)** — understand the product concept
2. **[Requirements](01-Project/requirements.md)** — functional and non-functional requirements
3. **[Architecture](01-Project/architecture.md)** — system design and data flow
4. **[Hardware Design Spec](01-Project/hardware-design-spec.md)** — physical geometry and materials
5. **[SOP-0001: Vault Contribution](03-SOPs/sop-vault-contribution.md)** — rules for writing notes
6. **[SOP-0002: Multi-Agent Orchestration](03-SOPs/sop-multi-agent-orchestration.md)** — agent roles and write scopes

## Agent Workflow

### Agent Roster

| Agent ID | Domain | Exclusive Write Scope | Tools |
|---|---|---|---|
| `hardware-agent` | Hardware | `02-Research/hardware/`, `04-Tools/tools-hardware.md` | KiCad, LTspice, Fusion 360 |
| `embedded-agent` | Embedded | `02-Research/embedded/`, `04-Tools/tools-embedded.md` | Zephyr, nRF Connect SDK |
| `ml-agent` | ML | `02-Research/ml/`, `04-Tools/tools-ml.md` | PyTorch, ONNX Runtime |
| `software-agent` | Software | `02-Research/software/`, `04-Tools/tools-software.md` | HIDAPI, Tauri, libusb |
| `integration-agent` | Cross-domain | `01-Project/architecture.md`, `01-Project/requirements.md` | — |
| `review-agent` | Quality | `06-Decisions/` | — |
| `orchestrator` | Meta | `Home.md`, `01-Project/3d-pen-MOC.md`, `03-SOPs/`, `05-Plans/` | — |

### Context Loading

Before working on a domain task, load the relevant context bundle from `CLAUDE.md`:

- **Hardware Context** — pen geometry, component selections, flex PCB constraints
- **Embedded Context** — MCU specs, wireless protocol math, firmware architecture
- **ML Context** — model architecture, dataset info, inference latency targets
- **Software Context** — HID protocol, virtual device creation, canvas rendering

### Creating New Research Notes

1. Copy `08-Templates/_research-note.md` as your starting template
2. Fill in all frontmatter fields (domain, status, author, tags)
3. Write all sections: Summary, Context, Key Findings, Relevance, Open Questions, Recommendations, References
4. Include at least 3 references with URLs
5. Update `01-Project/3d-pen-MOC.md` with a link to your new note
6. Commit with format: `docs({domain}): {description}`

### Commit Conventions

```
docs(hardware): add flex PCB bend radius analysis
docs(embedded): update MCU selection with nRF5340 comparison
docs(ml): add REWI architecture deep-dive
docs(project): update requirements with latency budget
docs(meta): update MOC with new research links
```

## Domain-Specific Development Guides

### Hardware Development (Phase 2)

- Schematic capture in KiCad 8
- Flex PCB layout following IPC-2223 bend radius rules
- Component placement must follow the zone map in `hardware-design-spec.md`
- DFM check with JLCPCB flex PCB capabilities
- Mechanical CAD in Fusion 360 (pen shell, inner shell, nib section)

### Embedded Development (Phase 2-3)

- Firmware in C using Zephyr RTOS via nRF Connect SDK
- Build with `west build`, flash with `west flash`
- Primary reference: Nordic nRF Desktop application
- DMA-driven ADC for sensor acquisition
- ESB wireless protocol at 2Mbps

### ML Development (Phase 2-3)

- PyTorch for model training
- DVC for data versioning
- OnHW dataset as initial training data (100Hz, needs upsampling for 8kHz)
- ONNX Runtime for desktop inference
- Target: <10ms inference latency

### Software Development (Phase 2-3)

- Host app in Rust + Tauri
- HIDAPI for USB dongle communication
- Virtual HID device per OS (uhid on Linux, VHF on Windows, IOHIDUserDevice on macOS)
- Pointer Events API for canvas rendering

## Useful Commands

```bash
# Check vault health (broken wikilinks)
grep -r '\[\[' docs/ | grep -v node_modules | grep -oP '\[\[([^\]]+)\]\]' | sort -u

# Count documents by domain
find docs/02-Research -name '*.md' | wc -l

# Check frontmatter completeness
grep -rL '^---' docs/02-Research/

# View git history for a domain
git log --oneline -- docs/02-Research/hardware/

# Search across all research notes
grep -ri "ICM-42688" docs/02-Research/
```

## MCP Server Integration (for AI agents)

The project supports AI-assisted development via MCP servers:

- **embedded-debugger-mcp** — Flash firmware, read registers, RTT logging on physical hardware
- **mcp-gdb** — Source-level debugging via GDB
- **MCP Inspector** — Visual testing of MCP servers

See `docs/02-Research/embedded/open-source-firmware.md` for configuration details.
