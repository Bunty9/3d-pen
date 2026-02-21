---
title: "MCU Selection for 3D Pen Sensor Streamer"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - research
  - embedded
  - mcu
  - adc
  - wireless
  - dma
related:
  - "[[wireless-protocols]]"
  - "[[firmware-architecture]]"
  - "[[power-management]]"
---

# MCU Selection for 3D Pen Sensor Streamer

## Summary

This note evaluates five MCU candidates for the 3D Pen's core controller: nRF52840, nRF5340, ESP32-S3, STM32WB55, and RP2040 (with external radio). The primary selection criteria are the ability to perform continuous multi-channel ADC sampling at 8 kHz via DMA while simultaneously running a wireless stack at sufficient throughput to stream ~768 kbps of raw sensor data. Physical size (must fit in a 2.5 mm annular gap), power consumption, and integrated wireless are also critical constraints.

## Context

The 3D Pen is a pure sensor streamer: no on-pen computation, no display, no storage. The MCU's job is:

1. Sample 6+ analog/digital sensor channels at 8 kHz (pressure, 2x IMU, capacitive touch)
2. DMA the samples into memory buffers
3. Packetize and transmit wirelessly at ~768 kbps sustained throughput
4. Manage power, haptics, and battery charging

The entire electronics package must fit in the ~2.5 mm annular gap between the refill (6 mm diameter) and the outer shell (11 mm diameter), on a helically-wrapped flex PCB. This means the MCU package height and total footprint are critical.

**Throughput requirement calculation:**
- 6 sensor channels x 8,000 samples/sec x 16 bits/sample = 768,000 bits/sec = 768 kbps
- With packet overhead (~20%), effective requirement: ~920 kbps

## Key Findings

### 1. nRF52840 (Nordic Semiconductor)

| Parameter | Value |
|---|---|
| Package | QFN48 (6x6 mm, 0.85 mm height) / aQFN73 (7x7 mm) |
| Core | ARM Cortex-M4F @ 64 MHz |
| ADC | 12-bit SAADC, 200 ksps, 8 configurable channels |
| DMA | EasyDMA on SAADC — direct sample transfer to RAM |
| RAM / Flash | 256 KB / 1 MB |
| Wireless | BLE 5.0, Thread, Zigbee, 802.15.4, proprietary 2.4 GHz (ESB) |
| Power (active) | ~5 mA CPU active; TX 0 dBm: 5.3 mA; RX: 4.6 mA |
| Power (sleep) | 1.5 uA system OFF with RAM retention |
| SDK | nRF Connect SDK (Zephyr-based), mature, well-documented |
| Price | ~$4.70 USD @ 1k qty (LCSC) |

**8 kHz feasibility:** The SAADC runs at up to 200 ksps. At 8 kHz x 6 channels = 48 ksps total, this is well within budget (24% utilization). EasyDMA transfers samples directly to RAM without CPU intervention. A TIMER+PPI (Programmable Peripheral Interconnect) chain can trigger SAADC scans at precise 125 us intervals. The radio supports proprietary ESB mode which can achieve ~1 Mbps application throughput, exceeding the 768 kbps requirement.

**Verdict:** Strong candidate. Proven in gaming peripherals. QFN48 package fits the form factor. Single-core means careful interleaving of ADC and radio, but PPI hardware makes this feasible.

### 2. nRF5340 (Nordic Semiconductor)

| Parameter | Value |
|---|---|
| Package | QFN94 (7x7 mm, ~0.85 mm height) |
| Core | Dual-core: App (Cortex-M33 @ 128 MHz) + Network (Cortex-M33 @ 64 MHz) |
| ADC | 12-bit SAADC, 200 ksps, 8 channels with EasyDMA |
| DMA | EasyDMA on all major peripherals |
| RAM / Flash | App: 512 KB RAM / 1 MB Flash; Net: 64 KB RAM / 256 KB Flash |
| Wireless | BLE 5.3, Thread, Zigbee, proprietary 2.4 GHz |
| Power (active) | TX 0 dBm: 3.4 mA; RX: 2.7 mA (29% lower TX, 41% lower RX than nRF52840) |
| Power (sleep) | System OFF: ~1 uA |
| SDK | nRF Connect SDK (Zephyr-based) |
| Price | ~$5.50-6.50 USD @ 1k qty |

**8 kHz feasibility:** Same SAADC capability as nRF52840. The dual-core architecture is the key differentiator: the network core handles the entire BLE/ESB radio stack independently, while the application core runs the ADC pipeline. This eliminates the timing conflicts between ADC sampling and radio events that plague single-core designs. The application core at 128 MHz provides ample headroom.

