---
title: "3D Pen — Map of Content"
domain: "meta"
status: "final"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - moc
  - meta
  - index
---

# 3D Pen — Map of Content

Master index of all project knowledge organized by domain.

## Project Foundation

- [[01-Project/vision|Vision]] — Product concept, features, target user, constraints
- [[01-Project/requirements|Requirements]] — Functional & non-functional requirements
- [[01-Project/architecture|Architecture]] — System design, data flow, interfaces

## Hardware Domain

- [[02-Research/hardware/flex-pcb-design|Flex PCB Design]] — Helical flex PCB geometry, manufacturing, materials
- [[02-Research/hardware/sensor-selection|Sensor Selection]] — Piezo pressure, MEMS IMU, capacitive touch ICs
- [[02-Research/hardware/wireless-charging|Wireless Charging]] — Qi on flex PCB, coil geometry, charging ICs
- [[02-Research/hardware/mechanical-design|Mechanical Design]] — Pen shell, nib thread, refill compatibility, thermal
- [[02-Research/hardware/prior-art-smart-pens|Prior Art Smart Pens]] — STABILO, D-POINT, Pen-Digitizer, Livescribe, Neo Smartpen
- [[02-Research/hardware/manufacturing-pune|Manufacturing — Pune]] — Local PCB/PCBA fabrication ecosystem
- [[02-Research/hardware/advanced-sensor-options|Advanced Sensor Options]] — GaPO4 piezo, ADXL367, WattUp RF charging, Motion Sync

## Embedded Domain

- [[02-Research/embedded/mcu-selection|MCU Selection]] — nRF52840, nRF5340, ESP32-S3, STM32WB55 comparison
- [[02-Research/embedded/wireless-protocols|Wireless Protocols]] — BLE 5.x, Nordic ESB, custom 2.4GHz analysis
- [[02-Research/embedded/firmware-architecture|Firmware Architecture]] — RTOS vs bare-metal, DMA-driven ADC, interrupt design
- [[02-Research/embedded/power-management|Power Management]] — Battery, power budget, sleep modes, charging firmware
- [[02-Research/embedded/open-source-firmware|Open-Source Firmware & MCP Tools]] — nRF52_Mesh, embedded-debugger-mcp, mcp-gdb, gaming mouse firmware

## ML Domain

- [[02-Research/ml/sensor-fusion-models|Sensor Fusion Models]] — IMU trajectory reconstruction, drift correction, deep learning fusion
- [[02-Research/ml/handwriting-recognition|Handwriting Recognition]] — Online recognition from stroke data, recurrent models
- [[02-Research/ml/training-pipeline|Training Pipeline]] — Data collection, ground truth alignment, augmentation
- [[02-Research/ml/realtime-inference|Real-Time Inference]] — Streaming architectures, latency optimization, deployment
- [[02-Research/ml/open-source-implementations|Open-Source ML Implementations]] — REWI, IMU2Text, imu_mnist, D-POINT, OnHW dataset

## Software Domain

- [[02-Research/software/hid-protocol|HID Protocol]] — USB HID digitizer spec, report descriptors, virtual HID
- [[02-Research/software/device-drivers|Device Drivers]] — Windows/macOS/Linux virtual HID creation
- [[02-Research/software/canvas-rendering|Canvas Rendering]] — Digital ink, pressure curves, Bezier fitting
- [[02-Research/software/os-input-registration|OS Input Registration]] — Virtual input devices, cross-platform abstraction
- [[02-Research/software/haptic-pen-hid|Haptic Pen HID]] — Microsoft Haptic Pen spec, waveforms, haptic feedback via HID

## Tools & Evaluations

- [[04-Tools/tools-hardware|Hardware Tools]] — KiCad, Altium, LTspice, Fusion 360, JLCPCB DFM
- [[04-Tools/tools-embedded|Embedded Tools]] — PlatformIO, Zephyr, nRF Connect SDK, debuggers
- [[04-Tools/tools-ml|ML Tools]] — PyTorch, ONNX Runtime, W&B, Label Studio, DVC
- [[04-Tools/tools-software|Software Tools]] — libusb, hidapi, Tauri, WebHID, Canvas libraries
- [[04-Tools/tools-agents|Agent Tools]] — Claude Code, MCP servers, Obsidian plugins

## SOPs

- [[03-SOPs/sop-vault-contribution|SOP-0001: Vault Contribution Standards]]
- [[03-SOPs/sop-multi-agent-orchestration|SOP-0002: Multi-Agent Orchestration]]
- [[03-SOPs/sop-research-agent|SOP-0003: Research Agent Methodology]]
- [[03-SOPs/sop-hardware-agent|SOP-0004: Hardware Agent]]
- [[03-SOPs/sop-embedded-agent|SOP-0005: Embedded Agent]]
- [[03-SOPs/sop-ml-agent|SOP-0006: ML Agent]]
- [[03-SOPs/sop-software-agent|SOP-0007: Software Agent]]
- [[03-SOPs/sop-integration-agent|SOP-0008: Integration Agent]]
- [[03-SOPs/sop-review-agent|SOP-0009: Review Agent]]
- [[03-SOPs/sop-documentation-agent|SOP-0010: Documentation Agent]]

## Plans

- [[05-Plans/phase-1-research|Phase 1: Research]] — Current phase
- [[05-Plans/phase-2-design|Phase 2: Design]] — Schematic, mechanical, firmware, ML, software
- [[05-Plans/phase-3-prototype|Phase 3: Prototype]] — PCB fab, components, firmware MVP, data collection
- [[05-Plans/automation-strategy|Automation Strategy]] — Vault validation, CI, agent workflows

## References

- [[07-References/papers/curated-references|Curated Reference Library]] — All papers, repos, datasheets, manufacturers, patents

## Raw Conversations (Inbox)

- [[00-Inbox/gemini-thinking-raw|Gemini Thinking]] — Deep research with web sources
- [[00-Inbox/gemini-report-raw|Gemini Report]] — Structured analysis and synthesis
- [[00-Inbox/chatgpt-thinking-raw|ChatGPT Thinking]] — Research exploration process
- [[00-Inbox/chatgpt-report-raw|ChatGPT Report]] — Comprehensive research plan
- [[00-Inbox/ideation-v0.0-raw|Original Ideation]] — Raw project idea

## Decisions

> Decision logs will be added here as architectural decisions are made.
