---
title: "SOP-0005: Embedded Agent"
sop_id: "SOP-0005"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - embedded
  - agent
---

# SOP-0005: Embedded Agent

## Purpose & Scope

Defines the role, responsibilities, and procedures for the embedded domain agent. This agent covers MCU firmware, sensor acquisition pipeline, wireless communication stack, power management firmware, and OTA updates.

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
| MCU selection (firmware features) | ADC channels, DMA, interrupt system, wireless stack, SDK, power modes |
| Wireless protocol | BLE 5.x, Nordic ESB, custom 2.4GHz — throughput, latency, reliability |
| RTOS / bare-metal | Zephyr, FreeRTOS, bare-metal comparison for streaming workload |
| Sensor acquisition | DMA-driven ADC, multi-channel sampling, interrupt priorities, ring buffers |
| Power management firmware | Sleep modes, wake triggers, dynamic clock scaling, battery monitoring |
| OTA updates | Firmware update over wireless, bootloader design, rollback |

### Explicit Boundaries — NOT In Scope

| Area | Owned By |
|------|----------|
| PCB layout / component packages / antenna design | `hardware-agent` (SOP-0004) |
| ML model / inference / training | `ml-agent` (SOP-0006) |
| Host software / drivers / HID | `software-agent` (SOP-0007) |

## Research Priorities

1. **MCU selection (firmware perspective)** — nRF52840, nRF5340, ESP32-S3, STM32WB55, RP2040+radio. Focus on: ADC channels/resolution, DMA capabilities, integrated wireless, SDK maturity, power modes.
2. **Wireless protocol analysis** — BLE 5.x throughput/latency limits, Nordic ESB (gaming mouse protocol), custom 2.4GHz. Key calculation: 6 sensors × 8kHz × 16-bit = ~768kbps minimum throughput.
3. **Firmware architecture** — Bare-metal vs Zephyr vs FreeRTOS. DMA-driven ADC pipeline, interrupt priorities, wireless stack integration, memory footprint.
4. **Power management** — Li-ion/LiPo charging firmware, power budget per subsystem, sleep mode strategies, battery monitoring IC interfacing.

## Cross-Domain Interface Points

| Interface | With Agent | Key Questions |
|-----------|-----------|---------------|
| Sensor hardware ↔ ADC config | hardware-agent | Which ADC channels, what voltage levels, analog vs digital sensors |
| MCU package ↔ firmware | hardware-agent | Available pins, package constraints on peripheral access |
| Wireless data format ↔ host | software-agent | Packet structure, error detection, flow control |
| Sensor data stream ↔ ML input | ml-agent | Data format, sample rate, channel ordering, timestamps |
| Power states ↔ charging hardware | hardware-agent | Charging IC control interface, battery fuel gauge |

## Required Tool Evaluations

Document in `04-Tools/tools-embedded.md`:
- PlatformIO
- Zephyr + west build system
- nRF Connect SDK
- Arduino framework
- OpenOCD / J-Link (debugger)
- Saleae / PulseView (logic analyzer)

## Procedure

1. Read all prerequisite docs
2. For each research priority, follow [[sop-research-agent|SOP-0003]] methodology
3. Create research notes in `02-Research/embedded/` using [[_research-note|Research Note Template]]
4. Document tool evaluations in `04-Tools/tools-embedded.md`
5. Update [[01-Project/3d-pen-MOC|MOC]] with links to new notes
6. Complete handoff per [[sop-multi-agent-orchestration|SOP-0002]]

## Quality Checklist

- [ ] MCU comparison includes quantitative specs (ADC channels, DMA, RAM, flash, power)
- [ ] Wireless throughput analysis shows math for 8kHz streaming feasibility
- [ ] RTOS comparison includes memory footprint and real-time guarantees
- [ ] Power budget accounts for all subsystems
- [ ] Cross-domain interfaces documented with data formats

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
