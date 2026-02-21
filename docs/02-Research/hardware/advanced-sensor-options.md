---
title: "Advanced Sensor and Power Options for 3D Pen"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - sensors
  - piezoelectric
  - accelerometer
  - wireless-charging
  - motion-sync
  - charge-amplifier
related:
  - "[[sensor-selection]]"
  - "[[wireless-charging]]"
  - "[[flex-pcb-design]]"
  - "[[firmware-architecture]]"
  - "[[power-management]]"
---

# Advanced Sensor and Power Options for 3D Pen

## Summary

This note investigates specific advanced component and firmware leads identified in prior conversations that extend beyond the baseline selections documented in `[[sensor-selection]]` and `[[wireless-charging]]`. The topics covered are: GaPO4 piezoelectric crystals (Piezocryst T-Series) as a higher-fidelity alternative to FSR pressure sensing, the ADXL367 ultra-low power accelerometer as a battery-life optimization candidate, Renesas WattUp RF-based wireless charging as a flex-PCB-friendly alternative to Qi induction, the Motion Sync firmware technique for minimizing sensor-to-host latency, charge amplifier circuit design for piezoelectric sensors on flex PCB, and patent US20030223803A1 describing a prior-art pen with piezoelectric sensors. Each topic is evaluated against our existing component selections and the project's dimensional, power, and performance constraints.

## Context

Our baseline sensor selection (see `[[sensor-selection]]`) chose the **Interlink FSR 400 Short** for pressure sensing, the **TDK ICM-42688-P** for dual 6-axis IMU, and the **Azoteq IQS263** for capacitive touch. The wireless charging note (see `[[wireless-charging]]`) selected the **TI BQ51003** Qi receiver with a wire-wound coil. These are proven, well-documented choices appropriate for a v1 prototype.

However, conversations with domain experts identified several alternative components and techniques that could improve performance, reduce power consumption, or better exploit the pen's cylindrical flex-PCB form factor. This note evaluates each lead to determine whether it warrants inclusion in v1 design, a v2 upgrade path, or should be set aside.

## Key Findings

### 1. GaPO4 Piezoelectric Crystals -- Piezocryst T-Series

Gallium phosphate (GaPO4) is a single-crystal piezoelectric material with superior properties compared to quartz: higher piezoelectric coupling coefficient, no pyroelectric effect (immune to temperature-induced false signals), and excellent long-term stability. Piezocryst GmbH manufactures the T-Series miniature pressure sensor using GaPO4 sensing elements.

**T-Series specifications (from Piezocryst datasheet):**

| Parameter | Value |
|---|---|
| Sensing element | GaPO4 single crystal |
| Mounting thread | M3.5 x 0.35 |
| Housing diameter | 3.5mm |
| Operating temp range | -55C to +120C |
| Pressure range | Up to 500 bar (model-dependent) |
| Natural frequency | ~170 kHz |
| Sensitivity | ~5.3 pC/bar (model-dependent) |
| Housing design | Double Shell (outer absorbs mounting disturbance, inner is force-free) |
| Linearity | Superior to quartz (per Piezocryst claims) |
| Output | Charge (pC) -- requires external charge amplifier |

**Comparison with FSR 400 Short (our baseline):**

| Parameter | Piezocryst T-Series (GaPO4) | Interlink FSR 400 Short |
|---|---|---|
| Sensing principle | Piezoelectric (charge output) | Force-sensitive resistor (analog) |
| Sensitivity | Very high (~5.3 pC/bar); 170 kHz bandwidth | Moderate; bandwidth limited by RC |
| Static force measurement | No (AC-coupled; measures dynamic changes only) | Yes (measures static and dynamic force) |
| Temperature stability | Excellent (no pyroelectric effect) | Moderate (resistance drifts with temp) |
| Thickness | ~3.5mm diameter housing (does NOT fit 2.5mm gap) | ~0.3-0.46mm (fits easily) |
| Signal conditioning | Requires charge amplifier circuit | Simple voltage divider or ADC |
| Power | Passive sensor; amplifier draws ~0.1-1mA | Passive (no power) |
| Price | ~$50-200+ per sensor (industrial grade) | ~$6-8 per sensor |

