---
title: "Firmware Architecture for Real-Time Sensor Streaming"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - research
  - embedded
  - firmware
  - rtos
  - dma
  - adc
  - real-time
related:
  - "[[mcu-selection]]"
  - "[[wireless-protocols]]"
  - "[[power-management]]"
---

# Firmware Architecture for Real-Time Sensor Streaming

## Summary

This note evaluates firmware architecture options for the 3D Pen's real-time sensor streaming pipeline. The core challenge is interleaving continuous 8 kHz multi-channel ADC sampling (via DMA) with wireless packet transmission (ESB at 2 Mbps), all within the power and memory constraints of a Nordic nRF52840/nRF5340. We compare bare-metal, Zephyr RTOS (via nRF Connect SDK), and FreeRTOS approaches, and detail the DMA pipeline design, buffer management, and interrupt priority schemes.

## Context

The pen firmware has a deceptively simple job: sample sensors, packetize data, transmit wirelessly. But the real-time constraints are tight:

- **ADC sampling:** 6 channels at 8 kHz = 48 ksps, with a new sample set every 125 us
- **Wireless TX:** ESB packet every 250 us (at 4 kHz batch rate) or every 125 us (at 8 kHz)
- **Zero missed samples:** Any dropped ADC sample creates a gap in the ML model's input
- **Zero missed TX windows:** Any missed radio slot means data accumulates and latency grows

On the nRF52840 (single-core, 64 MHz Cortex-M4F):
- 125 us = 8,000 CPU cycles between ADC sample sets
- An ESB TX+ACK cycle takes ~100-120 us of radio time
- This leaves very little margin for software overhead

On the nRF5340 (dual-core):
- Application core (128 MHz): 16,000 cycles per 125 us interval
- Network core handles radio independently
- Much more relaxed timing

## Key Findings

### 1. Bare-Metal Architecture

A bare-metal approach uses no OS — just interrupt handlers, hardware timers, and a main loop.

**Architecture:**

