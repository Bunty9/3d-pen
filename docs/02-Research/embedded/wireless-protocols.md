---
title: "Wireless Protocol Analysis for 8 kHz Sensor Streaming"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - research
  - embedded
  - wireless
  - ble
  - esb
  - 2.4ghz
  - throughput
related:
  - "[[mcu-selection]]"
  - "[[firmware-architecture]]"
  - "[[power-management]]"
---

# Wireless Protocol Analysis for 8 kHz Sensor Streaming

## Summary

This note analyzes wireless protocol options for streaming real-time sensor data from the 3D Pen to a host at 8 kHz. The minimum throughput requirement is 768 kbps (6 channels x 8 kHz x 16-bit), with ~920 kbps needed after packet overhead. We evaluate BLE 5.x (multiple PHY modes), Nordic Enhanced ShockBurst (ESB) / Gazell, and custom 2.4 GHz protocols. The analysis includes how 8K polling gaming mice achieve their data rates, since this is the closest existing product analogy.

## Context

The 3D Pen streams raw sensor data and performs zero on-pen computation. The wireless link is the critical path: any throughput limitation, latency spike, or packet loss directly degrades the ML model's input quality on the host side.

**Data rate calculation (detailed):**
- Pressure sensor: 1 channel x 8 kHz x 16-bit = 128 kbps
- IMU #1 (accel + gyro): 6 axes x 8 kHz x 16-bit = 768 kbps (if analog; most digital IMUs top out at 1-8 kHz ODR and use SPI)
- IMU #2: same as IMU #1
- Capacitive touch: 4-8 electrodes x 1 kHz x 8-bit = 32-64 kbps (lower rate acceptable)
- **Conservative total (digital IMUs via SPI, pressure + touch analog):** ~200-400 kbps raw sensor data
- **Worst case (all channels analog at 8 kHz):** 768 kbps raw
- **With framing, timestamps, checksums (~20% overhead):** ~920 kbps required throughput

**Latency requirement:**
- Target: < 5 ms end-to-end (pen sensor event to host receiving packet)
- For real-time digital ink, perceptible latency threshold is ~10-20 ms
- The wireless hop should consume < 2 ms of the latency budget

## Key Findings

### 1. BLE 5.x Throughput Analysis

BLE throughput depends on four interacting parameters: PHY mode, Data Length Extension (DLE), ATT MTU size, and connection interval.

**PHY Modes:**

| PHY Mode | Raw Data Rate | Range | Use Case |
|---|---|---|---|
| LE 1M | 1 Mbps | Standard | Legacy compatibility |
| LE 2M | 2 Mbps | Shorter | Maximum throughput |
| LE Coded (S=2) | 500 kbps | Long range | Not applicable |
| LE Coded (S=8) | 125 kbps | Longest range | Not applicable |

**Throughput Calculation (LE 2M PHY + DLE + Max MTU):**

Using the standard BLE throughput formula from Novel Bits:

```
Single packet payload: 251 - 4 (L2CAP) - 3 (ATT) = 244 bytes application data
Packet airtime (2M PHY, 251-byte PDU): 1060 us + 150 us IFS = 1210 us
```

For a 7.5 ms connection interval (minimum per BLE spec):
- Packets per interval: floor(7500 / (1060 + 150 + 40 + 150)) = ~5 packets (4-5 realistically)
- Throughput: 4 packets x 244 bytes / 7.5 ms = **130,133 bytes/sec = 1.04 Mbps**

For a 15 ms connection interval (more common):
- Packets per interval: ~10-11 packets
- Throughput: 10 x 244 bytes / 15 ms = **162,666 bytes/sec = 1.30 Mbps**

**Real-world BLE throughput on Nordic hardware:**
- Nordic reports 1.4 Mbps theoretical maximum with 2M PHY
- Practical sustained throughput: **700 kbps to 1.1 Mbps** depending on implementation quality
- With 7.5 ms connection interval: latency per packet = 3.75 ms average (half the interval)

**BLE Verdict:** BLE 5.x with LE 2M PHY *can* meet the 920 kbps requirement, but it is at the upper end of practical throughput. Latency at 7.5 ms connection interval (3.75 ms average) is within budget. The BLE stack consumes significant CPU time and RAM (~40-60 KB on Nordic), which competes with ADC sampling on a single-core MCU.

