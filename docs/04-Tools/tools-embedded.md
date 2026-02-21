---
title: "Embedded Tool Evaluation"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - tools
  - embedded
  - evaluation
  - development-environment
related:
  - "[[mcu-selection]]"
  - "[[firmware-architecture]]"
---

# Embedded Tool Evaluation

## Overview

This document evaluates development tools for the 3D Pen's embedded firmware. Each tool is assessed for relevance to the project's specific needs: nRF52840/nRF5340 MCU development, real-time ADC/DMA streaming, ESB wireless protocol, and flex PCB debugging. Verdicts use the Technology Radar framework:

- **ADOPT**: Use this tool. It is the right choice for the project.
- **TRIAL**: Worth investing time to evaluate. Use for prototyping and proof-of-concept.
- **ASSESS**: Explore in a limited way. Keep on the radar but do not invest heavily yet.
- **HOLD**: Do not use for this project. May be appropriate for other contexts.

---

## 1. PlatformIO

**Category:** Build system / IDE integration
**Verdict: HOLD**

### What It Is
PlatformIO is a cross-platform build system and library manager that supports multiple MCU platforms and frameworks. It integrates into VS Code and provides a unified build/upload/debug experience across Arduino, ESP-IDF, Mbed, STM32Cube, and more. It supports the Nordic nRF52 platform with Arduino and Mbed frameworks.

### Evaluation

**Strengths:**
- Excellent for rapid prototyping with Arduino framework
- One-click build/upload/debug from VS Code
- Cross-platform (Windows/macOS/Linux)
- Large library ecosystem for common components (sensors, displays, etc.)
- Supports Nordic nRF52840 with Arduino Core for mbed-enabled devices

**Weaknesses for this project:**
- Does not natively support the nRF Connect SDK or Zephyr RTOS, which is the recommended firmware platform for this project
- Arduino framework on nRF52840 does not expose low-level SAADC+PPI+DMA configuration needed for 8 kHz streaming
- ESB protocol is not available through Arduino or Mbed frameworks on PlatformIO
- Nordic is actively developing the nRF Connect SDK VS Code extension, which provides a better integrated experience for Nordic chips
- Community PlatformIO + NCS integration exists but is unofficial and fragile

### Rationale
The 3D Pen firmware requires direct access to Nordic's SAADC, PPI, EasyDMA, and ESB peripherals. These are only fully supported through the nRF Connect SDK (Zephyr-based). PlatformIO's Nordic support is limited to Arduino and Mbed frameworks, which abstract away the hardware control we need. PlatformIO is excellent for ESP32 or general Arduino projects, but it is not the right tool for this specific Nordic-centric, performance-critical application.

---

## 2. Zephyr + west Build System

**Category:** RTOS / Build system
**Verdict: ADOPT**

### What It Is
Zephyr is an open-source RTOS maintained by the Linux Foundation, with first-class support from Nordic Semiconductor, Intel, NXP, and others. The `west` tool is Zephyr's meta-build system that manages workspaces, builds (via CMake + Ninja), flashing, and multi-repo manifest files. Zephyr uses Kconfig for feature selection and device tree for hardware description.

### Evaluation

**Strengths:**
- Nordic's officially supported RTOS through the nRF Connect SDK
- Native support for SAADC, PPI, EasyDMA, ESB, BLE 5.x on nRF52840 and nRF5340
- Tickless kernel with cooperative and preemptive scheduling
- Built-in BLE controller (replaces SoftDevice), MCUboot (OTA DFU), logging, shell
- Minimal footprint: ~7 KB flash / ~1.2 KB RAM for kernel; ~150-200 KB flash / ~50-80 KB RAM with BLE + ESB + application
- Active development: 1,000+ contributors, monthly releases
- Device tree and Kconfig provide clean hardware abstraction for the flex PCB's custom pin mappings
- Thread-aware debugging with Segger SystemView integration

