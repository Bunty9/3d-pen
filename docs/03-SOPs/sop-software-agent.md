---
title: "SOP-0007: Software Agent"
sop_id: "SOP-0007"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - software
  - agent
---

# SOP-0007: Software Agent

## Purpose & Scope

Defines the role, responsibilities, and procedures for the software domain agent. This agent covers HID protocol implementation, OS device drivers, canvas rendering, and OS-level input device registration.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read
- [ ] [[sop-research-agent|SOP-0003]] read
- [ ] [[vision|Project Vision]] read
- [ ] [[requirements|Requirements]] read

## Domain Scope

### In Scope

| Area | Details |
|------|---------|
| HID protocol | USB HID digitizer spec, HID Usage Tables, report descriptors |
| Device drivers | Virtual HID creation per OS (Windows, macOS, Linux) |
| Canvas rendering | Digital ink rendering, pressure curves, Bezier fitting |
| OS input registration | Registering as a system-level pen/digitizer input device |
| Host wireless stack | USB receiver side — communicating with pen's wireless protocol |
| Cross-platform abstraction | Unified API across Windows, macOS, Linux |

### Explicit Boundaries — NOT In Scope

| Area | Owned By |
|------|----------|
| Pen firmware / wireless protocol implementation | `embedded-agent` (SOP-0005) |
| ML model / inference | `ml-agent` (SOP-0006) |
| Hardware / PCB / antenna | `hardware-agent` (SOP-0004) |

## Research Priorities

1. **HID digitizer spec** — USB HID Usage Tables section 13 (Digitizers). How pen digitizers report x, y, pressure, tilt, barrel switch, eraser. How Wacom and other vendors structure their HID report descriptors.
2. **OS input device registration** — How to create virtual pen/digitizer input devices on Windows (UMDF/KMDF), macOS (IOKit/IOHIDUserDevice), and Linux (uhid/uinput). Requirements for the OS to recognize it as a pen (not a mouse).
3. **Virtual HID creation** — Libraries and frameworks for creating virtual HID devices. Existing open-source implementations. User-mode vs kernel-mode trade-offs.
4. **Canvas rendering** — Windows Ink API, macOS NSEvent tablet events, HTML5 Canvas + Pointer Events. Pressure-to-width mapping curves. Bezier curve fitting for smooth strokes.
5. **Host wireless stack** — USB receiver firmware/software. libusb/hidapi for communicating with a custom wireless receiver dongle.

## Cross-Domain Interface Points

| Interface | With Agent | Key Questions |
|-----------|-----------|---------------|
| Wireless data → host software | embedded-agent | Packet format, USB interface on receiver, error handling |
| ML output → HID input | ml-agent | Coordinate format, pressure range, update rate, buffering |
| HID report → OS | (self) | Report descriptor structure, feature reports, input reports |
| Canvas API → user app | (self) | How third-party apps consume pen input events |

## Required Tool Evaluations

Document in `04-Tools/tools-software.md`:
- libusb / hidapi
- Tauri / Electron (host app framework)
- WebHID API
- evdev (Linux)
- Windows Ink API
- Canvas rendering libraries (Paper.js, Fabric.js, raw Canvas 2D)

## Procedure

1. Read all prerequisite docs
2. For each research priority, follow [[sop-research-agent|SOP-0003]] methodology
3. Create research notes in `02-Research/software/` using [[_research-note|Research Note Template]]
4. Document tool evaluations in `04-Tools/tools-software.md`
5. Update [[01-Project/3d-pen-MOC|MOC]] with links to new notes
6. Complete handoff per [[sop-multi-agent-orchestration|SOP-0002]]

## Quality Checklist

- [ ] HID research includes actual report descriptor examples
- [ ] OS driver research covers all 3 platforms (Win/Mac/Linux)
- [ ] Virtual HID approach identified for each platform
- [ ] Canvas rendering research includes pressure curve handling
- [ ] Cross-platform feasibility assessed
- [ ] Cross-domain interfaces documented with data formats

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