```
┌─────────────────────────────────────────────────┐
│                    Main Loop                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Power    │  │ Haptic   │  │ Battery       │  │
│  │ Mgmt     │  │ Control  │  │ Monitoring    │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
├─────────────────────────────────────────────────┤
│              Interrupt Layer                      │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ TIMER0 ISR   │  │ SAADC DMA Complete ISR   │  │
│  │ (8 kHz tick) │  │ (buffer swap + flag)      │  │
│  └──────┬───────┘  └──────────┬───────────────┘  │
│         │ PPI trigger          │ DMA transfer     │
│  ┌──────▼───────┐  ┌──────────▼───────────────┐  │
│  │ SAADC Start  │  │ Ring Buffer Manager       │  │
│  │ (hardware)   │  │ (double/triple buffer)    │  │
│  └──────────────┘  └──────────┬───────────────┘  │
│                               │ packetize         │
│  ┌────────────────────────────▼───────────────┐  │
│  │ ESB TX (triggered from main or ISR)        │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**DMA Pipeline (nRF52840):**

1. TIMER0 generates a COMPARE event every 125 us (8 kHz)
2. PPI channel connects TIMER0->COMPARE to SAADC->SAMPLE task (zero CPU involvement)
3. SAADC samples all 6 channels sequentially (~12 us per channel at 200 ksps = ~72 us total)
4. SAADC EasyDMA writes 6 x 16-bit values (12 bytes) directly to a RAM buffer
5. After N samples (e.g., N=2, meaning every 250 us), SAADC generates a BUFFER_FULL event
6. ISR swaps to the next buffer and sets a flag
7. Main loop detects flag, packetizes the buffer, and initiates ESB TX

**Interrupt Priority Scheme (nRF52840, 3 priority levels used):**

| Priority | Source | Action | Max Duration |
|---|---|---|---|
| 0 (highest) | Radio (ESB) | TX/RX/ACK timing | ~5 us (hardware-managed) |
| 1 | SAADC DMA complete | Buffer swap, set flag | ~2 us |
| 2 | TIMER (if needed) | Housekeeping | ~1 us |
| Main loop | — | Packetize, ESB TX initiate, power mgmt | Remaining time |

**Memory footprint:**
- Code: ~20-40 KB flash (ESB + ADC drivers + application)
- RAM: ~8-16 KB (buffers + stack + variables)
- Total: well within nRF52840's 1 MB flash / 256 KB RAM

**Pros:**
- Minimum latency (no scheduler overhead)
- Deterministic timing (no context switches)
- Smallest memory footprint
- Full control over every cycle

**Cons:**
- No task isolation — a bug in one ISR can corrupt the entire system
- Difficult to add features (BLE for config, DFU, etc.)
- Manual management of all concurrency
- Debugging is harder without RTOS tracing tools

### 2. Zephyr RTOS (via nRF Connect SDK)

Zephyr is Nordic's officially supported RTOS through the nRF Connect SDK (NCS). It provides a complete development platform with BLE stack, drivers, and device management.

**Architecture:**

```
┌────────────────────────────────────────────────────┐
│  Zephyr Kernel (tickless, priority-based preemption)│
├────────────────────────────────────────────────────┤
│  Thread: ADC Sampler     │  Thread: Radio TX        │
│  Priority: Cooperative    │  Priority: Cooperative   │
│  ┌──────────────────┐    │  ┌──────────────────┐   │
│  │ SAADC + DMA      │    │  │ ESB TX            │   │
│  │ (PPI triggered)  │    │  │ (from message     │   │
│  │ Double buffer     │    │  │  queue)           │   │
│  │ k_sem_give on     │    │  │ k_msgq_get       │   │
│  │ buffer complete   │    │  │ blocks until data │   │
│  └──────────────────┘    │  └──────────────────┘   │
├──────────────────────────┼─────────────────────────┤
│  Thread: Housekeeping    │  Thread: BLE Config      │
│  Priority: Preemptible   │  Priority: Preemptible   │
│  (battery, haptics,      │  (pairing, DFU,          │
│   capacitive touch)      │   settings)              │
└────────────────────────────────────────────────────┘
```

**Key Zephyr Features for This Use Case:**

- **Tickless kernel:** Zephyr is event-driven by default. No periodic tick interrupt stealing cycles.
- **Cooperative threads:** The ADC and Radio threads can run as cooperative (non-preemptible), giving them bare-metal-like determinism.
- **Message queues (k_msgq):** Zero-copy message passing from ADC thread to Radio thread. The ADC thread produces filled buffers; the Radio thread consumes them.
- **Hardware abstraction:** Zephyr's ADC and GPIO drivers work with the SAADC/PPI/DMA hardware. The nRF Connect SDK includes ESB protocol support.
- **Built-in BLE stack (SoftDevice replacement):** Zephyr's BLE controller can coexist with ESB for configuration/DFU mode.

**Memory Footprint:**

| Configuration | Flash | RAM |
|---|---|---|
| Zephyr minimal (empty main) | ~7 KB | ~1.2 KB |
| Zephyr + kernel + threads | ~20-30 KB | ~4-8 KB |
| Zephyr + BLE controller | ~80-120 KB | ~30-50 KB |
| Zephyr + BLE + ESB + ADC + app | ~150-200 KB | ~50-80 KB |

Even the full-featured configuration fits easily in the nRF52840's 1 MB flash / 256 KB RAM (using ~20% flash, ~31% RAM).

**Pros:**
- Official Nordic support via nRF Connect SDK
- Built-in BLE stack for configuration and DFU
- Task isolation (threads have separate stacks)
- Rich debugging: thread-aware debugging, Segger SystemView tracing
- Device tree and Kconfig for hardware abstraction
- Active open-source community

**Cons:**
- Learning curve: 2-4 weeks for device tree / Kconfig / west build system
- Scheduler overhead: ~2-5 us per context switch (acceptable for 125 us period)
- Larger memory footprint than bare-metal
- Build system complexity (CMake + west + Kconfig + device tree)

### 3. FreeRTOS

FreeRTOS is a minimal, widely-used RTOS kernel. It provides a scheduler, queues, semaphores, and timers — but no device drivers, no BLE stack, no hardware abstraction.

**Architecture:**

Similar to Zephyr but with manual driver integration:

- ADC task (highest priority): configures SAADC+PPI+DMA manually, posts to queue on buffer complete
- Radio task: dequeues buffers, calls ESB API directly
- Background task: battery monitoring, haptics, capacitive touch
- BLE: would require integrating Nordic SoftDevice separately (complex, as SoftDevice and FreeRTOS have competing interrupt requirements)

**Memory Footprint:**

| Configuration | Flash | RAM |
|---|---|---|
| FreeRTOS kernel only | ~6-10 KB | ~1-3 KB |
| FreeRTOS + tasks + queues | ~15-25 KB | ~4-8 KB |
| FreeRTOS + SoftDevice (BLE) | ~120-160 KB | ~40-60 KB |

**Pros:**
- Very small kernel footprint
- Simple priority-based preemptive scheduler
- Extensive documentation and community
- Familiar to most embedded engineers

**Cons:**
- No native Nordic peripheral drivers — must write or port all ADC/PPI/DMA code manually
- SoftDevice integration is notoriously complex (SoftDevice has its own interrupt handler that conflicts with FreeRTOS)
- No built-in BLE stack (depends on SoftDevice, which Nordic is phasing out in favor of Zephyr)
- Nordic is actively migrating away from FreeRTOS/SoftDevice to Zephyr/NCS
- No device tree, less portable

### 4. DMA-Driven ADC Pipeline Design (Detailed)

Regardless of OS choice, the ADC pipeline design is the same at the hardware level:

**Double-Buffering Scheme:**

```
Buffer A (12 bytes = 6 channels x 16-bit):
  ┌────┬────┬────┬────┬────┬────┐
  │ P  │ Ax │ Ay │ Az │ Gx │ Gy │  <- SAADC DMA writes here
  └────┴────┴────┴────┴────┴────┘