**Weaknesses:**
- Steep learning curve (device tree + Kconfig + CMake + west): 2-4 weeks for a competent embedded engineer
- Build system is complex (CMake + west + Kconfig + device tree overlays)
- Documentation can be fragmented between Zephyr upstream and Nordic's NCS documentation
- Debugging device tree issues is sometimes opaque

### Rationale
Zephyr + west is the correct foundation for this project. Every technical requirement — 8 kHz ADC via DMA, ESB wireless, BLE for config/DFU, cooperative real-time threads, low-power modes, and future nRF5340 migration — is directly supported. The learning curve is a one-time investment that pays dividends throughout the product's lifecycle. The nRF Connect SDK is built on top of Zephyr and provides Nordic-specific drivers, samples, and documentation.

---

## 3. nRF Connect SDK (NCS)

**Category:** Vendor SDK / Development platform
**Verdict: ADOPT**

### What It Is
The nRF Connect SDK is Nordic Semiconductor's official software development kit. It is built on top of Zephyr RTOS and adds Nordic-specific libraries, drivers, protocol stacks (BLE, Thread, Zigbee, ESB, NFC), and the nRF Connect for VS Code extension. It includes the `nrfx` HAL (Hardware Abstraction Layer) for direct peripheral access.

### Evaluation

**Strengths:**
- Contains everything needed for this project in one integrated package:
  - Zephyr RTOS kernel and build system
  - `nrfx` drivers for SAADC, PPI, TIMER, SPIM (all with EasyDMA)
  - ESB protocol library
  - BLE controller (Softdevice Controller or Zephyr BLE Controller)
  - MCUboot for OTA firmware updates
  - Power management subsystem
- nRF Connect for VS Code extension: build, flash, debug, device tree visualization, memory reports
- Extensive sample applications (ESB, BLE throughput, ADC with DMA, multi-protocol)
- Nordic DevZone community support and direct Nordic engineering support
- Supports both nRF52840 and nRF5340, enabling seamless MCU migration

**Weaknesses:**
- Large workspace (~5-10 GB including toolchain)
- Version pinning is important: NCS versions track Zephyr versions, and mixing versions causes build failures
- The `nrfx` driver layer and Zephyr driver layer sometimes overlap, requiring care to avoid conflicts
- Release cadence (~quarterly) means waiting for bug fixes unless patching manually

### Rationale
The nRF Connect SDK is the development platform for this project. It is not a separate tool from Zephyr; it is Zephyr plus everything Nordic-specific that we need. The ADOPT verdict for both Zephyr and NCS reflects that they are used together — NCS is the entry point, and Zephyr is the underlying system.

---

## 4. Arduino Framework

**Category:** Development framework
**Verdict: HOLD**

### What It Is
The Arduino framework provides a simplified C++ API (setup/loop, digitalRead/Write, analogRead, Serial) for microcontroller development. Arduino Core for mbed-enabled devices supports the nRF52840 (e.g., Arduino Nano 33 BLE). The Arduino IDE and CLI provide build and upload tools.

### Evaluation

**Strengths:**
- Fastest path to a blinking LED or basic sensor read
- Enormous community and library ecosystem
- Good for team members who are not embedded specialists
- Useful for quick sensor evaluation and prototyping

**Weaknesses for this project:**
- `analogRead()` is blocking and single-channel — cannot achieve 8 kHz x 6 channel DMA-driven sampling
- No access to PPI, EasyDMA, or TIMER peripherals through the Arduino API
- No ESB protocol support
- BLE support (ArduinoBLE library) is limited and has known issues with ADC sampling interruption on nRF52840
- No cooperative scheduling or real-time thread support
- Arduino Core for nRF52840 uses Mbed OS underneath, which has a larger footprint than Zephyr and less Nordic-specific optimization

### Rationale
Arduino is fundamentally the wrong abstraction level for this project. The pen's firmware requires direct hardware control of DMA, PPI, and radio peripherals that Arduino deliberately hides. Additionally, the ArduinoBLE library has documented conflicts with continuous ADC sampling on the nRF52840. Arduino is acceptable for quick sensor breakout board testing during early prototyping, but should not be used for any firmware that will approach production.

