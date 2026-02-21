---
title: "Open-Source Firmware and MCP Tooling for Embedded Development"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - research
  - embedded
  - open-source
  - firmware
  - nrf52
  - esb
  - mcp
  - debugging
  - hid
related:
  - "[[firmware-architecture]]"
  - "[[wireless-protocols]]"
  - "[[mcu-selection]]"
  - "[[power-management]]"
---

# Open-Source Firmware and MCP Tooling for Embedded Development

## Summary

This note catalogs and evaluates open-source firmware implementations and MCP (Model Context Protocol) agent tooling relevant to the 3D Pen's embedded development. We cover six areas: (1) nRF52_Mesh -- a custom RF mesh protocol on nRF52 without SoftDevice that demonstrates bare-metal ESB-style radio usage; (2) NRF52_Tri_Mode_Wireless_Mouse -- a tri-mode nRF52840 gaming mouse with ESB, BLE, and USB that provides the closest firmware reference for our streaming protocol; (3) Nordic nRF Desktop -- the official reference design for HID peripherals on nRF Connect SDK; (4) embedded-debugger-mcp -- an MCP server enabling AI agents to debug ARM Cortex-M hardware via probe-rs; (5) mcp-gdb -- an MCP server for GDB-based firmware debugging; (6) MCP Inspector -- the visual testing tool for validating MCP servers; and (7) Microchip HID Digitizer examples -- reference USB HID report descriptors for pen/digitizer input. For each, we document how it works, what code is reusable, and how it integrates with AI agent workflows for hardware development.

## Context

The 3D Pen's embedded firmware must stream sensor data wirelessly at ~8 kHz with minimal latency, register as an OS-level HID input device (digitizer/pen), and support DFU for field updates. Prior research ([[firmware-architecture]], [[wireless-protocols]]) established Zephyr RTOS on nRF52840 as the target platform, with ESB (Enhanced ShockBurst) as the primary wireless protocol. This note identifies open-source code that can be cloned, studied, or directly adapted to accelerate firmware development, and evaluates emerging MCP tooling that enables AI-assisted hardware debugging -- a workflow where Claude or other agents can directly interact with debug probes, read registers, set breakpoints, and inspect memory on the physical pen hardware.

## Key Findings

### Finding 1: nRF52_Mesh -- Custom RF Protocol Without SoftDevice

