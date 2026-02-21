---
title: "Curated Reference Library"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - references
  - meta
  - bibliography
related:
  - "[[01-Project/3d-pen-MOC]]"
---

# Curated Reference Library

All references gathered from prior research conversations (Gemini, ChatGPT) and domain agent research, organized by topic.

## Academic Papers — IMU Handwriting

| Paper | Authors | Source | Relevance |
|-------|---------|--------|-----------|
| [Mixture-of-experts for handwriting trajectory reconstruction from IMU sensors](https://www.researchgate.net/publication/MoE-handwriting-trajectory) | Imbert et al. | Pattern Recognition, 2025 | Core architecture: touching/hovering expert networks |
| [Enhancing IMU-Based Online Handwriting Recognition via Contrastive Learning (ECHWR)](https://arxiv.org/abs/ECHWR) | Li et al. | arXiv, 2025 | 7-10% accuracy improvement, zero inference overhead |
| [REWI: Robust and Efficient Writer-Independent IMU-Based Handwriting Recognition](https://github.com/jindongli24/REWI) | Li et al. | iWOAR, 2025 | CNN+BiLSTM, 7.37% CER, writer-independent |
| [Deep-Learning-Based Character Recognition from IMU and Force Sensors](https://tohoku.elsevierpure.com) | Tohoku Univ. | Sensors/MDPI, 2022 | CNN, LSTM, DNN, ViT comparison on pen sensor data |
| [Digitizing Handwriting with a Sensor Pen: A Writer-Independent Recognizer](https://ar5iv.labs.arxiv.org/abs/2107.03704) | STABILO team | arXiv, 2021 | STABILO DigiPen dataset and CNN model |
| [Towards an IMU-based Pen Online Handwriting Recognizer](https://www.researchgate.net/publication/IMU-pen-recognizer) | — | ResearchGate | IMU pen tracking fundamentals |
| [Handwriting Trajectory Reconstruction Using Low-Cost IMU](https://www.researchgate.net/publication/trajectory-low-cost-imu) | — | ResearchGate | Low-cost IMU trajectory methods |

## Open-Source Repositories

| Repo | URL | What It Does | Relevance |
|------|-----|-------------|-----------|
| REWI | [jindongli24/REWI](https://github.com/jindongli24/REWI) | Writer-independent IMU handwriting recognition | Core ML reference, CNN+BiLSTM+CTC |
| IMU2Text | [vahinitech/imu2text](https://github.com/vahinitech/imu2text) | CNN+GNN pipeline, 99.74% accuracy | Multi-task learning approach |
| imu_mnist | [peterchenyipu/imu_mnist](https://github.com/peterchenyipu/imu_mnist) | IMU digit recognition | Simple baseline |
| D-POINT | [Jcparkyn/dpoint](https://github.com/Jcparkyn/dpoint) | Open-source digital stylus, ArUco + IMU | Hardware reference design |
| Pen-Digitizer | [sravangogulapati/Pen-Digitizer](https://github.com/sravangogulapati/Pen-Digitizer) | ESP32 + gyro + BLE pen | Lessons from drift/latency issues |
| nRF52_Mesh | [nRFMesh/nRF52_Mesh](https://github.com/nRFMesh/nRF52_Mesh) | Custom RF mesh on nRF SDK | ESB protocol reference |
| embedded-debugger-mcp | [Adancurusul/embedded-debugger-mcp](https://github.com/Adancurusul/embedded-debugger-mcp) | MCP server for probe-rs debugging | Agent-hardware integration |
| mcp-gdb | [signal-slot/mcp-gdb](https://github.com/signal-slot/mcp-gdb) | MCP server for GDB | Agent firmware debugging |
| MCP Inspector | [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | MCP server testing tool | Development tooling |
| Microchip HID Digitizer | [Microchip USB HID Digitizers](https://github.com/Microchip/USB/tree/master/Device%20-%20HID%20-%20Digitizers) | HID report descriptor reference | usb_descriptors.c for pen HID |

## Hardware Datasheets & Specs

| Component | URL | Category |
|-----------|-----|----------|
| nRF52840 SoC | [nordicsemi.com/nRF52840](https://www.nordicsemi.com/Products/nRF52840) | MCU |
| ICM-42688-P | [TDK InvenSense](https://invensense.tdk.com/products/motion-tracking/6-axis/icm-42688-p/) | IMU |
| ADXL367 | [analog.com/ADXL367](https://www.analog.com/en/products/adxl367.html) | Ultra-low-power accelerometer |
| ADXL362 | [analog.com/ADXL362](https://www.analog.com/en/products/adxl362.html) | Low-power accelerometer |
| LIS2DW12 | [st.com/LIS2DW12](https://www.st.com/en/mems-and-sensors/lis2dw12.html) | Accelerometer |
| BMI270 | [bosch-sensortec.com](https://www.bosch-sensortec.com/products/motion-sensors/imus/bmi270/) | IMU |
| LSM6DSO | [st.com/LSM6DSO](https://www.st.com/en/mems-and-sensors/lsm6dso.html) | IMU |
| Piezocryst T-Series | [piezocryst.com](https://www.piezocryst.com) | GaPO4 piezo pressure sensor |
| Interlink FSR 400 | [interlinkelectronics.com](https://www.interlinkelectronics.com/fsr-400-short) | Force sensitive resistor |
| Azoteq IQS263 | [azoteq.com](https://www.azoteq.com/product/iqs263/) | Capacitive touch IC |
| TI BQ51003 | [ti.com/BQ51003](https://www.ti.com/product/BQ51003) | Qi wireless charging receiver |
| TI BQ25100 | [ti.com/BQ25100](https://www.ti.com/product/BQ25100) | Linear battery charger |
| MAX17048 | [analog.com/MAX17048](https://www.analog.com/en/products/max17048.html) | Battery fuel gauge |
| STM32WB55 | [st.com/STM32WB55](https://www.st.com/en/microcontrollers-microprocessors/stm32wb55rg.html) | BLE MCU |
| ESP32-S3 | [espressif.com](https://www.espressif.com/en/products/socs/esp32-s3) | Wi-Fi/BLE MCU |
| Renesas WattUp | [renesas.com/WattUp](https://www.renesas.com/us/en/products/power-management/wireless-power/near-field-wattupr-wire-free-charging) | RF wireless charging |

## Platform Documentation

| Resource | URL | Category |
|----------|-----|----------|
| Microsoft Haptic Pen Guide | [learn.microsoft.com](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/haptic-pen-implementation-guide) | HID / Haptics |
| Apple Stylus HID Input | [developer.apple.com](https://developer.apple.com/documentation/hid/handling_stylus_input_from_a_human_interface_device) | HID / macOS |
| HID Digitizer Interface | [help.microtouch.com](https://help.microtouch.com/understanding-hid-digitizer-interface/) | HID |
| USB HID Usage Tables | [usb.org](https://www.usb.org/hid) | HID specification |
| Teensy HID Digitizer | [forum.pjrc.com](https://forum.pjrc.com/index.php?threads/pen-stylus-digitizer-hid-descriptor-feature-needed.68794/) | HID descriptor examples |

## Manufacturing & Fabrication

| Source | URL | Category |
|--------|-----|----------|
| JLCPCB Flex PCB | [jlcpcb.com](https://jlcpcb.com) | Flex PCB fab |
| PCBWay Flex | [pcbway.com](https://www.pcbway.com) | Flex PCB fab |
| MRK Electronics, Pune | [mrkelectronics.com](https://www.mrkelectronics.com) | PCBA services |
| Rapid Circuit, Pune | [rapidcircuit.in](https://www.rapidcircuit.in) | PCB fabrication |
| Alfa Electronics, Pune | [alfaelectronicsindia.com](https://www.alfaelectronicsindia.com) | SMT assembly |
| TSIE, Pune | [tsie.in](https://www.tsie.in) | PCB assembly |

## Patents

| Patent | URL | Relevance |
|--------|-----|-----------|
| US20030223803A1 — Writing pen with piezo sensor | [patents.google.com](https://patents.google.com/patent/US20030223803A1) | Piezo sensor in pen body |

## Commercial Products (Prior Art)

| Product | Website | Key Tech |
|---------|---------|----------|
| STABILO DigiPen / EduPen | [stabilodigital.com](https://www.stabilodigital.com) | 5 sensors, on-board processing, OnHW dataset |
| Livescribe | [livescribe.com](https://www.livescribe.com) | IR camera + dot pattern paper |
| Neo Smartpen | [neosmartpen.com](https://www.neosmartpen.com) | Ncode dot pattern + camera |
| Pulsar 8K Dongle | [pulsar.gg](https://www.pulsar.gg) | 8kHz wireless gaming reference |

## Flex PCB Design Resources

| Resource | URL |
|----------|-----|
| Altium Flex Circuit Design Guide | [resources.altium.com](https://resources.altium.com/p/flex-circuit-design-guide-getting-started-flexible-circuits) |
| Altium Rigid-Flex Design | [altium.com](https://www.altium.com/documentation/altium-designer/designing-a-rigid-flex-pcb) |
| AllFlex Design Guidelines | [allflexinc.com](https://www.allflexinc.com/blog/understanding-rigid-flex-pcb-design-guidelines/) |
| Tech Etch FPC Guide | [techetch.com](https://www.techetch.com/flexible-printed-circuits-design-guide/) |
| Blind Buried Circuits Tips | [blindburiedcircuits.com](https://www.blindburiedcircuits.com/top-flex-pcb-design-tips-for-better-manufacturability/) |