---

## 5. OpenOCD / J-Link (Debugger)

**Category:** Debug hardware and software
**Verdict: ADOPT (J-Link) / TRIAL (OpenOCD)**

### What It Is

**J-Link** is SEGGER's commercial JTAG/SWD debug probe hardware. It connects to the MCU via SWD (Serial Wire Debug) and provides flash programming, breakpoint debugging, real-time terminal (RTT), and RTOS-aware debugging. The J-Link EDU model is available for non-commercial use.

**OpenOCD** (Open On-Chip Debugger) is an open-source debug server that supports many JTAG/SWD probes (including J-Link, ST-Link, CMSIS-DAP). It provides GDB server functionality for stepping through code.

### Evaluation

**J-Link Strengths:**
- Fastest flash programming: up to 4 MB/s RAM download speed
- Unlimited flash breakpoints (even on MCUs that have limited hardware breakpoints)
- Segger RTT (Real Time Transfer): printf-style logging over the debug probe at ~1 MB/s with near-zero target CPU overhead — essential for debugging the real-time ADC pipeline without affecting timing
- Segger SystemView: real-time RTOS tracing (visualize thread scheduling, interrupt timing, DMA events) — directly relevant for verifying 8 kHz ADC timing
- Segger Ozone: standalone graphical debugger with timeline visualization
- Works out-of-the-box with nRF Connect SDK
- J-Link OB (On-Board) is included on Nordic development kits

**J-Link Weaknesses:**
- Commercial license required for production use (J-Link BASE: ~$500, J-Link EDU: ~$60)
- Proprietary software

**OpenOCD Strengths:**
- Free and open source
- Supports many probes (CMSIS-DAP, ST-Link, Bus Pirate, FTDI-based)
- Good RISC-V integration
- Can be used as a backup if J-Link is unavailable

**OpenOCD Weaknesses:**
- Significantly slower than J-Link native (J-Link with OpenOCD bypasses all J-Link optimizations)
- No RTT support (must use SWO or UART for logging)
- No SystemView integration
- More configuration required; less robust for Nordic chips

### Rationale
**J-Link: ADOPT.** The combination of RTT (zero-overhead logging) and SystemView (real-time thread/interrupt tracing) is essential for developing and verifying the 8 kHz ADC+DMA pipeline. These tools let you see exactly when ADC samples complete, when DMA transfers occur, and when radio events fire — without disturbing the system's timing. The J-Link EDU is an affordable option for development.

**OpenOCD: TRIAL.** Keep OpenOCD as a secondary option for situations where J-Link is unavailable (e.g., CI/CD flash programming with a CMSIS-DAP probe). It is also useful if the team expands and not everyone has a J-Link.

---

## 6. Saleae Logic / PulseView (Logic Analyzer)

**Category:** Test and measurement
**Verdict: ADOPT (Saleae Logic) / TRIAL (PulseView)**

### What It Is

**Saleae Logic** is a USB logic analyzer with 8 or 16 digital channels and analog capture. The Logic 2 software provides protocol decoders for SPI, I2C, UART, and more. Models range from Logic 8 ($500) to Logic Pro 16 ($1500).

**PulseView** is the open-source GUI for the sigrok project. It supports various low-cost logic analyzers (e.g., the $10-15 Saleae Logic clones or Cypress FX2-based analyzers) and provides similar protocol decoding via Python-based decoders.

### Evaluation

**Saleae Logic Strengths:**
- Intuitive, polished UI with drag-to-zoom and annotations
- Built-in protocol analyzers: SPI (for IMU communication), I2C (for battery monitor), UART
- Analog capture: can simultaneously view digital SPI transactions and analog ADC signals
- High sample rate: up to 500 MS/s digital, 50 MS/s analog (Logic Pro 16)
- Measurement tools: frequency, duty cycle, timing between events
- SDK for custom protocol decoders
- Excellent for verifying SPI timing between MCU and IMUs at 8+ MHz
- Trigger capabilities for capturing specific events