**Critical dimensional issue:** The T-Series housing is **3.5mm in diameter** with an M3.5 mounting thread. Our annular gap is only 2.5mm radially. The T-Series sensor physically cannot fit within the pen's form factor in its standard housing. Even the bare GaPO4 crystal element, while smaller than the housing, would require a custom mounting solution and would likely still exceed our radial budget once the charge amplifier circuit is accounted for.

**Assessment:** The T-Series is designed for industrial pressure measurement (engine cylinders, hydraulics) at pressures up to 500 bar -- many orders of magnitude above writing pressure (~0.01-0.1 bar). The sensor is massively over-specified for our application. The GaPO4 material itself has interesting properties (temperature stability, high sensitivity), but the T-Series product line is not suitable for pen integration. A custom PVDF piezo film (as identified in `[[sensor-selection]]`) remains the better piezoelectric option for our form factor. GaPO4 would only become relevant if a custom micro-machined sensing element could be fabricated, which is outside v1 scope.

### 2. ADXL367 Ultra-Low Power Accelerometer

The Analog Devices ADXL367 is an ultra-low power 3-axis MEMS accelerometer. It was flagged as a potential battery-life optimization alternative or supplement to our selected ICM-42688-P.

**ADXL367 specifications:**

| Parameter | Value |
|---|---|
| Type | 3-axis accelerometer (no gyroscope) |
| Package | LGA, 2.2 x 2.3 x 0.87mm |
| Measurement range | +/-2g, +/-4g, +/-8g (selectable) |
| Resolution | 14 bits (0.25 mg/LSB at +/-2g) |
| Max ODR | 400 Hz |
| Noise density | 175 ug/rtHz (at 100 Hz ODR) |
| Power at 100 Hz ODR | 0.89 uA |
| Power at 400 Hz ODR | ~1.4 uA (typical) |
| Wake-up mode power | 180 nA |
| Supply voltage | 1.1V - 3.6V |
| Interface | SPI (4-wire) or I2C |
| FIFO | 512 samples |
| Temperature sensor | Built-in |
| Additional ADC | 1 external analog input channel |

**Comparison with ICM-42688-P (our baseline):**

| Parameter | ADXL367 | ICM-42688-P |
|---|---|---|
| Axes | 3 (accel only) | 6 (accel + gyro) |
| Package height | 0.87mm | 0.91mm |
| Max accel ODR | 400 Hz | 32 kHz |
| Accel noise density | 175 ug/rtHz | 70 ug/rtHz |
| Active power (high-perf) | ~1.4 uA (400 Hz) | ~960 uA (high-perf 6-axis) |
| Low-power / wake-up | 180 nA | ~20 uA |
| Price | ~$4-6 | ~$4-6 |

**Power advantage:** The ADXL367 consumes approximately **685x less power** than the ICM-42688-P at active sampling rates (1.4 uA vs 960 uA). However, this comparison is misleading because the ADXL367 maxes out at 400 Hz ODR while the ICM-42688-P runs at up to 32 kHz, and the ADXL367 lacks a gyroscope entirely.

**Use case analysis:** The ADXL367 is completely unsuitable as a replacement for the ICM-42688-P in the primary sensor path -- its 400 Hz max ODR is 20x below our 8 kHz target, and the absence of a gyroscope eliminates rotational data essential for pen orientation tracking. However, the ADXL367 has a compelling role as a **dedicated wake/sleep detector**:

- In sleep mode, the ADXL367 draws only **180 nA** while monitoring for motion
- When movement is detected, it asserts an interrupt pin to wake the MCU and the ICM-42688-P IMUs
- This allows the full sensor system (ICM-42688-P x2 at ~1.92 mA combined) to be completely powered down during idle periods
- The 512-sample FIFO could buffer initial motion data while the main IMUs power up (~30-40ms startup time for ICM-42688-P)