### 2. Nordic Enhanced ShockBurst (ESB) / Gazell

ESB is the proprietary protocol that gaming mice use. It operates on the 2.4 GHz ISM band with a simple packet structure and no connection state machine.

**ESB Characteristics:**

| Parameter | Value |
|---|---|
| Raw PHY rate | 1 Mbps or 2 Mbps (selectable) |
| Max payload | 252 bytes (ESB) / 32 bytes (Gazell) |
| Packet overhead | ~10 bytes (preamble + address + PCF + CRC) |
| Latency | Device-to-device: ~505 us mean (measured in literature) |
| Retransmission | Automatic, hardware-managed |
| Frequency hopping | Manual channel management (up to 80 channels in 2.4 GHz band) |
| Power | Comparable to BLE TX power but no stack overhead |

**ESB Throughput Calculation (2 Mbps PHY):**

```
Payload per packet: 252 bytes
Packet airtime (2 Mbps): (8 + 40 + 8 + 2016 + 16) bits / 2 Mbps = ~1044 us
Turn-around + ACK: ~200 us
Total cycle: ~1244 us per acknowledged packet

Throughput: 252 bytes / 1.244 ms = 202,572 bytes/sec = 1.62 Mbps
```

With realistic scheduling (some idle time, retransmissions):
- **Practical sustained throughput: ~1.0-1.2 Mbps**
- **Latency: ~500 us per packet** (vs 3,750 us for BLE)

**Gazell (higher-level protocol on ESB):**
- Gazell adds frequency hopping and multi-pipe support on top of ESB
- Theoretical throughput with 32-byte payloads: ~213 kbps (too low due to small payload)
- Not recommended for this data rate; use raw ESB with larger payloads instead

**ESB Verdict:** ESB is the clear winner for this application. It provides 7x lower latency than BLE, higher sustained throughput, no complex stack to run (minimal CPU/RAM overhead), and is the exact protocol used by 8K gaming mice. The tradeoff: it requires a custom USB dongle on the host side (no OS-level BLE support).

### 3. How 8K Gaming Mice Achieve Their Data Rates

Modern 8 kHz polling gaming mice (Razer HyperPolling, Pulsar, AttackShark) use proprietary 2.4 GHz protocols that are functionally similar to ESB:

**Architecture:**
- Mouse contains a Nordic nRF52840 (or similar) running a proprietary 2.4 GHz radio protocol
- USB dongle contains a matching radio IC
- Protocol sends one report every 125 us (1/8000 Hz)

**Data volume per report:**
- Standard HID mouse report: ~8-12 bytes (X/Y deltas, buttons, scroll)
- At 8000 Hz: 8 bytes x 8000 = 64,000 bytes/sec = 512 kbps
- This is actually less data than our pen needs (768-920 kbps)

**Key insights from gaming mice:**
1. They do NOT use BLE. Every 8K gaming mouse uses a proprietary 2.4 GHz protocol for latency.
2. The 125 us report interval means the radio must complete a full TX+ACK cycle in under 125 us. At 2 Mbps PHY, a short 8-byte payload takes ~60 us airtime, leaving ~65 us for ACK and turnaround.
3. They use dedicated radio time slots with no contention.
4. USB 2.0 high-speed on the dongle side can handle 8000 reports/sec (the dongle requests the host at 8 kHz).

**Adaptation for 3D Pen:**
Our pen needs ~920 kbps vs a mouse's ~512 kbps. This means either:
- Larger payloads per report: send ~14-16 bytes per 8 kHz report instead of 8 bytes
- Or batch at 4 kHz with ~28-32 byte payloads (reduces radio overhead, keeps data rate identical)

At 4 kHz batch rate with 28-byte payloads:
```
Airtime: (8 + 40 + 8 + 224 + 16) / 2 Mbps = 148 us
ACK + turnaround: ~80 us
Total: ~228 us per cycle
Available time: 250 us (at 4 kHz)
Margin: 22 us (8.8%) — tight but feasible
```

### 4. Custom 2.4 GHz Protocol Option

Building a fully custom protocol on the nRF52840's radio peripheral is possible but generally unnecessary. ESB already provides:
- Hardware-managed CRC
- Auto-retransmit
- Auto-ACK
- 252-byte payloads

