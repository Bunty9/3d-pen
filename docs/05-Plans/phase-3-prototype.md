---
title: "Phase 3: Prototype"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - plan
  - meta
  - prototype
related:
  - "[[05-Plans/phase-2-design]]"
---

# Phase 3: Prototype

## Overview

Phase 3 produces the first physical prototype of the 3D Pen — a working end-to-end system from pen sensors to digital canvas strokes.

## Prerequisites

- [ ] Phase 2 design complete and reviewed
- [ ] KiCad schematic and layout finalized
- [ ] Mechanical CAD finalized
- [ ] Firmware compiles on dev kit
- [ ] Virtual HID driver working

## Workstreams

### 3.1 Hardware Prototype

| Task | Details | Vendor/Tool |
|------|---------|-------------|
| Flex PCB fabrication | Order 2-layer flex from JLCPCB or PCBWay | ~$50-150 for prototype qty |
| Component sourcing | ICM-42688-P, nRF52840, FSR 400 Short, IQS263, BQ51003 | DigiKey / Mouser / LCSC |
| PCB assembly | Hand solder or PCBA service for QFN components | Hot air rework station or JLCPCB PCBA |
| Battery sourcing | 10180 Li-ion cell, 70-100mAh | AliExpress / specialized battery suppliers |
| Mechanical shell v1 | SLA 3D print of pen body, inner barrel, nib assembly | Formlabs or Bambu Lab |
| Assembly | Wrap flex PCB, insert components, test fit | Manual |

### 3.2 Firmware MVP

| Task | Details |
|------|---------|
| Sensor bring-up | Read each sensor individually, verify data on logic analyzer |
| ADC pipeline | DMA-driven multi-channel sampling at 8kHz, verify with oscilloscope |
| ESB streaming | Establish wireless link, stream sensor data to receiver dongle |
| Power management | Basic sleep/wake, battery voltage monitoring |
| Debug interface | Flex connector → debug board for firmware upload and UART/RTT logging |

### 3.3 ML Data Collection

| Task | Details |
|------|---------|
| Recording rig | Sensor data logger + synchronized camera or scanner |
| Collection sessions | Write on paper while recording sensor data |
| Ground truth pipeline | Scan paper, extract strokes, align with sensor timestamps |
| Initial training | Train trajectory model on collected data |
| Evaluation | Measure reconstruction error against ground truth |

### 3.4 Software MVP

| Task | Details |
|------|---------|
| Receiver dongle firmware | nRF52840 USB dongle: ESB RX → USB HID |
| Host driver | Read dongle data, pass to ML model, output to virtual HID |
| Virtual pen device | Register as pen digitizer on Linux (uhid) first |
| Test canvas | Browser-based canvas responding to pen input |
| End-to-end test | Write on paper → see strokes on screen in real time |

### 3.5 BOM Placeholder

| Component | Part Number | Qty | Unit Cost (est.) | Source |
|-----------|------------|-----|-------------------|--------|
| MCU | nRF52840-QIAA | 2 | ~$4-6 | DigiKey |
| IMU | ICM-42688-P | 2 | ~$3-5 | DigiKey |
| Pressure sensor | FSR 400 Short | 1 | ~$7-10 | Interlink |
| Touch IC | IQS263 | 1 | ~$1-2 | DigiKey |
| Charging IC | BQ51003 | 1 | ~$3-4 | DigiKey |
| Battery charger | BQ25100 | 1 | ~$2-3 | DigiKey |
| Fuel gauge | MAX17048 | 1 | ~$2-3 | DigiKey |
| Battery | 10180 Li-ion | 1 | ~$3-5 | AliExpress |
| Flex PCB | Custom 2-layer | 5 | ~$10-30 ea | JLCPCB |
| Pen shell | SLA print | 2 | ~$15-25 ea | In-house or service |
| USB dongle PCB | nRF52840 Dongle | 1 | ~$10 | Nordic/DigiKey |
| Misc (passives, connector) | Various | — | ~$10-15 | LCSC |
| **Estimated total** | | | **~$80-150** | |

## Success Criteria

- [ ] Flex PCB fabricated and assembled without shorts
- [ ] All sensors read correctly on the bench
- [ ] 8kHz streaming over ESB to receiver dongle
- [ ] Pen shell fits comfortably, refill inserts/removes smoothly
- [ ] ML model produces visible strokes from real sensor data
- [ ] End-to-end demo: write on paper → see digital strokes

## Risks

| Risk | Mitigation |
|------|-----------|
| Flex PCB manufacturing defects | Order 5+ units, design test points |
| QFN soldering difficulty | Use PCBA service or stencil + reflow |
| Battery capacity too low | Optimize power management firmware first |
| ML model accuracy insufficient | Start with synthetic data, iterate |
| Pen too thick or uncomfortable | Iterate mechanical design quickly via 3D printing |