Note: Our existing sensor-selection note evaluated the older **ADXL362** (similar concept, same ultra-low power class) but dismissed it because of 400 Hz ODR and no gyro. The ADXL367 is its successor with improved resolution (14-bit vs 12-bit) and lower noise, but the same fundamental limitations apply for the primary sensing role. The wake/sleep role was not explored in the original note.

**Battery life impact estimate:**
- Without ADXL367: ICM-42688-P x2 always on = ~1.92 mA idle drain
- With ADXL367 wake controller: ~0.18 uA idle drain (1,067x reduction)
- For a 100 mAh battery, this extends idle standby from ~52 hours to theoretically over 2 years
- Practical standby (with MCU sleep current ~1.5 uA) would be ~60,000 hours vs ~52 hours

### 3. Renesas WattUp RF Wireless Charging

WattUp (developed by Energous, manufactured by Renesas/Dialog Semiconductor) is an RF-based wireless power transfer system operating at **915 MHz and 5.8 GHz**. Unlike Qi (which uses magnetic induction at ~100-200 kHz requiring close coil coupling), WattUp converts ambient RF energy to DC power.

**Key components:**

| Component | Part Number | Description |
|---|---|---|
| Receiver IC | DA2210 | 4-port RF-to-DC rectifier, connects 1-4 antennas |
| Receiver IC (small) | DA2223 | Miniaturized 4-port RF-to-DC rectifier, 1.7 x 1.4 x 0.5mm |
| Power Amplifier | DA3210 | RF power amplifier for transmitter |
| Transmitter IC | DA4100 | Complete transmitter controller |

**DA2223 receiver IC specifications:**

| Parameter | Value |
|---|---|
| Package | 1.7 x 1.4 x <0.5mm |
| RF-to-DC paths | 4 (connect 1-4 antennas) |
| Operating frequency | 915 MHz / 5.8 GHz |
| Antenna | PCB trace, flex PCB, or sheet metal |
| Minimum antenna size | 2mm x 3mm (per Energous documentation) |
| External components | Matching circuit: 2 discrete components per antenna |
| Application targets | Wearables, hearables, hearing aids, asset trackers |

**Comparison with Qi (BQ51003, our baseline):**

| Parameter | WattUp (DA2223) | Qi (BQ51003) |
|---|---|---|
| Technology | RF energy harvesting (5.8 GHz) | Magnetic induction (~100-200 kHz) |
| Receiver IC size | 1.7 x 1.4 x 0.5mm | 4 x 4 x 0.8mm (QFN-20) |
| Receiver antenna | PCB/flex PCB trace (2x3mm min) | Wire-wound coil (9mm dia) or PCB spiral |
| Coil/antenna geometry | Omnidirectional; works with cylindrical form | Planar coil; requires flat alignment |
| Ferrite shield needed | No | Yes (0.1-0.3mm flexible ferrite) |
| Charging distance | Contact to ~15mm (near-field) | Contact to ~5mm |
| Power delivery | Estimated 100-250mW (near-field) | Up to 2.5W |
| Ecosystem maturity | Emerging; limited transmitter availability | Ubiquitous; standard Qi pads work |
| Regulatory | FCC Part 18 certified | Well-established WPC standard |
| Efficiency | Lower than Qi at close range | ~52% end-to-end (per our analysis) |
| Transmitter cost | Requires custom WattUp transmitter ($$$) | COTS Qi pads ($5-15) |

**Flex PCB antenna advantage:** The most compelling feature of WattUp for our project is that antennas can be **fabricated directly on flex PCB material** as simple trace patterns, as small as 2mm x 3mm. This is a natural fit for the 3D Pen's helical flex PCB architecture -- the antenna traces would be integrated into the PCB at zero additional thickness, unlike the Qi wire-wound coil that requires a separate component and ferrite shield.

**Critical limitation:** WattUp requires a **proprietary transmitter** (DA4100 + DA3210 amplifier). Standard Qi charging pads will not work. This means the 3D Pen would need a custom charging cradle with WattUp transmitter hardware, eliminating the benefit of universal Qi charger compatibility.