**Repository:** [github.com/nRFMesh/nRF52_Mesh](https://github.com/nRFMesh/nRF52_Mesh)
**License:** Open source (custom)
**SDK:** nRF SDK 15.0.0 (minified submodule)

This project implements a lightweight mesh networking protocol for nRF52 devices using the radio peripheral directly, without Nordic's SoftDevice BLE stack. It is the closest open-source reference for building a custom RF protocol on nRF52 hardware.

**Protocol architecture:**

- **Radio layer:** Modified Enhanced ShockBurst running at 2 Mbps on a single configurable RF channel. No S0/S1 bits; byte-aligned payload for maximum efficiency.
- **Mesh layer:** Flooding broadcast with configurable TTL (time-to-live). Every message propagates through the network until TTL expires.
- **Node types:** Sleepy nodes (wake on RTC or sensor interrupt, TX, sleep) and router nodes (always listening on the RF channel).
- **Packet structure:** Control byte (broadcast/directed, ack/retry/streaming flags) + PID (application function ID) + 8-bit source/destination node IDs + TTL + payload.
- **Throughput:** Tested at 300 packets/second at 2 Mbps.

**Core driver:** `drivers/mesh.c` -- the complete custom RF protocol implementation, independent of SoftDevice. This is the file most relevant to the 3D Pen.

**Power characteristics:**

| Mode | Current Draw |
|---|---|
| RTC + RAM retention | 9.6 uA |
| + Sensors active | 22 uA |
| + UART logging | 500 uA |

**Supported hardware:**
- nRF52832 sensor tag (custom PCB with BME280, MAX44009)
- nRF52832 UART dongle
- nRF52840 USB dongle

**Code structure:**
- `drivers/mesh.c` -- mesh protocol and radio driver
- `applications/01_sensortag/` -- low-power sensor node firmware
- `applications/04_uart_dongle/` -- UART-based gateway dongle
- `applications/08_usb_dongle/` -- USB-based gateway dongle
- `boards/` -- board definitions and PCB files
- `nRF5_SDK/` -- minified Nordic SDK 15.0.0 submodule
- Compiler: GNU Tools ARM Embedded v6 (2017-q2)

**Relevance to 3D Pen:**

The `mesh.c` driver demonstrates how to configure and use the nRF52's radio peripheral directly for custom 2.4 GHz communication without SoftDevice overhead. Key reusable patterns:

- **Radio configuration without SoftDevice:** The driver configures radio registers directly (frequency, data rate, CRC, addresses) and manages TX/RX state transitions manually. This is the same approach needed for the 3D Pen's ESB-like streaming protocol.
- **Packet structure design:** The control byte with streaming flag and the compact header format (minimal overhead for maximum payload) is directly applicable to the 3D Pen's sensor data packets.
- **Alive/heartbeat mechanism:** The periodic broadcast with accumulated route information provides a template for the 3D Pen's connection health monitoring.

**Limitations for 3D Pen:**
- The mesh protocol uses flooding broadcast, which is unnecessary for the 3D Pen's point-to-point link. The mesh layer should be stripped, keeping only the radio driver.
- The protocol runs on nRF SDK 15 (legacy). The 3D Pen targets nRF Connect SDK (Zephyr-based). The radio register-level code translates, but the driver structure needs adaptation to Zephyr's device model.
- 300 packets/second is far below the 3D Pen's target of 4,000-8,000 packets/second. The protocol's timing and buffer management need significant optimization.

### Finding 2: NRF52_Tri_Mode_Wireless_Mouse -- ESB Gaming Mouse Firmware

**Repository:** [github.com/AIALRA-0/NRF52_Tri_Mode_Wireless_Mouse](https://github.com/AIALRA-0/NRF52_Tri_Mode_Wireless_Mouse)
**License:** Not explicitly stated
**SDK:** nRF MDK 8.40.3, IAR Embedded Workbench

This is a complete tri-mode wireless gaming mouse implementation on nRF52840 supporting Bluetooth LE, USB, and ESB (proprietary 2.4 GHz RF). It is the most directly relevant firmware reference for the 3D Pen's wireless protocol.

**Wireless modes and polling rates:**

| Mode | Max Polling Rate | Protocol |
|---|---|---|
| Bluetooth LE | 133 Hz | BLE HID |
| USB | 1000 Hz | USB HID (full-speed) |
| ESB (RF) | 1000 Hz | Enhanced ShockBurst |

**ESB implementation details:**
- The ESB driver (`esb_device` module) handles RF communication with fixed addressing and auto-pairing.
- Keypresses and sensor data are transmitted via RF to a receiver dongle (`gm_mouse_rx`), which converts ESB packets to USB HID reports for the host.
- The receiver acts as a USB HID device, bridging wireless RF to wired USB.

**Firmware architecture:**
- `esb_device` -- ESB RF driver and protocol logic
- `ble_device` -- Bluetooth LE HID implementation
- `usb_device` -- USB full-speed HID (no high-speed support)
- `mouse` -- core input processing logic
- `paw3399` -- optical sensor driver (PAW3399)
- `ws2812b` -- RGB LED driver
- Main code in `examples/peripheral/gm_mouse/`, drivers in `Drives/`
- Language: C (97.8%), Assembly (2.0%)
- Comments are in Chinese

**Adaptation for 3D Pen:**

This is the highest-priority firmware reference. Key aspects to study and adapt:

- **ESB driver architecture:** The `esb_device` module provides a working example of ESB packet formation, transmission, acknowledgment handling, and auto-pairing on nRF52840. The packet format and radio timing code can be adapted for the 3D Pen's higher-throughput sensor streaming.
- **Receiver dongle firmware:** The `gm_mouse_rx` receiver demonstrates how to receive ESB packets and convert them to USB HID reports -- exactly the flow the 3D Pen's dongle needs, but outputting digitizer/pen reports instead of mouse reports.
- **Mode switching:** The tri-mode architecture (ESB/BLE/USB) provides a template for the 3D Pen to support ESB for low-latency streaming and BLE for configuration/pairing/DFU.

**Limitations for 3D Pen:**
- 1000 Hz polling rate is 4-8x below the 3D Pen's target. The ESB timing needs to be tightened significantly. Gaming mice are limited by their optical sensor scan rate; the 3D Pen's bottleneck is radio throughput.
- The author explicitly states latency and power consumption are not optimized. Both are critical for the 3D Pen.
- Built with IAR (proprietary compiler), not GCC or Zephyr. Porting to nRF Connect SDK is non-trivial.
- No DMA-based ADC pipeline -- the mouse reads a single optical sensor via SPI, not multi-channel ADC streaming.

### Finding 3: Nordic nRF Desktop -- Official HID Reference Design

**Source:** [nordicsemi.com/Products/Reference-designs/nRF-Desktop](https://www.nordicsemi.com/Products/Reference-designs/nRF-Desktop)
**Code:** [github.com/nrfconnect/sdk-nrf (applications/nrf_desktop/)](https://github.com/nrfconnect/sdk-nrf/blob/main/applications/nrf_desktop/README.rst)
**License:** Nordic Semiconductor (open source within nRF Connect SDK)

Nordic's official reference design for HID peripherals (gaming mouse, keyboard, dongle) on the nRF Connect SDK. This is the most production-ready firmware reference, built on Zephyr RTOS.

**Key specifications:**
- **MCU:** nRF52840 (gaming mouse), nRF52832, nRF52810
- **Wireless:** BLE with LLPM (Low Latency Packet Mode) achieving 1 ms report rate
- **USB:** Full-speed USB HID
- **Sensor:** PixArt PMW3360 optical sensor
- **Architecture:** Modular, event-driven design with isolated modules communicating via application events

**LLPM (Low Latency Packet Mode):**
- Nordic-proprietary BLE extension that reduces connection interval to 1 ms (standard BLE minimum is 7.5 ms)
- Available only on nRF52833 and nRF52840
- Supports 1-4 concurrent LLPM connections
- The dongle firmware handles LLPM on the receiver side

**Why this matters for the 3D Pen:**

nRF Desktop is the canonical example of how to build a low-latency HID peripheral on the exact platform the 3D Pen targets (nRF52840 + Zephyr + nRF Connect SDK). Key study areas:

- **Event-driven architecture:** The modular design with application events provides a template for the 3D Pen's firmware modules (ADC sampler, radio TX, haptics, capacitive touch, battery management).
- **LLPM vs ESB trade-off:** LLPM achieves 1 ms latency while staying within the BLE protocol, which means built-in pairing, encryption, and coexistence. The 3D Pen could potentially use LLPM instead of raw ESB, trading some flexibility for a standard BLE stack.
- **Dongle firmware:** The nRF Desktop dongle firmware handles BLE/LLPM reception and USB HID output, directly applicable to the 3D Pen's receiver dongle.
- **DFU support:** Built-in MCUboot-based over-the-air firmware updates.
- **Build system:** Full nRF Connect SDK (west + CMake + Kconfig + device tree) -- the same toolchain the 3D Pen will use.

**How to use:**
- Install nRF Connect SDK via `west init` and `west update`
- Build with `west build -b nrf52840dk_nrf52840 nrf/applications/nrf_desktop`
- Flash with `west flash`
- The complete source is in `nrf/applications/nrf_desktop/` within the SDK tree

### Finding 4: embedded-debugger-mcp -- AI-Driven Hardware Debugging

**Repository:** [github.com/Adancurusul/embedded-debugger-mcp](https://github.com/adancurusul/embedded-debugger-mcp)
**License:** Open source
**Language:** Rust 1.70+
**Core dependency:** probe-rs (embedded debugging library)

This MCP server enables AI assistants (Claude, etc.) to directly debug ARM Cortex-M and RISC-V microcontrollers through physical debug probes. It provides 22 validated tools for probe management, memory operations, debug control, breakpoints, flash programming, and RTT (Real-Time Transfer) communication.

**Tool categories (22 tools total):**

| Category | Tools | Description |
|---|---|---|
| Probe Management | `list_probes`, `connect`, `probe_info` | Discover and connect to debug probes |
| Memory Operations | `read_memory`, `write_memory` | Read/write arbitrary MCU memory addresses |
| Debug Control | `halt`, `run`, `reset`, `step` | Execution control (halt, resume, reset, single-step) |
| Breakpoints | `set_breakpoint`, `clear_breakpoint` | Hardware breakpoint management |
| Flash Operations | `flash_erase`, `flash_program`, `flash_verify` | Flash programming and verification |
| RTT Communication | `rtt_attach`, `rtt_detach`, `rtt_channels`, `rtt_read`, `rtt_write`, `run_firmware` | Real-Time Transfer for debug I/O |
| Session Management | `get_status`, `disconnect` | Session lifecycle |

**Supported hardware:**
- Debug probes: J-Link, ST-Link V2/V3, DAPLink, Black Magic Probe, FTDI-based probes
- Target architectures: ARM Cortex-M (M0, M0+, M3, M4, M7, M23, M33), RISC-V, ARM Cortex-A (basic)
- Validated: STM32G431CBTx with ST-Link V2 (100% tool success rate)

**Claude Desktop configuration (Linux/macOS):**

```json
{
  "mcpServers": {
    "embedded-debugger": {
      "command": "/path/to/embedded-debugger-mcp",
      "args": [],
      "env": { "RUST_LOG": "info" }
    }
  }
}
```

**Agent workflow for 3D Pen development:**

With this MCP server configured, an AI agent can perform the following hardware validation tasks on the physical 3D Pen prototype:

1. **Flash firmware:** `flash_program` to load new builds onto the nRF52840
2. **Verify boot:** `run_firmware` + `rtt_read` to confirm startup messages
3. **Inspect sensor data:** `read_memory` at SAADC result register addresses to verify ADC readings
4. **Debug radio:** Set breakpoints in ESB TX/RX handlers, step through packet formation, inspect radio state registers
5. **Validate DMA:** Read DMA buffer contents to verify sensor data is being captured correctly
6. **RTT logging:** `rtt_write`/`rtt_read` for real-time debug output without UART overhead
7. **Power profiling:** `read_memory` on power management registers to verify low-power states

**Build from source:**
```bash
git clone https://github.com/adancurusul/embedded-debugger-mcp.git
cd embedded-debugger-mcp
cargo build --release
```

**Limitations:**
- Validated only on STM32, not nRF52840. The nRF52840 is supported by probe-rs, so the tools should work, but testing is needed.
- Requires a physical debug probe connection (J-Link or similar). The 3D Pen's flex PCB debug connector must terminate to a debug board with a probe header.
- RTT requires Segger J-Link or compatible probe. ST-Link supports SWO but not RTT natively.

### Finding 5: mcp-gdb -- GDB Debugging via MCP

**Repository:** [github.com/signal-slot/mcp-gdb](https://github.com/signal-slot/mcp-gdb)
**License:** MIT
**Language:** TypeScript (92.1%)
**Install:** `npx -y mcp-gdb`

This MCP server exposes GDB debugging functionality to AI agents, enabling them to load programs, set breakpoints, step through code, inspect variables and memory, and analyze call stacks -- all through the Model Context Protocol.

**Key tools:**

| Tool | Description |
|---|---|
| `gdb_start` | Start a new GDB session |
| `gdb_load` | Load program executable or core dump |
| `gdb_breakpoint` | Set breakpoint at function or line |
| `gdb_continue` | Continue execution until breakpoint |
| `gdb_step` | Step into next line (enters functions) |
| `gdb_next` | Step over next line (skips function internals) |
| `gdb_finish` | Execute until current function returns |
| `gdb_backtrace` | Show current call stack |
| `gdb_print` | Print variable or expression value |
| `gdb_examine` | Examine raw memory contents |

**Agent workflow for 3D Pen firmware debugging:**

mcp-gdb complements embedded-debugger-mcp by providing source-level debugging. When connected to `arm-none-eabi-gdb` with a remote target (OpenOCD or J-Link GDB server), an agent can:

1. **Load firmware ELF:** `gdb_load` to load the compiled firmware with debug symbols
2. **Set breakpoints in ISR handlers:** `gdb_breakpoint` at the SAADC DMA complete ISR to inspect buffer swap logic
3. **Step through packet formation:** `gdb_step`/`gdb_next` through the ESB TX code path
4. **Inspect sensor buffers:** `gdb_print` to display the contents of the DMA ring buffer
5. **Analyze call stacks on crashes:** `gdb_backtrace` when a hard fault occurs
6. **Post-mortem analysis:** `gdb_load` a core dump for offline crash investigation

**Configuration for Claude Desktop:**

```json
{
  "mcpServers": {
    "mcp-gdb": {
      "command": "npx",
      "args": ["-y", "mcp-gdb"]
    }
  }
}
```

**Complementary use with embedded-debugger-mcp:**
- Use embedded-debugger-mcp for low-level hardware interaction (memory-mapped register reads, flash programming, RTT)
- Use mcp-gdb for source-level debugging (stepping through C code, inspecting variables by name, viewing call stacks)
- Both can operate on the same target simultaneously via different debug interfaces, or sequentially during different development phases

### Finding 6: MCP Inspector -- Visual MCP Server Testing

**Repository:** [github.com/modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)
**License:** Open source (Anthropic)
**Install:** `npx @modelcontextprotocol/inspector`

The MCP Inspector is the official interactive developer tool for testing and debugging MCP servers. It provides a web-based UI for invoking MCP tools, viewing results, and validating server behavior.

**Architecture:**
- **MCP Inspector Client (MCPI):** React-based web UI at `http://localhost:6274`
- **MCP Proxy (MCPP):** Node.js server bridging the web UI to MCP servers via stdio, SSE, or streamable-http transports

**Usage for 3D Pen development:**

```bash
# Test the embedded debugger MCP server
npx @modelcontextprotocol/inspector /path/to/embedded-debugger-mcp

# Test the GDB MCP server
npx @modelcontextprotocol/inspector npx -y mcp-gdb
```

The Inspector allows manual testing of each MCP tool before integrating with Claude or other AI agents. For the 3D Pen workflow:

1. **Validate embedded-debugger-mcp tools:** Connect to a J-Link probe, verify that `list_probes` discovers the probe, `connect` establishes a session with the nRF52840, and `read_memory` returns expected register values.
2. **Validate mcp-gdb tools:** Load a test firmware ELF, set breakpoints, step through code, and verify that variable inspection returns correct values.
3. **CLI mode:** The Inspector also supports programmatic CLI interaction for scripting and CI integration. Useful for automated hardware-in-the-loop testing.
4. **Configuration files:** Store MCP server configurations for different development scenarios (debug probe on dev board, debug probe on pen prototype, GDB remote target).

### Finding 7: Microchip HID Digitizer -- USB Report Descriptor Reference

**Repository:** [github.com/mentatpsi/Microchip (USB/Device - HID - Digitizers/)](https://github.com/mentatpsi/Microchip/tree/master/USB/Device%20-%20HID%20-%20Digitizers)
**Source:** Microchip USB Library examples
**License:** Microchip (permissive for use with Microchip products; reference-only for other platforms)

The Microchip USB HID Digitizer examples provide reference `usb_descriptors.c` files containing complete HID report descriptors for touch and stylus digitizer devices. These define the exact USB HID Usage Page and Usage ID values that the 3D Pen's dongle must implement to register as an OS-level pen/digitizer input device.

**Available examples:**
- Single Touch Firmware
- Multi Touch Firmware
- Multi Touch 2 Points - Multi Modes Firmware
- Multi Touch 3 Points - Multi Modes Firmware

**Report descriptor structure (Multi Touch 2 Points - Multi Modes):**

The firmware defines three input modes selectable via feature reports:

**Mode 1 -- Multi-Touch Digitizer (14-byte input report):**
- Tip Switch (1 bit) -- pen/finger contact state
- In Range (1 bit) -- proximity detection
- Contact Identifier (8 bits) -- which touch point
- X coordinate (16 bits, logical range 0-4800)
- Y coordinate (16 bits, logical range 0-3000)
- Valid contact count (8 bits)
- Physical dimensions: 16 x 10 inches

**Mode 2 -- Single Touch / Stylus (7-byte input report):**
- Tip Switch (1 bit)
- In Range (1 bit)
- X coordinate (16 bits)
- Y coordinate (16 bits)

**Mode 3 -- Mouse (relative coordinates)**

**HID Usage Pages referenced:**
- `0x0D` -- Digitizers (for touch/pen input, tip switch, in range, contact ID)
- `0x01` -- Generic Desktop (for X/Y coordinates)

**Adaptation for 3D Pen dongle:**

The 3D Pen's dongle needs to present itself as a Windows Ink / macOS pen input device. The HID report descriptor must include:

- **Usage Page 0x0D (Digitizers), Usage 0x02 (Pen):** This registers the device as a pen/stylus, not a touch screen
- **Tip Switch:** Mapped from the 3D Pen's pressure sensor (non-zero pressure = tip down)
- **In Range:** Mapped from wireless connection state (connected = in range)
- **X, Y coordinates:** Output from the ML inference pipeline (trajectory reconstruction)
- **Pressure:** Additional axis mapped from the piezo sensor (Usage 0x30, Tip Pressure)
- **Tilt X, Tilt Y:** Optional, derivable from IMU orientation data

The Microchip examples provide the descriptor byte sequences that can be adapted for the nRF52840 USB dongle's TinyUSB or Zephyr USB HID stack. The stylus mode (Mode 2) is the closest starting point, extended with pressure and tilt axes.

**Key references for implementation:**
- [Microsoft: Supporting Usages in Digitizer Report Descriptors](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/supporting-usages-in-digitizer-report-descriptors) -- defines the exact HID usages Windows expects for pen input
- [USB HID Usage Tables (HUT) 1.2](https://usb.org/sites/default/files/hut1_2.pdf) -- the canonical reference for all HID usage pages and usage IDs
- [hidrdd (HID Report Descriptor Decoder)](https://github.com/abend0c1/hidrdd) -- tool to decode and validate HID descriptors during development

## Relevance to Project

| Constraint | Impact on Open-Source Adoption |
|---|---|
| 8 kHz streaming | nRF52_Mesh (300 pps) and Tri_Mode_Mouse (1000 Hz) are both below target. The radio driver code is reusable but timing must be significantly tightened. nRF Desktop's LLPM (1 ms) is closer but still requires batching multiple sensor samples per report. |
| ESB protocol | nRF52_Mesh's `mesh.c` provides bare-metal radio driver code. Tri_Mode_Mouse's `esb_device` provides a higher-level ESB driver. nRF Desktop uses LLPM/BLE instead of raw ESB. All three provide complementary reference code. |
| HID digitizer registration | Microchip examples provide complete HID report descriptor byte sequences for pen/stylus mode. nRF Desktop's HID module provides Zephyr-native HID implementation. Together, these cover the full dongle-side HID stack. |
| Flex PCB debug connector | embedded-debugger-mcp requires SWD access via J-Link/ST-Link. The 3D Pen's flex PCB debug connector (terminating to external debug board) must expose SWD (SWDIO, SWDCLK, GND, VCC) for probe connection. |
| AI-assisted development | embedded-debugger-mcp + mcp-gdb + MCP Inspector form a complete AI-driven debugging workflow. Claude can flash firmware, set breakpoints, step through ISRs, read sensor registers, and inspect DMA buffers on the physical pen prototype. |
| Zephyr RTOS target | nRF Desktop is the only reference built on Zephyr/nRF Connect SDK. nRF52_Mesh uses nRF SDK 15 (legacy). Tri_Mode_Mouse uses IAR. Code from legacy SDKs requires porting to Zephyr's device model. |
| Power budget | nRF52_Mesh demonstrates 9.6 uA sleep current on nRF52832, validating that custom RF protocols can achieve ultra-low power. Tri_Mode_Mouse does not optimize power. nRF Desktop includes power profiling support. |

## Open Questions

- [ ] Can LLPM (1 ms BLE connection interval on nRF52840) achieve sufficient throughput for 8 kHz sensor streaming by packing multiple samples per BLE packet, or is raw ESB required? If LLPM works, it eliminates the need for a custom RF protocol and provides built-in pairing/encryption.
- [ ] How does the nRF52_Mesh radio driver interact with Zephyr's radio abstraction? Can `mesh.c` be wrapped as a Zephyr radio driver, or should it be rewritten using Zephyr's `nrf_radio` API?
- [ ] Has anyone validated embedded-debugger-mcp with an nRF52840 target (vs the tested STM32)? The probe-rs library supports nRF52840, but tool-level validation is needed. Consider running the MCP Inspector against the server with an nRF52840-DK.
- [ ] What HID report descriptor fields are required for macOS pen input compatibility vs Windows Ink compatibility? The Microchip examples target Windows; macOS may have different requirements for pressure and tilt reporting.
- [ ] Can mcp-gdb connect to a Zephyr-integrated GDB server (via OpenOCD or J-Link GDB server) for combined source-level and hardware-level debugging? Test the workflow: `west debug` + `mcp-gdb` connection.
- [ ] Is the Tri_Mode_Mouse's ESB auto-pairing mechanism secure enough for a consumer product, or does it need additional authentication/encryption?

## Recommendations

1. **Use Nordic nRF Desktop as the primary firmware reference.** It is the only reference built on the target platform (Zephyr + nRF Connect SDK + nRF52840), provides production-quality HID implementation, includes DFU support, and demonstrates the event-driven architecture pattern recommended in [[firmware-architecture]]. Clone it and build it as the first firmware development task.

2. **Study the Tri_Mode_Mouse's `esb_device` driver for ESB protocol understanding.** Even though it uses a different SDK, the ESB packet format, radio state machine, and auto-pairing logic are protocol-level concepts that translate directly. Extract the protocol logic and reimplement in Zephyr if LLPM proves insufficient for 8 kHz throughput.

3. **Extract nRF52_Mesh's `mesh.c` as a bare-metal radio fallback.** If both LLPM and standard ESB are insufficient, `mesh.c` demonstrates how to configure the radio peripheral at the register level for maximum control over timing and throughput. Strip the mesh layer and keep the radio driver as a last-resort fallback.

4. **Set up the MCP debugging toolchain early.** Install embedded-debugger-mcp and mcp-gdb, configure them in Claude Desktop, and validate against an nRF52840-DK using MCP Inspector. This creates an AI-assisted debugging workflow from day one of firmware development. The RTT communication tools in embedded-debugger-mcp are particularly valuable for inspecting sensor data streams without adding UART overhead.

5. **Build the dongle's HID report descriptor from the Microchip stylus example.** Start with the Single Touch / Stylus mode descriptor, add Tip Pressure (Usage 0x30) and Tilt X/Y (Usages 0x3D/0x3E) axes, and test against Windows Ink and macOS. Use the hidrdd decoder tool to validate the descriptor before flashing.

6. **Evaluate LLPM vs ESB in a head-to-head throughput test** before committing to a wireless protocol. Build two minimal test firmwares on nRF52840-DK: one using LLPM BLE with batched sensor packets, one using raw ESB. Measure achievable throughput, latency jitter, and power consumption. The LLPM path is simpler (built-in to nRF Desktop) but may hit throughput limits.

## References

1. [nRFMesh/nRF52_Mesh -- Custom RF mesh protocol on nRF52 without SoftDevice](https://github.com/nRFMesh/nRF52_Mesh)
2. [AIALRA-0/NRF52_Tri_Mode_Wireless_Mouse -- nRF52840 tri-mode gaming mouse with ESB/BLE/USB](https://github.com/AIALRA-0/NRF52_Tri_Mode_Wireless_Mouse)
3. [Nordic nRF Desktop -- Official HID reference design on nRF Connect SDK](https://www.nordicsemi.com/Products/Reference-designs/nRF-Desktop)
4. [nrfconnect/sdk-nrf -- nRF Desktop source code in nRF Connect SDK](https://github.com/nrfconnect/sdk-nrf/blob/main/applications/nrf_desktop/README.rst)
5. [Adancurusul/embedded-debugger-mcp -- MCP server for probe-rs embedded debugging](https://github.com/adancurusul/embedded-debugger-mcp)
6. [signal-slot/mcp-gdb -- MCP server for GDB debugging](https://github.com/signal-slot/mcp-gdb)
7. [modelcontextprotocol/inspector -- Visual MCP server testing tool](https://github.com/modelcontextprotocol/inspector)
8. [Microchip HID Digitizer Examples -- USB report descriptor reference](https://github.com/mentatpsi/Microchip/tree/master/USB/Device%20-%20HID%20-%20Digitizers)
9. [Microsoft: Supporting Usages in Digitizer Report Descriptors](https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/supporting-usages-in-digitizer-report-descriptors)
10. [USB HID Usage Tables (HUT) 1.2 Specification](https://usb.org/sites/default/files/hut1_2.pdf)
11. [Nordic LLPM -- Low Latency Packet Mode for nRF52840](https://www.nordicsemi.com/Nordic-news/2021/10/Glorious-Model-O-Wireless-mouse-and-PC-uses-nRF52840-and-nRF52820)
12. [abend0c1/hidrdd -- USB HID Report Descriptor Decoder](https://github.com/abend0c1/hidrdd)