Buffer B (12 bytes):
  ┌────┬────┬────┬────┬────┬────┐
  │ P  │ Ax │ Ay │ Az │ Gx │ Gy │  <- Available for packetization
  └────┴────┴────┴────┴────┴────┘

Time ──►
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │DMA→A │  │DMA→B │  │DMA→A │  │DMA→B │
  │Read B│  │Read A│  │Read B│  │Read A│
  └──────┘  └──────┘  └──────┘  └──────┘
  125 us     125 us     125 us    125 us
```

**Batch Buffer (for 4 kHz radio rate):**

If we batch 2 ADC sample sets into one radio packet:

```
TX Packet (28 bytes payload):
  ┌───────┬──────────────┬──────────────┐
  │ Hdr   │ Sample Set 0 │ Sample Set 1 │
  │ (4B)  │ (12 bytes)   │ (12 bytes)   │
  └───────┴──────────────┴──────────────┘

Header: sequence number (2B) + timestamp (2B)
```

**Ring Buffer Alternative (for handling radio jitter):**

A ring buffer of 8-16 sample sets provides resilience against radio timing jitter:

```
Ring Buffer (8 slots x 12 bytes = 96 bytes):
  ┌────┬────┬────┬────┬────┬────┬────┬────┐
  │ S0 │ S1 │ S2 │ S3 │ S4 │ S5 │ S6 │ S7 │
  └────┴────┴────┴────┴────┴────┴────┴────┘
        ▲ write_ptr              ▲ read_ptr