**Power delivery concern:** Available documentation does not specify exact power output in milliwatts for the DA2223 receiver. The system is designed for low-power IoT devices (hearables, trackers) and may deliver only 100-250mW in near-field mode. Our battery requires ~200-250mW for 0.5C-1C charging of a 100mAh cell, which is at the upper end of WattUp's estimated range.

**Assessment:** WattUp is technically interesting for v2 or v3 due to the flex PCB antenna integration advantage and elimination of the ferrite shield. However, for v1 the ecosystem immaturity, proprietary transmitter requirement, and uncertain power delivery make it a poor choice. The BQ51003 Qi solution remains the correct v1 selection. WattUp should be re-evaluated when the transmitter ecosystem matures and power output specifications are better documented.

### 4. Motion Sync Firmware Technique

Motion Sync is a firmware synchronization technique originating from high-performance gaming mice that aligns sensor SPI reads with host USB polling events. This technique is directly applicable to our pen's nRF52840 firmware.

**Problem it solves:**
The pen's sensor (ICM-42688-P) and the host computer's USB/wireless polling operate on independent clocks. Without synchronization, the MCU reads the sensor at arbitrary points in the sensor's internal measurement cycle. This means the host often receives "stale" data from the previous measurement cycle, or data from non-uniform time intervals, introducing variable latency of 0 to 1 full polling interval.

**How Motion Sync works:**
1. The MCU tracks the timing of incoming host poll requests (USB SOF tokens or ESB poll packets)
2. The MCU predicts when the next poll will arrive based on the established polling interval
3. Just before the predicted poll time, the MCU issues an SPI read to the sensor
4. The freshest possible sensor data is immediately available when the host poll arrives

**Latency improvement:**
- Without Motion Sync: sensor-to-host latency varies from 0 to T_poll (one full polling interval), with an average of T_poll/2
- With Motion Sync: latency is reduced to a small, deterministic value approximately equal to T_spi_read (the SPI transaction time, typically 10-50us)
- At 8 kHz polling (T_poll = 125us), Motion Sync reduces average latency from ~62.5us to ~25us (saving ~37.5us average)

**Implementation on nRF52840:**
The nRF52840 has 4 SPI peripherals: SPIM0-2 (8 MHz max) and SPIM3 (32 MHz max). The ICM-42688-P supports SPI up to 24 MHz. Using SPIM3 at 24 MHz, a full 6-axis read (14 bytes) takes approximately:

```
14 bytes x 8 bits / 24 MHz = ~4.7 us per IMU
Two IMUs = ~9.4 us total SPI time
```

The firmware implementation requires:
1. **Timer-based poll prediction:** Use a hardware timer (nRF52840 TIMER peripheral) to track inter-poll intervals and predict the next poll arrival
2. **SPI read scheduling:** Configure a PPI (Programmable Peripheral Interconnect) channel to trigger the SPI read automatically at the predicted time minus the SPI transaction duration
3. **Double-buffering:** Use two data buffers -- one being filled by the current SPI read, one being transmitted to the host -- to prevent data corruption
4. **Clock drift compensation:** The host and pen clocks will drift over time. The firmware must continuously adjust the poll prediction based on observed poll arrival times, using an exponential moving average or PLL-like algorithm

**Interaction with ESB protocol:** In our wireless architecture (ESB at 4-8 kHz), the "poll" is the ESB packet exchange. The receiver (host dongle) initiates communication, and the pen responds with sensor data. Motion Sync would schedule the IMU SPI reads to complete just before the expected ESB RX window, so the transmitted packet contains the freshest data.

**Trade-off:** Motion Sync introduces a small fixed delay (holding the SPI read until just before the poll) in exchange for eliminating variable delay. A common misconception is that it reduces total latency -- it actually makes latency more consistent and slightly lower on average, which improves perceived smoothness of pen tracking.