**Verdict:** Best technical fit. Dual-core eliminates ADC/radio contention entirely. However, the QFN94 package at 7x7 mm is larger than the QFN48 nRF52840 (6x6 mm), which matters for the flex PCB layout. Higher price and power budget.

### 3. ESP32-S3 (Espressif)

| Parameter | Value |
|---|---|
| Package | QFN56 (7x7 mm, ~0.85 mm height) |
| Core | Dual-core Xtensa LX7 @ 240 MHz |
| ADC | 2x 12-bit SAR ADC, 20 channels, DMA supported |
| DMA | GDMA controller supports ADC, SPI, I2S, etc. |
| RAM / Flash | 512 KB SRAM (+ external PSRAM support) / external flash via SPI |
| Wireless | Wi-Fi 802.11 b/g/n + BLE 5.0 |
| Power (active) | ~24 mA CPU; ~95-240 mA during Wi-Fi TX; BLE TX: ~20 mA |
| Power (sleep) | Deep sleep: ~7 uA |
| SDK | ESP-IDF (mature, large community), Arduino support |
| Price | ~$2.50-3.50 USD @ 1k qty |

**8 kHz feasibility:** The ADC hardware can achieve 8 kHz sampling with DMA. However, the ESP32-S3's BLE stack is not optimized for high-throughput low-latency streaming the way Nordic's proprietary modes are. Wi-Fi provides high throughput but at enormous power cost (100-240 mA TX). BLE throughput on ESP32-S3 has been reported as less stable and lower than Nordic's implementation. The chip also requires external flash, adding board area.

**Verdict:** Overpowered and power-hungry for this application. Wi-Fi is unnecessary. BLE performance is inferior to Nordic for this use case. Package size (7x7 mm) and external flash requirement make it a poor fit for the pen's constrained form factor. Best for prototyping only.

### 4. STM32WB55 (STMicroelectronics)

| Parameter | Value |
|---|---|
| Package | UFQFPN48 (7x7x0.55 mm) — thinnest profile |
| Core | Dual-core: Cortex-M4 @ 64 MHz (app) + Cortex-M0+ (radio) |
| ADC | 12-bit ADC, 16 channels, 14 DMA channels via DMAMUX |
| DMA | 14-channel DMA with flexible DMAMUX mapping |
| RAM / Flash | 256 KB SRAM / 1 MB Flash |
| Wireless | BLE 5.4, IEEE 802.15.4, Thread, Zigbee |
| Power (active) | ~3.5 mA typical active; standby: 600 nA |
| Power (sleep) | 600 nA standby with RTC |
| SDK | STM32CubeWB, CubeMX code generator |
| Price | ~$4.00-5.00 USD @ 1k qty |

**8 kHz feasibility:** The 12-bit ADC with 14 DMA channels can handle 8 kHz multi-channel sampling. The dual-core architecture (M4 for app, M0+ for radio) provides similar contention isolation as the nRF5340. The 14 DMA channels via DMAMUX offer excellent flexibility. However, the STM32WB55 does NOT support proprietary 2.4 GHz protocols like Nordic's ESB — it is BLE-only for point-to-point communication. BLE 5.4 with DLE and 2M PHY can theoretically deliver ~1 Mbps, but real-world BLE throughput on STM32WB55 is often reported as ~500-700 kbps, which is marginal for the 768 kbps (+ overhead) requirement.

**Verdict:** Good hardware, but the wireless throughput ceiling is concerning. No proprietary low-latency radio option. The STM32Cube ecosystem is less cohesive than Nordic's nRF Connect SDK for BLE applications. The UFQFPN48 package is attractively thin (0.55 mm).

### 5. RP2040 + External Radio Module (Raspberry Pi)

| Parameter | Value |
|---|---|
| Package | QFN56 (7x7 mm, 0.90 mm height) + radio module |
| Core | Dual-core ARM Cortex-M0+ @ 133 MHz |
| ADC | 12-bit SAR, 500 ksps, 4 external channels (+ 1 temp sensor) |
| DMA | 12 channels, aggregate >100 MB/s |
| RAM / Flash | 264 KB SRAM / external flash only (QSPI) |
| Wireless | None integrated — requires external module (e.g., nRF24L01+) |
| Power (active) | ~25 mA typical |
| Power (sleep) | Dormant: ~0.8 mA; deep sleep not competitive |
| SDK | Pico SDK (C/C++), MicroPython, Arduino |
| Price | ~$0.70 (RP2040) + ~$2-3 (radio module) |