- DMA writes at write_ptr (ISR advances)
- Radio TX reads from read_ptr (main/thread advances)
- Overflow detection: if write_ptr catches read_ptr, flag an error
```

### 5. nRF52840-Specific Timing Analysis

**Worst-case timing for one 125 us ADC cycle (bare-metal):**

| Event | Duration | Cumulative |
|---|---|---|
| TIMER->PPI->SAADC trigger | 0 us (hardware) | 0 us |
| SAADC acquisition (6 ch, 3 us acq each) | ~18 us | 18 us |
| SAADC conversion (6 ch, 2 us each) | ~12 us | 30 us |
| DMA transfer to RAM | ~1 us | 31 us |
| ISR: buffer swap + flag | ~2 us | 33 us |
| Packetize (copy 12B, add header) | ~5 us | 38 us |
| ESB TX initiation | ~3 us | 41 us |
| ESB radio TX + ACK (if TX cycle) | ~100 us | 141 us |
| **Total** | | **141 us** |

This exceeds the 125 us period by 16 us. Solutions:
1. **Batch at 4 kHz** (250 us period): 141 us fits with 109 us margin
2. **Overlap ADC and radio:** Start next ADC scan while radio TX is in progress (PPI handles ADC independently)
3. **Use nRF5340:** Dual-core eliminates radio timing from the ADC core's budget entirely

With ADC/radio overlap on nRF52840:
- ADC scan: 31 us (runs autonomously via PPI+DMA)
- ISR + packetize: 7 us
- ESB TX: 100 us (runs autonomously after initiation)
- CPU busy time: 10 us per 125 us cycle = **8% CPU utilization**
- The ADC and radio overlap because they use independent hardware

## Relevance to Project

| Criterion | Bare-Metal | Zephyr (NCS) | FreeRTOS |
|---|---|---|---|
| ADC determinism | Best | Good (cooperative threads) | Good |
| Memory usage | Lowest (~30 KB flash, ~12 KB RAM) | Medium (~150-200 KB flash, ~50-80 KB RAM) | Medium (~120-160 KB flash, ~40-60 KB RAM) |
| BLE support (config/DFU) | Must implement manually | Built-in | Via SoftDevice (complex) |
| Nordic SDK support | nrfx drivers only | Full nRF Connect SDK | Legacy, being phased out |
| Development speed | Slowest | Fastest (for Nordic) | Medium |
| Future-proof | No | Yes (Nordic's direction) | No (Nordic moving away) |
| Debugging tools | Basic (printf, LED) | SystemView, thread tracing | FreeRTOS+Trace |
| Risk | Bug = system crash | Moderate complexity | SoftDevice conflicts |

## Open Questions

1. **Cooperative vs preemptive threads in Zephyr:** For the ADC and Radio threads, cooperative scheduling gives bare-metal-like determinism. But if one thread hangs, the other starves. Should we use preemptive with very high priority instead?

2. **SPI IMU integration:** If the IMUs use SPI (e.g., ICM-42688-P runs at up to 24 MHz SPI), the DMA pipeline needs to also handle SPI DMA transfers. Zephyr's SPI driver supports DMA. How does this interact with the SAADC DMA timing?

3. **Firmware update mechanism:** Over-the-air DFU is critical for a sealed pen. Zephyr's MCUboot provides this. Bare-metal would need a custom bootloader.

4. **Error handling:** What happens when a radio TX fails (interference, dongle out of range)? Options: drop samples (lossy), buffer and retry (adds latency), or signal the host to interpolate.

5. **Multi-rate sampling:** The capacitive touch sensor may only need 1 kHz while IMUs need 8 kHz. Should the firmware implement per-sensor sample rates or run everything at 8 kHz and downsample?

## Recommendations

1. **Use Zephyr RTOS via nRF Connect SDK** as the primary firmware platform. It is Nordic's officially supported path, provides built-in BLE for configuration and DFU, has excellent debugging tools, and the memory footprint fits comfortably in the nRF52840. The learning curve is justified by the long-term benefits.

2. **Implement the ADC pipeline as a cooperative thread** with TIMER+PPI+DMA at the hardware level. The Zephyr ADC driver can configure this, or use the nrfx SAADC driver directly for maximum control.

3. **Use double-buffering with a 4 kHz radio batch rate** (2 sample sets per packet, 28-byte payload). This provides sufficient margin on the nRF52840 and halves radio power consumption.

4. **Design the ring buffer with 8-16 slots** (96-192 bytes) to absorb radio timing jitter. Monitor fill level as a health metric.

5. **Prototype on nRF52840 first.** If timing analysis during prototyping reveals that ADC/radio overlap is insufficient, escalate to the nRF5340 where the dual-core architecture eliminates the problem entirely.

## References

1. Nordic Developer Academy, "ADC Peripheral on Nordic Devices," https://academy.nordicsemi.com/courses/nrf-connect-sdk-intermediate/lessons/lesson-6-analog-to-digital-converter-adc/topic/adc-peripheral-on-nordic-devices/
2. Shawn Hymel, "Zephyr vs FreeRTOS: How to Choose the Right RTOS," https://shawnhymel.com/3106/zephyr-vs-freertos-how-to-choose-the-right-rtos-for-your-embedded-project/
3. Ezurio, "Zephyr RTOS vs FreeRTOS: A Comprehensive Comparison," https://www.ezurio.com/resources/blog/zephyr-rtos-vs-freertos-a-comprehensive-comparison-for-iot-and-embedded-systems
4. Zephyr Project, "Minimal Footprint Sample," https://docs.zephyrproject.org/latest/samples/basic/minimal/README.html
5. Nordic DevZone, "nRF5340 Zephyr DMA ADC Example," https://devzone.nordicsemi.com/f/nordic-q-a/74356/nrf5340---zephyr-dma-adc-example
6. Hubble Network Community, "How to Choose Between FreeRTOS, Zephyr, and Bare Metal," https://community.hubble.com/articles/new/how-to-choose-between-freertos-zephyr-and-bare-metal/
