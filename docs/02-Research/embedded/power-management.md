---
title: "Power Management and Battery Strategy"
domain: "embedded"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "embedded-agent"
tags:
  - research
  - embedded
  - power
  - battery
  - charging
  - wireless-charging
related:
  - "[[mcu-selection]]"
  - "[[wireless-protocols]]"
  - "[[firmware-architecture]]"
---

# Power Management and Battery Strategy

## Summary

This note analyzes the power budget for the 3D Pen, evaluates small-form-factor Li-ion/LiPo battery options that fit within the pen's cylindrical geometry, and researches battery monitoring ICs and wireless charging integration. The pen's power budget is extremely tight: all electronics must run from a battery that fits inside an 8 mm diameter x ~30 mm length envelope (the space not occupied by the refill and sensors). The target is a minimum 2-hour continuous use time.

## Context

The pen's physical constraints dictate the battery:
- Outer shell diameter: 11 mm
- Refill diameter: 6 mm
- Annular gap: 2.5 mm (this is where the flex PCB and components live)
- Available battery diameter: max ~8 mm (must fit inside the inner cylindrical shell)
- Available battery length: ~25-35 mm (the portion of the pen not occupied by sensors, MCU, or the refill nib mechanism)

The pen is a continuous streaming device. When in use, the MCU, all sensors, and the radio are active simultaneously. There is no "idle during use" scenario — unlike a mouse that only transmits when moved, the pen continuously streams IMU and pressure data whether the user is writing or not (the ML model needs the "no motion" baseline too).

## Key Findings

### 1. Small Cylindrical Battery Options

**Available cylindrical LiPo cells (diameter <= 8 mm):**

| Cell Model | Diameter | Length | Capacity | Voltage | Energy |
|---|---|---|---|---|---|
| LPC80500 | 8 mm | 50 mm | 230 mAh | 3.7 V | 0.85 Wh |
| LPC80350 | 8 mm | 35 mm | ~150 mAh | 3.7 V | ~0.56 Wh |
| LPC80250 | 8 mm | 25 mm | ~100 mAh | 3.7 V | ~0.37 Wh |
| Custom (est.) | 7.5 mm | 30 mm | ~120 mAh | 3.7 V | ~0.44 Wh |