**8 kHz feasibility:** The 500 ksps ADC easily handles 48 ksps (6 ch x 8 kHz). The 12 DMA channels and PIO (Programmable I/O) state machines are extremely flexible. However, only 4 external ADC channels (not 8 like Nordic parts). The killer problem is no integrated radio: adding an external nRF24L01+ module doubles board area, adds an SPI bus, increases power consumption, and complicates the flex PCB layout enormously. The Cortex-M0+ cores also lack hardware floating-point. Sleep power at ~0.8 mA is 500x worse than Nordic parts.

**Verdict:** Not viable for production. The separate radio module is a non-starter in the pen's form factor. Could serve as a bench-top development platform only.

## Relevance to Project

| Constraint | nRF52840 | nRF5340 | ESP32-S3 | STM32WB55 | RP2040+Radio |
|---|---|---|---|---|---|
| Fits 2.5 mm gap | Yes (QFN48) | Marginal (QFN94) | No (ext flash) | Yes (UFQFPN48) | No (2 ICs) |
| 8 kHz x 6ch ADC+DMA | Yes (48/200 ksps) | Yes (48/200 ksps) | Yes | Yes | Limited (4 ch) |
| 768 kbps+ wireless | Yes (ESB ~1 Mbps) | Yes (ESB ~1 Mbps) | BLE only ~700 kbps | Marginal BLE ~500-700 kbps | Depends on module |
| Power budget | Good | Best | Poor | Good | Poor |
| Proprietary low-latency radio | Yes (ESB/Gazell) | Yes (ESB) | No | No | Via ext module |
| SDK maturity for BLE streaming | Excellent | Excellent | Good | Moderate | N/A |
| Unit price @ 1k | ~$4.70 | ~$5.50-6.50 | ~$2.50-3.50 | ~$4.00-5.00 | ~$3-4 total |

## Open Questions

1. **nRF52840 QFN48 vs aQFN73:** The QFN48 variant (6x6 mm) sacrifices USB support. Since the pen charges wirelessly and communicates wirelessly, USB may be unnecessary — but it could be useful for firmware flashing and debugging. Does the debug connector on the flex PCB provide sufficient programming access without USB?

2. **nRF5340 package feasibility:** At 7x7 mm, the QFN94 may be too large for the helical flex PCB. Need mechanical CAD analysis to determine if this package can physically fit in the annular gap when wrapped.

3. **ADC channel allocation:** The pen has a pressure sensor, 2x 3-axis IMU (6 axes analog or SPI/I2C), and a capacitive touch array. If the IMUs use SPI/I2C digital interfaces (as most MEMS IMUs do), the ADC channel count drops significantly. Need to finalize the sensor interface plan.

4. **nRF54 series:** Nordic's upcoming nRF54L and nRF54H series may offer better performance and smaller packages. Worth tracking for future iterations.

## Recommendations

1. **Primary recommendation: nRF52840 (QFN48).** Best balance of size, proven wireless stack, proprietary ESB for low-latency streaming, EasyDMA SAADC, and massive ecosystem. The single-core limitation is manageable with PPI hardware and careful firmware design. This is the same family of chips used in wireless gaming mice that achieve 8 kHz polling.

2. **Secondary recommendation: nRF5340.** If the QFN94 package fits the mechanical design, the dual-core architecture eliminates the most significant firmware risk (ADC/radio timing contention). Consider this if early prototyping on the nRF52840 reveals unacceptable jitter or throughput drops.

3. **Eliminate ESP32-S3 and RP2040+Radio** from consideration for production. ESP32-S3 is too power-hungry and lacks proprietary radio. RP2040 requires a separate radio IC. Both are acceptable for bench prototyping.

4. **Keep STM32WB55 as a backup** if supply chain issues affect Nordic parts. Its BLE 5.4 stack may achieve marginal throughput, but lacks the proprietary low-latency radio option.

## References

1. Nordic Semiconductor, "nRF52840 Product Specification," https://docs.nordicsemi.com/bundle/ps_nrf52840/page/keyfeatures_html5.html
2. Nordic Semiconductor, "nRF5340 Product Specification," https://docs.nordicsemi.com/bundle/ps_nrf5340/page/keyfeatures_html5.html
3. Nordic Semiconductor, "QFN and aQFN options for the nRF52840," https://blog.nordicsemi.com/getconnected/qfn-and-aqfn-options-for-the-nrf52840
4. Espressif Systems, "ESP32-S3 Series Datasheet," https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf
5. STMicroelectronics, "STM32WB55xx Datasheet," https://www.st.com/resource/en/datasheet/stm32wb55cc.pdf
6. Raspberry Pi Foundation, "RP2040 Datasheet," https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf
7. LCSC Electronics, "NRF52840-QIAA-R Pricing," https://www.lcsc.com/product-detail/C190794.html
