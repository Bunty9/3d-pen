---
title: "Phase 2: Design"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - plan
  - meta
  - design
related:
  - "[[05-Plans/phase-1-research]]"
  - "[[05-Plans/phase-3-prototype]]"
---

# Phase 2: Design

## Overview

Phase 2 translates research findings into concrete designs across all domains. Each domain produces deliverables that feed into Phase 3 prototyping.

## Prerequisites

- [ ] Phase 1 research complete and reviewed ([[05-Plans/phase-1-research]])
- [ ] High-priority gaps resolved (outer diameter decision, interface contracts)
- [ ] Integration-agent review of all cross-domain interfaces

## Design Workstreams

### 2.1 Hardware Design

| Task | Deliverable | Tool | Dependencies |
|------|-------------|------|-------------|
| Flex PCB schematic | KiCad schematic with all components | KiCad 8+ | Sensor selection, MCU selection finalized |
| Flex PCB layout | Flattened helical layout with DRC pass | KiCad 8+ | Schematic complete, geometry calculated |
| Mechanical CAD | Pen shell, inner barrel, nib assembly | Fusion 360 | Outer diameter decided |
| Power circuit design | Charging + battery management subcircuit | KiCad + LTspice | Charging IC, battery selected |
| Antenna design | 2.4GHz PCB trace antenna on flex | KiCad + simulation | RF layout rules researched |
| BOM v1 | Complete bill of materials with sourcing | Spreadsheet | All components selected |

### 2.2 Embedded Design

| Task | Deliverable | Tool | Dependencies |
|------|-------------|------|-------------|
| Firmware architecture document | Module diagram, task flow, memory map | Markdown + diagrams | MCU selected, Zephyr confirmed |
| ADC pipeline design | DMA config, sampling sequence, buffer layout | Code + docs | Sensor interfaces defined |
| Wireless protocol spec | ESB packet format, timing, error handling | Specification doc | Throughput analysis |
| Power state machine | State diagram, transition triggers, power targets | Diagram + code | Power budget confirmed |
| Receiver dongle firmware | ESB RX → USB HID relay firmware | nRF Connect SDK | ESB protocol spec |

### 2.3 ML Design

| Task | Deliverable | Tool | Dependencies |
|------|-------------|------|-------------|
| Model architecture selection | Chosen architecture with rationale | PyTorch prototype | Research review |
| Data collection protocol | Step-by-step recording + scanning procedure | Document | Sensor data format defined |
| Training infrastructure setup | PyTorch project, DVC pipeline, W&B integration | Code + config | Tools installed |
| Synthetic data generator | Simulated sensor data for early model dev | Python script | Sensor noise profiles from hardware |
| Inference pipeline design | Streaming input → model → output specification | Architecture doc | Latency budget allocated |

### 2.4 Software Design

| Task | Deliverable | Tool | Dependencies |
|------|-------------|------|-------------|
| Virtual HID driver (Linux first) | uhid-based pen device driver | C / Rust | HID report descriptor finalized |
| Host receiver library | USB communication with dongle | HIDAPI / libusb | Receiver dongle protocol |
| Test canvas application | Simple pressure-sensitive drawing app | HTML5 Canvas + Pointer Events | Virtual HID working |
| Cross-platform abstraction design | Architecture for Win/Mac/Linux support | Design doc | Per-OS driver research |

## Ordering & Dependencies

```
                    ┌─────────────────┐
                    │ Resolve Gaps     │
                    │ (Diameter, IFs) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │ HW Schematic │ │ FW Arch  │ │ ML Model Sel │
      └──────┬───────┘ └────┬─────┘ └──────┬───────┘
             │              │              │
      ┌──────▼───────┐ ┌───▼──────┐ ┌─────▼────────┐
      │ HW Layout    │ │ ESB Spec │ │ Data Protocol│
      └──────┬───────┘ └────┬─────┘ └──────┬───────┘
             │              │              │
             └──────┬───────┘              │
                    ▼                      │
           ┌────────────────┐              │
           │ Receiver Dongle│              │
           └────────┬───────┘              │
                    │                      │
              ┌─────▼──────┐        ┌──────▼───────┐
              │ Host Driver│        │ Train Infra  │
              └─────┬──────┘        └──────────────┘
                    │
              ┌─────▼──────┐
              │ Test Canvas │
              └────────────┘
```

## Success Criteria for Phase 2

- [ ] KiCad schematic passes ERC
- [ ] Flex PCB layout passes DRC and manufacturer DFM
- [ ] Mechanical CAD model is printable (SLA/FDM)
- [ ] Firmware compiles and runs on nRF52840-DK
- [ ] ADC reads simulated sensor inputs at 8kHz
- [ ] ESB wireless link established between two nRF52840-DKs
- [ ] ML model trains on synthetic data
- [ ] Virtual HID pen device recognized by OS
- [ ] Test canvas responds to virtual pen input

## Estimated Duration

6-10 weeks, with hardware and software tracks running in parallel.