The LPC80500 (8 mm x 50 mm, 230 mAh) is the best capacity option but at 50 mm length may be too long for the pen (it would occupy a third of the pen's 150 mm length). A more realistic choice is a cell in the 25-35 mm length range, yielding 100-150 mAh.

**Flat/pouch LiPo alternative:**
If the battery is positioned as a thin curved strip rather than a cylinder, a custom pouch cell could be formed to wrap around the inner shell. Typical thin pouch cells at 2-3 mm thickness and 8 mm width could provide similar capacity in a more flexible form factor. However, custom cell manufacturing has high MOQ (typically 5,000-10,000 units).

**Key battery constraint:** At 100-150 mAh capacity, the pen's total system draw must stay under **50-75 mA** to achieve 2 hours of operation (100 mAh / 50 mA = 2 hrs).

### 2. Power Budget Estimation

**Per-subsystem power analysis (nRF52840-based design):**

| Subsystem | Active Current | Duty Cycle | Average Current | Notes |
|---|---|---|---|---|
| MCU core (64 MHz) | 5.0 mA | 10% | 0.5 mA | CPU active only during packetize + housekeeping |
| MCU core (sleep between events) | 0.003 mA | 90% | 0.003 mA | System ON, RAM retention |
| SAADC (6 ch, 8 kHz) | 1.0 mA | 25% | 0.25 mA | Active during acquisition (~31 us / 125 us) |
| Radio TX (ESB, 0 dBm) | 5.3 mA | 40% | 2.12 mA | TX active ~100 us / 250 us (at 4 kHz batch) |
| Radio RX (ACK wait) | 4.6 mA | 10% | 0.46 mA | Brief RX window for ACK |
| IMU #1 (e.g., ICM-42688-P) | 0.8 mA | 100% | 0.8 mA | Continuous 8 kHz ODR |
| IMU #2 | 0.8 mA | 100% | 0.8 mA | Continuous 8 kHz ODR |
| Pressure sensor (piezo + amp) | 0.2 mA | 100% | 0.2 mA | Continuous |
| Capacitive touch controller | 0.5 mA | 100% | 0.5 mA | Continuous scan |
| Haptic driver (quiescent) | 0.1 mA | 100% | 0.1 mA | Standby; active only on events |
| Haptic driver (active burst) | 50 mA | 0.1% | 0.05 mA | Brief vibration pulses |
| Voltage regulator (quiescent) | 0.01 mA | 100% | 0.01 mA | LDO or buck converter |
| Battery monitor IC | 0.005 mA | 100% | 0.005 mA | MAX17048 hibernate: 3 uA |
| **Total (active streaming)** | | | **~5.8 mA** | |

**Runtime estimates:**

| Battery Capacity | System Current | Runtime |
|---|---|---|
| 100 mAh | 5.8 mA | 17.2 hours |
| 100 mAh (with 80% usable) | 5.8 mA | 13.8 hours |
| 150 mAh | 5.8 mA | 25.9 hours |
| 150 mAh (with 80% usable) | 5.8 mA | 20.7 hours |

These numbers are surprisingly favorable. At ~5.8 mA average draw, even a 100 mAh cell provides over 13 hours of continuous use. This is because the nRF52840 and MEMS sensors are extremely low power, and the ESB protocol has minimal radio-on time.

**Reality check — pessimistic estimate:**
Adding safety margins for unaccounted losses (voltage regulator inefficiency ~85%, PCB leakage, higher-than-spec sensor currents):

| Battery Capacity | Pessimistic System Current | Runtime |
|---|---|---|
| 100 mAh (80% usable) | 10 mA | 8.0 hours |
| 150 mAh (80% usable) | 10 mA | 12.0 hours |

Even in the pessimistic case, 8+ hours exceeds the 2-hour target by 4x.

### 3. Sleep Mode Strategies

The pen has three operating states:

**State 1: Active Streaming (writing)**
- All sensors active, MCU running, radio transmitting
- Current: ~5.8-10 mA (as calculated above)
- Triggered by: pen lift from paper, user picks up pen (IMU detects motion)

**State 2: Idle (pen stationary, not writing)**
- IMUs can drop to low-power mode (e.g., ICM-42688-P low-power: 19 uA at 12.5 Hz)
- Radio goes to periodic "heartbeat" mode (1 packet/sec to maintain link)
- Capacitive touch stays active (for button taps to wake)
- Current: ~0.5-1.0 mA
- Timeout: enter after 30-60 seconds of no motion
- Wake: IMU motion interrupt or capacitive touch event

**State 3: Deep Sleep (pen in holder/unused)**
- MCU in System OFF mode (1.5 uA with RAM retention)
- All sensors powered down
- Radio off
- Only capacitive touch or accelerometer wake-on-motion interrupt active
- Current: ~5-20 uA
- Timeout: enter after 5-10 minutes in Idle state
- Wake: capacitive touch or IMU motion interrupt

**Runtime with mixed usage pattern (estimated):**
Assuming 2 hours active + 6 hours idle + 16 hours deep sleep per day:
- Energy per day: (2h x 8mA) + (6h x 0.75mA) + (16h x 0.01mA) = 16 + 4.5 + 0.16 = 20.66 mAh
- With 120 mAh battery: **~5.8 days between charges**

### 4. Battery Monitoring ICs

**MAX17048 (Analog Devices / Maxim):**

| Parameter | Value |
|---|---|
| Package | 2-pin TDFN (1.5 x 1.0 x 0.4 mm) — extremely tiny |
| Voltage measurement | +/- 7.5 mV accuracy |
| Quiescent current | ~3 uA (hibernate mode) |
| Communication | I2C (up to 400 kHz) |
| Fuel gauge method | ModelGauge (voltage-based, no sense resistor needed) |
| Output | State of Charge (%), voltage, alert pin |
| Features | Automatic hibernate, configurable alert threshold |
| Price | ~$0.80-1.20 @ 1k qty |

**BQ27441 (Texas Instruments):**

| Parameter | Value |
|---|---|
| Package | DSBGA-12 (1.6 x 1.6 x 0.6 mm) |
| Voltage measurement | Not specified (coulomb counting + voltage) |
| Quiescent current | ~65 uA (active), ~1 uA (sleep) |
| Communication | I2C (up to 400 kHz) |
| Fuel gauge method | Impedance Track (coulomb counting + voltage modeling) |
| Output | SOC, voltage, current, temperature, remaining capacity |
| Features | Requires sense resistor (10 mOhm), more accurate over lifetime |
| Price | ~$1.50-2.00 @ 1k qty |

**Comparison:**

| Feature | MAX17048 | BQ27441 |
|---|---|---|
| Size | 1.5 x 1.0 mm (smaller) | 1.6 x 1.6 mm |
| Height | 0.4 mm | 0.6 mm |
| Accuracy | Good for small cells | Better long-term accuracy |
| External components | None (no sense resistor) | Needs 10 mOhm sense resistor |
| Power consumption | ~3 uA (hibernate) | ~1 uA (sleep), ~65 uA (active) |
| Complexity | Simple (voltage only) | Complex (coulomb + voltage) |

**Recommendation:** MAX17048. Its smaller size, zero external sense resistor, and simpler integration make it ideal for the pen. The BQ27441's more accurate coulomb counting is overkill for a 100-150 mAh cell where +/- 5% SOC accuracy is sufficient.

### 5. Wireless Charging Integration

**Qi Standard Considerations:**

Standard Qi charging uses receiver coils that are 30-50 mm in diameter — far too large for the pen's 8-11 mm diameter. However, miniature wireless charging solutions exist for wearables:

**Small Receiver Coil Options:**
- Custom wound coils at 10-11 mm diameter are feasible (demonstrated in medical devices)
- WPC-compatible receiver coils as small as 19 mm x 1.0 mm (flat strip) exist
- A helical copper trace on the flex PCB itself could serve as the receiver coil (eliminating a discrete component)

**Receiver IC Options:**

| IC | Package | Power | Features |
|---|---|---|---|
| BQ51013B (TI) | QFN-20 (3.5 x 4.5 mm) | 5W Qi receiver | Standard Qi, widely used |
| P9025AC (Renesas) | WLCSP-25 (2.4 x 2.0 mm) | 5W Qi receiver | FOD, smaller package |
| STWLC04 (ST) | WLCSP (2.1 x 2.4 mm) | 1W Qi receiver | Designed for wearables |

**Charging IC (Li-ion charger):**

| IC | Package | Features |
|---|---|---|
| MCP73831 (Microchip) | SOT-23-5 (2.9 x 1.6 mm) | 500 mA linear charger, simple |
| BQ25100 (TI) | DSBGA-6 (1.2 x 0.8 mm) | 250 mA, ultra-small |
| LTC4054 (Analog) | SOT-23-5 | 800 mA, thermal regulation |

For a 100-150 mAh cell, a 100-150 mA charge rate (1C) is appropriate. This means even the tiny BQ25100 is sufficient. Full charge time: ~1-1.5 hours.

**Flex PCB Coil Design:**
The most promising approach for the pen is to use copper traces on the flex PCB itself as the wireless charging receiver coil. The flex PCB wraps helically around the inner shell, and one section of the PCB could have a spiral trace pattern that forms a ~10 mm diameter coil. This eliminates a discrete coil component and uses the existing PCB real estate.

Key design challenge: the coil area is small (~78 mm^2 for a 10 mm diameter circle), so coupling efficiency will be low (~30-50% vs ~70-80% for standard Qi). With a 5W transmitter pad, the pen might only receive ~1-2W, but this is sufficient for 100-150 mA charging.

### 6. Charging Cradle Concept

Given the small receiver coil, a magnetic alignment cradle is essential:

- The pen sits in a shaped cradle that aligns the receiver coil precisely with the transmitter coil
- Magnets in both the pen and cradle ensure correct alignment
- The cradle contains a standard Qi transmitter pad (or custom small transmitter)
- Alignment tolerance: must be within ~2 mm for acceptable efficiency with a 10 mm coil

This is similar to how the Apple Pencil (Gen 2) charges: magnetic alignment ensures consistent power transfer.

## Relevance to Project

| Constraint | Status | Notes |
|---|---|---|
| Battery fits in pen | Feasible | 8 mm x 30 mm cylindrical cell, 100-150 mAh |
| 2-hour runtime | Exceeded | 8-14 hours continuous (pessimistic to optimistic) |
| Wireless charging | Feasible | Flex PCB coil + small Qi receiver IC + magnetic cradle |
| Battery monitoring | Feasible | MAX17048 (1.5 x 1.0 mm, no external components) |
| Total power budget | ~5.8-10 mA | Well within battery capacity |
| Charge time | ~1-1.5 hours | At 1C rate |

## Open Questions

1. **Battery form factor:** Cylindrical vs. custom pouch cell? A pouch cell could be curved to conform to the pen's inner shell, maximizing volume utilization. But custom pouch cells have high MOQ and tooling costs.

2. **Flex PCB coil efficiency:** How much power can a 10 mm diameter helical coil receive in practice? This needs electromagnetic simulation and physical prototyping. If insufficient, a discrete miniature coil may be necessary.

3. **Thermal management:** During charging, the battery and receiver coil will generate heat in a poorly ventilated, sealed enclosure. What is the thermal rise? Li-ion cells should stay below 45C during charging.

4. **Battery lifetime:** At 100-150 mAh and daily use, the cell will undergo ~365 charge cycles per year (if charged daily). Standard LiPo cells are rated for 300-500 cycles before 80% capacity. This gives ~1-1.5 year lifetime before noticeable degradation. Is this acceptable?

5. **Voltage regulation:** The nRF52840 can operate from 1.7-5.5V, so it can run directly from a Li-ion cell (3.0-4.2V) without a regulator. However, other components (IMUs, haptic driver) may need regulated 1.8V or 3.3V. A small LDO or buck converter is likely needed.

6. **Power path management:** During charging, should the pen be usable? This requires a power path management IC (e.g., BQ24074) that can simultaneously charge the battery and power the system. This adds complexity and board area.

## Recommendations

1. **Select an 8 mm x 30-35 mm cylindrical LiPo cell** (120-150 mAh). This provides 10+ hours of continuous streaming with comfortable margin. Source from a battery manufacturer specializing in wearable/medical cells (e.g., LiPol Battery Co).

2. **Use the MAX17048 for battery monitoring.** Its tiny package (1.5 x 1.0 mm), zero external components, and I2C interface make it ideal. No sense resistor means no PCB routing complexity.

3. **Design the wireless charging receiver coil as copper traces on the flex PCB.** This eliminates a discrete coil and uses the existing PCB. Reserve a ~15 mm x 10 mm section of the flex PCB for the spiral coil traces.

4. **Use the BQ25100 (1.2 x 0.8 mm) as the charge management IC** for its tiny size, paired with the STWLC04 wearable Qi receiver IC (2.1 x 2.4 mm).

5. **Implement three-state power management** in firmware: Active (full stream), Idle (low-power sensors, periodic radio), Deep Sleep (system OFF, wake-on-motion). Use the IMU's motion detection interrupt as the primary wake source.

6. **Design a magnetic alignment charging cradle** to ensure consistent coupling with the small receiver coil. Include a Hall sensor or magnet detection in the pen to detect when it is placed in the cradle.

## References

1. LiPol Battery Co, "LPC80500 Cylindrical LiPo Battery," https://www.lipobattery.us/lpc80500-3-7v-230mah-0-851wh-cylindrical-lipo-battery/
2. Analog Devices, "MAX17048/MAX17049 Datasheet," https://www.analog.com/media/en/technical-documentation/data-sheets/MAX17048-MAX17049.pdf
3. Tensentric, "Wireless Power: How Small Can We Go?" https://tensentric.com/thinking_articles/wireless-power-how-small-can-we-go/
4. STMicroelectronics, "Wireless Charging for Wearables," https://www.st.com/content/dam/specialevents-assets/dc22/pdf/room-3-2-stdevcon22-session-wireless-charging-wearables.pdf
5. Small Wireless Charging Coil Manufacturer, WCC, https://www.wirelesschargingcoil.com/small-wireless-charging-coil/
6. Lithium Polymer Batteries, "Thickness 8mm," https://www.lithium-polymer-batteries.com/category/rechargeable-li-polymer-batteries/thickness-8mm/