### 5. Charge Amplifier Circuit for Piezoelectric Sensors

If a piezoelectric pressure sensor (PVDF film or GaPO4 element) is used instead of the FSR 400, a charge amplifier circuit is required to convert the sensor's charge output (picocoulombs) to a measurable voltage.

**Basic charge amplifier topology:**
```
                    Cf (feedback capacitor)
                 +---||---+
                 |        |
                 |   Rf   |
                 +--/\/\--+
                 |        |
  Piezo ----+---|- \      |
            |      >--+---+--- Vout
  GND ------+---+/ op-amp
                 |
                 GND
```

- **Cf (feedback capacitor):** Sets the charge-to-voltage gain: Vout = Q_in / Cf. For a PVDF film generating ~5-50 pC per Newton of writing force, Cf in the 10-100 pF range yields millivolt-level outputs
- **Rf (feedback resistor):** Discharges Cf to prevent DC drift; sets the low-frequency cutoff: f_low = 1 / (2 * pi * Rf * Cf). For writing dynamics (>1 Hz), Rf of 1-10 GOhm with Cf of 10 pF gives f_low ~0.016-0.16 Hz
- **Op-amp selection:** Must be JFET-input with ultra-low input bias current (< 1 pA) and low voltage noise. Candidates:
  - **TI OPA2992:** Ultra-low input bias current (3 fA typical), rail-to-rail, 2.7-40V supply, SOT-23-5 package
  - **Analog Devices AD8615:** 1 pA bias current, 1.8-5.0V supply, SC70-5 package (2.0 x 2.1 x 1.0mm)
  - **TI OPA388:** Zero-drift chopper amp, 35 pA bias, excellent for DC accuracy but higher noise

**Flex PCB design considerations:**
- The charge amplifier **must be placed as close as possible** to the piezoelectric sensor (ideally within 5-10mm) to minimize parasitic capacitance from PCB traces, which degrades sensitivity
- High-impedance nodes (inverting input of op-amp) must be guarded with a driven guard ring on the PCB to prevent leakage currents from adjacent traces
- Polyimide flex PCB substrate has relatively high surface resistivity (~10^13 ohm), which is adequate but not as good as FR4 (~10^14 ohm). Conformal coating may be needed on the high-impedance nodes
- The feedback capacitor should use a COG/NPO ceramic type (low dielectric absorption) to minimize signal distortion
- A series input resistor (100-1000 ohm) between the sensor and inverting input damps high-frequency oscillation caused by cable/trace capacitance

**Power consumption:** The charge amplifier circuit draws 0.1-1 mA depending on op-amp selection. The AD8615 draws only 100 uA supply current, making it the best candidate for our power-constrained design.

**Assessment:** The charge amplifier adds complexity (op-amp IC, precision capacitor, high-value resistor, guard ring layout) compared to the FSR 400's simple voltage divider. This is justified only if the piezoelectric sensor's dynamic sensitivity and bandwidth provide measurably better ML model input than the FSR's static + dynamic force measurement. Recommended approach: prototype both FSR and PVDF+charge-amp paths and compare ML model accuracy before committing to the more complex circuit in the flex PCB layout.

### 6. Patent US20030223803A1 -- Writing Pen with Piezo Sensor

This patent (filed 2001, published 2003, inventors: Shahoian et al.) describes a writing instrument with embedded piezoelectric sensors for motion reconstruction and biometric signature verification.

**Key patent claims and features:**

| Aspect | Patent Description |
|---|---|
| Form factor | Standard pen/pencil form factor for writing on any surface |
| Force sensing | Piezoelectric sensors measuring force in three orthogonal directions (X, Y, Z) |
| Acceleration | At least one acceleration sensor for motion tracking |
| Tilt | Tilt sensor measuring gravitational force for orientation |
| Magnetic field | Magnetic field sensors in two directions for additional orientation data |
| Data transmission | Wired or wireless (RF, infrared, ultrasound) |
| Power | Electromagnetic induction (no battery needed) |
| Application | Motion reconstruction for device control; biometric signature verification |
| Surface independence | Works on any surface -- horizontal, vertical, inclined; surface need not be planar |