**Saleae Logic Weaknesses:**
- Expensive ($500-1500 for hardware)
- Closed-source hardware

**PulseView / sigrok Strengths:**
- Free and open source
- Works with $10-15 logic analyzer clones (Cypress FX2-based)
- Supports stacked protocol decoders
- Python API for custom decoders
- Adequate for basic I2C, SPI, UART debugging

**PulseView / sigrok Weaknesses:**
- UI is less polished and less intuitive
- Lower sample rates with cheap hardware (~24 MS/s for 8-channel)
- No analog capture with cheap hardware
- The official release (0.4.2) has not been updated recently
- Cheap analyzers may introduce signal integrity issues

### Rationale
**Saleae Logic: ADOPT.** A logic analyzer is non-negotiable for this project. The pen's firmware communicates with 2 IMUs over SPI (8+ MHz clock), a battery monitor over I2C, and the MCU's internal peripherals use PPI signals that can be routed to GPIO pins for observation. The analog capture capability is particularly valuable for verifying the SAADC input signals and the piezo pressure sensor waveform. During firmware development, the logic analyzer is how you verify that the 8 kHz ADC pipeline actually runs at 8 kHz, that SPI transactions complete within the timing budget, and that the radio TX does not collide with ADC sampling. The Saleae Logic 8 at $500 is a justified investment.

**PulseView: TRIAL.** Use PulseView with a cheap analyzer as a secondary tool or for team members who need basic protocol debugging without the Saleae investment. It is adequate for I2C transactions and low-speed signals.

---

## Tool Stack Summary

| Tool | Verdict | Role in Project |
|---|---|---|
| **Zephyr + west** | ADOPT | RTOS and build system |
| **nRF Connect SDK** | ADOPT | Vendor SDK, libraries, drivers |
| **J-Link** | ADOPT | Debug probe, RTT logging, SystemView tracing |
| **Saleae Logic** | ADOPT | Logic/analog analyzer for SPI, I2C, timing verification |
| **OpenOCD** | TRIAL | Backup debug server, CI/CD flashing |
| **PulseView / sigrok** | TRIAL | Budget logic analyzer for secondary use |
| **PlatformIO** | HOLD | Not compatible with nRF Connect SDK workflow |
| **Arduino Framework** | HOLD | Wrong abstraction level for production firmware |

## Recommended Development Setup

1. **IDE:** VS Code + nRF Connect for VS Code extension
2. **SDK:** nRF Connect SDK (latest stable, currently v2.9.x)
3. **Build:** `west build` (CMake + Ninja backend)
4. **Flash/Debug:** J-Link (included on Nordic DK boards) + nRF Connect VS Code integration
5. **Logging:** Segger RTT (zero-overhead, real-time)
6. **Tracing:** Segger SystemView (for ADC/radio timing verification)
7. **Hardware debug:** Saleae Logic 8 (SPI/I2C/analog verification)
8. **Target hardware (dev phase):** nRF52840 DK (PCA10056) or nRF5340 DK (PCA10095)

## References

1. PlatformIO, "Nordic nRF52 Platform," https://docs.platformio.org/en/latest/platforms/nordicnrf52.html
2. Zephyr Project, "Minimal Footprint Sample," https://docs.zephyrproject.org/latest/samples/basic/minimal/README.html
3. SEGGER, "J-Link Debug Probes," https://www.segger.com/products/debug-probes/j-link/
4. SEGGER, "OpenOCD Knowledge Base," https://kb.segger.com/OpenOCD
5. sigrok, "Logic Analyzer Comparison," https://sigrok.org/wiki/Logic_analyzer_comparison
6. Nordic Semiconductor, "nRF Connect SDK," https://www.nordicsemi.com/Products/Development-software/nRF-Connect-SDK
7. Shawn Hymel, "Why Use Zephyr? A Practical Guide for Embedded Engineers," https://shawnhymel.com/2741/why-use-zephyr-a-practical-guide-for-embedded-engineers-choosing-the-right-rtos/