A custom protocol would only be justified if we need:
- Adaptive frequency hopping beyond ESB's capabilities (for regulatory compliance in some regions)
- Multi-device support (multiple pens to one dongle)
- Encrypted transport (ESB has no encryption; could add AES-128 at the application layer)

**Verdict:** Use ESB with application-layer additions rather than building from scratch.

## Relevance to Project

| Requirement | BLE 5.x (2M PHY) | ESB (2 Mbps) | Custom 2.4 GHz |
|---|---|---|---|
| Throughput >= 920 kbps | Marginal (700-1100 kbps) | Yes (1.0-1.6 Mbps) | Yes |
| Latency < 2 ms | Marginal (3.75 ms avg) | Yes (~500 us) | Yes |
| CPU/RAM overhead | High (~40-60 KB RAM) | Low (~2-5 KB RAM) | Medium |
| Host compatibility | Native OS BLE support | Requires custom dongle | Requires custom dongle |
| Power efficiency | Good (optimized stack) | Better (less CPU time) | Comparable |
| Development effort | Low (standard stack) | Low (Nordic SDK support) | High |
| Encryption | Built-in | None (add at app layer) | Custom |

## Open Questions

1. **Dongle design:** ESB requires a custom USB dongle with a matching Nordic radio IC. This is additional hardware to design/manufacture. Can we use a standard Nordic USB dongle (nRF52840 Dongle) as-is?

2. **Regulatory certification:** ESB uses the 2.4 GHz ISM band but is not a "standard" protocol. FCC/CE certification should still be straightforward (same as gaming mice), but needs to be confirmed.

3. **Fallback to BLE:** Should the pen firmware support both ESB (primary, for low-latency streaming) and BLE (secondary, for pairing/configuration/firmware update)? This is how gaming mice handle it — ESB for gameplay, BLE for setup.

4. **Interference resilience:** In crowded 2.4 GHz environments (Wi-Fi, other BLE devices), how does ESB perform? Gaming mice use channel hopping. We should implement similar frequency agility.

5. **Batching strategy:** Is 8 kHz per-sample TX optimal, or should we batch samples (e.g., 4 kHz TX with 2-sample batches) to reduce radio overhead and improve power efficiency?

## Recommendations

1. **Use Nordic ESB at 2 Mbps PHY** as the primary streaming protocol. This matches the proven architecture of 8K gaming mice and provides the best latency/throughput/power combination.

2. **Implement BLE 5.x as a secondary protocol** for device pairing, configuration, firmware DFU (Device Firmware Update), and as a fallback for basic operation without the custom dongle.

3. **Target 4 kHz radio cycle** with 2-sample batches (28-32 bytes per packet) rather than 8 kHz per-sample reports. This provides 22 us margin per cycle and reduces radio power consumption by ~50% compared to 8 kHz reporting.

4. **Design a custom USB dongle** based on the nRF52840 with USB 2.0 high-speed. The dongle firmware should present as an HID device or custom USB class to minimize host-side driver complexity.

5. **Select the nRF52840 or nRF5340 MCU** to leverage native ESB support. Other MCU families (ESP32, STM32WB) cannot run ESB.

## References

1. Novel Bits, "Bluetooth 5 Speed: Maximizing Throughput," https://novelbits.io/bluetooth-5-speed-maximum-throughput/
2. Memfault, "A Practical Guide to BLE Throughput," https://interrupt.memfault.com/blog/ble-throughput-primer
3. Nordic Semiconductor, "Enhanced ShockBurst (ESB) Documentation," https://docs.nordicsemi.com/bundle/ncs-latest/page/nrf/protocols/esb/index.html
4. Nordic DevZone, "Intro to ShockBurst/Enhanced ShockBurst," https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/intro-to-shockburstenhanced-shockburst
5. Razer, "HyperPolling Wireless Gaming Technology," https://www.razer.com/technology/razer-hyperpolling
6. AttackShark, "8K Mouse Polling Rate Limits: Why Full 8000Hz Fails," https://attackshark.com/blogs/knowledges/8k-mouse-polling-rate-limits-fails
7. Silicon Labs, "Throughput with Bluetooth Low Energy Technology," https://docs.silabs.com/bluetooth/6.2.0/bluetooth-fundamentals-system-performance/throughput