**Relevance to our project:**

1. **Multi-axis piezoelectric force sensing:** The patent's use of three orthogonal piezo sensors for force measurement is more sophisticated than our single-axis FSR approach. Capturing lateral forces (X and Y components of nib friction) alongside vertical force (Z writing pressure) could provide richer input features for the ML model. This is a design pattern worth exploring.

2. **Sensor fusion approach:** The patent combines piezo force sensors, accelerometers, tilt sensors, and magnetometers -- a comprehensive sensor suite similar to our dual-IMU + pressure sensor architecture. The patent validates the general approach of reconstructing pen motion from multiple complementary sensor modalities.

3. **Electromagnetic induction power:** The patent's approach to powering the pen via electromagnetic induction (like a Wacom digitizer) eliminates the battery entirely. This is an interesting alternative to our Li-ion + wireless charging approach, but it requires a powered base surface (digitizer tablet), which conflicts with our goal of working on any physical paper surface without a special pad.

4. **Prior art consideration:** This patent (filed 2001) predates our work by 25 years. While the patent has likely expired (US utility patents expire 20 years from filing), the techniques described are freely available as prior art. The patent's claims focus on the specific combination of piezoelectric force sensors with biometric signature verification -- our ML-based stroke reconstruction is a distinct application.

**Lessons for our design:**
- Consider adding lateral force sensing (at minimum 2-axis) in v2 to capture nib friction direction, not just vertical pressure
- The patent's use of orthogonal piezo sensors could be approximated by placing PVDF film patches at 90-degree orientations around the refill
- Magnetometers (as used in the patent) are explicitly omitted from our design due to interference concerns from the wireless charging coil and battery, which the patent avoids by using induction power

## Relevance to Project

### Constraints Compliance and Impact Table

| Component / Technique | Fits 2.5mm Gap? | Meets 8 kHz Target? | Power Impact | Recommendation |
|---|---|---|---|---|
| Piezocryst T-Series (GaPO4) | NO (3.5mm housing) | N/A (pressure sensor) | Neutral (passive + amp) | Reject for v1; GaPO4 material interesting if custom micro-machined |
| ADXL367 (wake controller) | YES (0.87mm) | N/A (wake/sleep role only) | Massive savings (180 nA idle vs 1.92 mA) | Strong candidate for v1 as IMU wake/sleep controller |
| Renesas WattUp (DA2223) | YES (0.5mm IC + trace antenna) | N/A (charging) | Neutral | Defer to v2; ecosystem immature, proprietary transmitter |
| Motion Sync firmware | N/A (software) | Improves 8 kHz consistency | Zero (firmware only) | Implement in v1 firmware; no hardware cost |
| Charge amplifier circuit | YES (~1mm total for op-amp) | N/A (pressure signal chain) | +0.1-1 mA | Implement only if PVDF sensor is selected over FSR |
| Patent US20030223803A1 | N/A (prior art) | N/A | N/A | Study multi-axis force sensing approach for v2 |

## Open Questions

1. **ADXL367 wake latency:** How quickly can the ADXL367 detect pen pickup and assert the wake interrupt? The ICM-42688-P requires ~30-40ms to reach full ODR after power-on. Can the ADXL367 FIFO bridge this gap?
2. **WattUp power budget:** What is the actual delivered power (mW) from a DA2223 receiver with a 2mm x 3mm flex PCB antenna at 5mm distance? Is it sufficient for our ~200mA charging requirement?
3. **Motion Sync clock drift:** Over a multi-hour pen session, how much does the nRF52840 crystal clock drift relative to the host USB clock? Does Motion Sync need a PLL-style tracking loop or is a simple moving average sufficient?
4. **Multi-axis force sensing:** Is 3-axis force measurement (per the patent) significantly better than 1-axis for ML stroke reconstruction? This requires a comparative ML experiment with synthetic or collected data.
5. **Charge amplifier EMI:** The wireless transmitter (2.4 GHz) and charging coil (100-200 kHz for Qi) both generate electromagnetic fields near the charge amplifier's high-impedance input. What is the EMI impact on pressure signal quality?
6. **ADXL367 vs ADXL362:** The existing sensor-selection note evaluated the ADXL362 (predecessor). Is the ADXL367's improved 14-bit resolution and lower noise worth the incremental cost difference for the wake/sleep role?

## Recommendations

1. **Add the ADXL367 as a wake/sleep controller** to the v1 bill of materials. Place it on the flex PCB near the pen's center of mass. Configure it in motion-triggered wake-up mode (180 nA) to assert an interrupt that powers on the ICM-42688-P IMUs and the MCU's high-speed peripherals. This single addition has the highest impact-to-cost ratio of any lead investigated here.

2. **Implement Motion Sync in the v1 firmware** using the nRF52840's TIMER and PPI peripherals to schedule SPI reads just before ESB poll windows. This is a zero-hardware-cost optimization that reduces sensor-to-host latency variance and improves pen tracking smoothness.

3. **Defer WattUp RF charging to v2+.** The flex PCB antenna advantage is real, but the proprietary transmitter requirement and uncertain power delivery make it impractical for v1. Monitor the Energous/Renesas ecosystem for transmitter availability and power improvements.

4. **Reject the Piezocryst T-Series** for the 3D Pen. The 3.5mm housing does not fit, the 500 bar pressure range is wildly over-specified, and the industrial pricing is inappropriate. If a GaPO4 micro-element becomes available in a pen-compatible form factor, re-evaluate.

5. **Prototype both FSR and PVDF+charge-amplifier** pressure sensing paths on a test fixture before the flex PCB layout. If PVDF is selected, use the AD8615 op-amp (100 uA, SC70-5 package) and COG/NPO feedback capacitor, placed within 10mm of the sensor on the flex PCB with guard ring layout.

6. **Study multi-axis force sensing** (per the patent) as a v2 enhancement. Two PVDF film patches at 90-degree orientations could capture lateral nib friction in addition to vertical pressure, providing richer ML input features without significantly increasing component count.

## References

1. Piezocryst T-Series Miniature Pressure Sensor Product Page: https://www.piezocryst.com/en/product/T-Series
2. Piezocryst GaPO4 Crystal Technology: https://www.piezocryst.com/en/technology/crystal-technology
3. Analog Devices ADXL367 Datasheet: https://www.analog.com/media/en/technical-documentation/data-sheets/adxl367.pdf
4. Analog Devices ADXL367 Product Page: https://www.analog.com/en/products/adxl367.html
5. Renesas DA2223 WattUp Wireless Power Receiver: https://www.renesas.com/en/products/da2223
6. Energous DA2223 Announcement (package dimensions, antenna specs): https://ir.energous.com/news-events/press-releases/detail/624/energous-corporation-announces-new-da2223-receiver-ic
7. Motion Sync Explained -- Attack Shark: https://attackshark.com/blogs/knowledges/motion-sync-explained-gaming-mouse-precision
8. Endgame Gear Motion Sync Technical Information: https://help.endgamegear.com/hc/en-us/articles/19613949164317-General-information-Motion-Sync
9. All About Circuits -- How to Design Charge Amplifiers for Piezoelectric Sensors: https://www.allaboutcircuits.com/technical-articles/how-to-design-charge-amplifiers-piezoelectric-sensors/
10. Google Patents -- US20030223803A1 Writing Pen with Piezo Sensor: https://patents.google.com/patent/US20030223803
11. GaPO4 Piezoelectric Material for High-Temperature Sensorics (Springer): https://link.springer.com/chapter/10.1007/978-3-642-59497-7_231
12. TDK ICM-42688-P Datasheet (baseline comparison): https://product.tdk.com/system/files/dam/doc/product/sensor/mortion-inertial/imu/data_sheet/ds-000347-icm-42688-p-v1.6.pdf
