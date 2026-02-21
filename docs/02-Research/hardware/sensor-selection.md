---
title: "Sensor Selection for 3D Pen"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - sensors
  - IMU
  - pressure-sensor
  - capacitive-touch
related:
  - "[[flex-pcb-design]]"
  - "[[mechanical-design]]"
---

## Summary

This note evaluates specific sensor components for the 3D Pen, focusing on three categories: pressure/force sensors for writing force measurement, MEMS IMU/accelerometers for 3D position and orientation tracking, and capacitive touch sensor ICs for user input along the pen body. The critical constraint is that all components must fit within the ~2.5mm annular gap between the refill (6mm diameter) and the outer shell (11mm diameter), making package height the single most important selection criterion.

## Context

The 3D Pen requires three sensor subsystems:

1. **Pressure sensing** (~40mm zone behind the nib): Measures writing force applied to the refill tip, which translates to stroke pressure/opacity in the digital output. Must detect forces in the 0.1N - 10N range with high sensitivity.
2. **Dual IMU/accelerometers** (one at each end of the pen): Provide real-time 3D acceleration and angular velocity data for reconstructing pen position and orientation. Sampled at the highest feasible rate (target ~8kHz for accelerometer, ~4kHz for gyroscope).
3. **Capacitive touch array** (linear strip along pen body): Detects finger position and tap gestures for user interface functions (mode switching, undo, etc.).

All sensors stream raw data to the MCU, which relays everything wirelessly to the host. No on-pen processing or filtering is performed.

## Key Findings

### 1. Pressure / Force Sensors

The pressure sensor must fit in the 40mm zone behind the nib, between the refill and the inner shell wall. Available radial space is ~2.5mm, but the sensor wraps around or sits alongside the cylindrical refill, so effective thickness must be under ~1.0mm to allow for PCB substrate and adhesive.

#### Candidates Evaluated

| Parameter | Interlink FSR 400 Short | TE Connectivity DT Piezo Film | RP-S40-ST (Generic FSR) | TDK PiezoHapt Actuator |
|---|---|---|---|---|
| Type | Force Sensitive Resistor | PVDF Piezo Film | Thin Film FSR | Piezoelectric Ceramic |
| Active Area | 5.6mm diameter circle | Customizable (rectangular) | 36mm x 36mm | Various |
| Thickness | ~0.3-0.46mm | ~0.028mm (film only) | ~0.42-0.45mm | ~0.5-1.0mm |
| Force Range | 0.2N - 20N | Dynamic pressure | 0.1N - 100N | N/A (actuator) |
| Interface | Analog resistive | Analog voltage | Analog resistive | Analog voltage |
| Power | Passive (no power needed) | Passive (generates voltage) | Passive (no power needed) | Passive / driven |
| Approx. Price | ~$6-8 each | ~$5-15 per sheet | ~$2-5 each | ~$10-20 |
| Fit for Pen | Good -- small, thin | Excellent -- ultra-thin | Too large as-is; can be cut | Dual-use but thicker |

**Analysis:**

- **TE Connectivity PVDF Piezo Film (DT Series):** The standout candidate for writing pressure detection. At only 28um (0.028mm) thick, the PVDF piezoelectric film is by far the thinnest option. It wraps easily around or alongside the refill. It generates voltage proportional to dynamic pressure changes -- ideal for detecting writing strokes. However, it does not measure static force (DC response), only changes in force. For writing applications, this is acceptable since we care about stroke dynamics. Can be cut to custom shapes. Available as sheets (CAT-PFS0003) or pre-cut elements (CAT-PFS0004).

- **Interlink FSR 400 Short:** A proven force-sensing resistor with a small 5.6mm active area. At ~0.3-0.46mm thickness, it fits within our radial budget. Measures static force (DC through dynamic). The small circular active area is appropriate for detecting force transmitted axially through the refill. Price is moderate. This is the safest, most well-documented option.

- **RP-S40-ST:** The 40mm x 40mm active area is too large but could potentially be cut down. Thickness of ~0.42mm is acceptable. A cost-effective alternative if a custom FSR shape is needed.

**Recommendation:** Use the **Interlink FSR 400 Short** for prototyping due to its established documentation, appropriate size, and ability to measure both static and dynamic force. For production, investigate **custom PVDF piezo film** from TE Connectivity for its ultra-thin profile and superior dynamic sensitivity.

### 2. MEMS IMUs / Accelerometers

Two IMUs are needed -- one at each end of the pen -- to enable differential measurement of rotation and translation. Package height is the critical dimension: the IMU sits on the flex PCB (0.11mm) and must fit within the 2.5mm radial gap, leaving ~2.0mm maximum component height after accounting for PCB, solder, and clearance.

#### Candidates Evaluated

| Parameter | STMicro LSM6DSO | Bosch BMI270 | TDK ICM-42688-P | Analog ADXL362 |
|---|---|---|---|---|
| Type | 6-axis IMU (Accel+Gyro) | 6-axis IMU (Accel+Gyro) | 6-axis IMU (Accel+Gyro) | 3-axis Accelerometer only |
| Package | LGA-14 | LGA-14 | LGA-14 | LGA-16 |
| Dimensions (L x W x H) | 2.5 x 3.0 x 0.83mm | 2.5 x 3.0 x 0.80mm | 2.5 x 3.0 x 0.91mm | 3.0 x 3.25 x 1.06mm |
| **Package Height** | **0.83mm** | **0.80mm** | **0.91mm** | **1.06mm** |
| Accel Range | +/-2/4/8/16g | +/-2/4/8/16g | +/-2/4/8/16g | +/-2/4/8g |
| Gyro Range | +/-125 to 2000 dps | +/-125 to 2000 dps | +/-15.6 to 2000 dps | N/A |
| Accel ODR (max) | 6.66 kHz | 6.4 kHz | 32 kHz | 400 Hz |
| Gyro ODR (max) | 6.66 kHz | 6.4 kHz | 32 kHz | N/A |
| Accel Noise Density | 70 ug/rtHz | 120 ug/rtHz | 70 ug/rtHz | 175-550 ug/rtHz |
| Interface | SPI / I2C | SPI / I2C | SPI / I2C | SPI |
| Current (high-perf) | ~0.55 mA | ~0.68 mA | ~0.96 mA | 0.002 mA (at 100Hz) |
| Current (low-power) | ~0.025 mA | ~0.025 mA | ~0.020 mA | 0.00027 mA |
| Supply Voltage | 1.71-3.6V | 1.2-3.6V | 1.71-3.6V | 1.6-3.5V |
| Approx. Price | ~$3-4 | ~$3-5 | ~$4-6 | ~$4-6 |

**Analysis:**

- **TDK ICM-42688-P:** The clear winner for our 8kHz streaming requirement. Its maximum accelerometer and gyroscope ODR of **32kHz** far exceeds our target, providing substantial headroom. It supports the lowest noise density (70 ug/rtHz) tied with the LSM6DSO. Package height of 0.91mm is well within our 2.0mm budget. The higher current draw (0.96mA at high performance) is a trade-off, but acceptable given that sensor data quality is the primary design goal. Used extensively in high-performance gaming mice with nRF52840 MCU at 8kHz polling rates.

- **STMicro LSM6DSO:** Excellent general-purpose 6-axis IMU. Max ODR of 6.66kHz is close to but slightly below our 8kHz target. Package height of 0.83mm is very low. Lower current draw than ICM-42688-P. Best option if 6.66kHz sampling is acceptable.

- **Bosch BMI270:** Optimized for wearables with the lowest package height (0.80mm) and very low power. Max ODR of 6.4kHz is slightly below our target. Best for battery life optimization but sacrifices some sampling rate.

- **Analog ADXL362:** Ultra-low power (270nA wake-up mode) but is an accelerometer only -- no gyroscope. Max ODR of only 400Hz is completely inadequate for our 8kHz target. The 1.06mm package height is also the tallest. **Not suitable** for the primary sensing path but could serve as a low-power wake/sleep detector.

**Recommendation:** Use **TDK ICM-42688-P** for both IMU positions. Its 32kHz max ODR provides 4x headroom above our 8kHz target, and its noise performance is best-in-class. The 0.91mm package height fits comfortably within the 2.5mm radial gap. For a lower-power alternative (at the cost of max ODR), the **LSM6DSO** is a strong second choice.

### 3. Capacitive Touch Sensor ICs

The capacitive touch system must detect finger presence and position along a linear strip on the pen body. The IC reads capacitance changes from electrode pads on the flex PCB (no discrete sensing elements needed -- the copper pads on the PCB serve as the sensor).

#### Candidates Evaluated

| Parameter | Microchip AT42QT1012 | TI FDC1004 | Microchip AT42QT2120 | Azoteq IQS263 |
|---|---|---|---|---|
| Type | 1-ch toggle touch | 4-ch cap-to-digital | 12-ch touch slider | 4-ch touch + slider |
| Package | SOT-23-6 | WSON-10 / VSSOP-10 | QFN-32 | DFN-10 (2x2mm) |
| Package Height | ~1.1mm | ~0.8mm (WSON) | ~0.9mm | ~0.75mm |
| Channels | 1 | 4 | 12 (with slider support) | 3 touch + 1 slider |
| Interface | Digital output | I2C | SPI / I2C | I2C |
| Resolution | On/off toggle | 16-bit CDC | Touch + wheel/slider | Touch + linear slider |
| Power (active) | ~15 uA | ~340 uA | ~1 mA | ~150 uA |
| Supply Voltage | 1.8-5.5V | 3.3V | 1.8-5.5V | 1.8-3.3V |
| Self/Mutual Cap | Self-cap | Mutual or self | Self-cap (mutual avail.) | Self + projected |
| Key Feature | Ultra-simple; single button | High resolution CDC | Multi-key + slider built-in | Tiny; slider built-in |
| Approx. Price | ~$0.60 | ~$2.50 | ~$2.80 | ~$1.20 |

**Analysis:**

- **TI FDC1004:** A 4-channel capacitance-to-digital converter with 16-bit resolution and +/-15pF full-scale range per channel. Can handle sensor offset capacitance up to 100pF, which is important when routing through a flex PCB with variable parasitic capacitance. The high resolution allows precise finger position interpolation between electrode pads. Available in WSON-10 (3x3x0.8mm) -- package height fits our constraint. Requires firmware processing of raw capacitance values to determine touch position.

- **Azoteq IQS263:** Integrates 3 touch channels plus a dedicated linear slider channel in a tiny 2x2x0.75mm DFN package. The built-in slider functionality reduces firmware complexity. Very low profile at 0.75mm. Supports proximity detection (approach sensing) which could enable "hover" detection before pen touches paper. Best balance of features, size, and simplicity.

- **Microchip AT42QT2120:** 12 channels with built-in slider/wheel support in QFN-32. More channels than we need, and the QFN-32 package (5x5mm) is relatively large for our application. Best for applications needing many touch keys.

- **Microchip AT42QT1012:** Ultra-simple single-button toggle. Too basic for our slider requirement, but could be used as a supplementary "single button" sensor if needed.

**Recommendation:** Use **Azoteq IQS263** for the primary capacitive touch interface. Its integrated slider functionality, tiny 2x2mm footprint, 0.75mm height, and proximity detection features make it ideal for the pen's linear touch strip. The **TI FDC1004** is the alternative if higher-resolution capacitance measurement is needed for the ML pipeline (raw capacitance data could serve as additional features for grip detection).

### 4. Haptic Feedback Actuator (Brief Assessment)

For haptic feedback, a linear resonant actuator (LRA) is the most space-efficient option. The Jinlong Z-LRA-0825 (8mm diameter x 2.5mm height) or similar coin-type LRA would fit within the pen diameter but consumes most of the radial gap. An alternative is a TDK PowerHap piezo actuator, which can be thinner (~0.5mm) but provides weaker haptic feedback. Given the tight space constraints, haptics should be deprioritized for v1 and added only if volume permits.

## Relevance to Project

### Constraints Compliance Table

| Constraint | Requirement | Proposed Solution | Compliant? |
|---|---|---|---|
| 2.5mm radial gap | Component height < 2.0mm (incl. PCB + solder) | ICM-42688-P: 0.91mm; IQS263: 0.75mm; FSR 400: 0.3mm | YES |
| 8kHz streaming target | IMU ODR >= 8kHz | ICM-42688-P: up to 32kHz | YES |
| Low power budget | Total sensor current < 5mA | ~2x0.96mA (IMU) + 0.15mA (touch) + 0mA (FSR) = ~2.1mA | YES |
| Dual IMU placement | Both ends of pen | Two ICM-42688-P in zones A and D | YES |
| Touch slider along body | Detect finger position on linear strip | IQS263 with 4 electrode pads on flex PCB | YES |
| Pressure sensing at nib | Detect 0.1N - 10N writing force | FSR 400 Short (0.2-20N range) | YES |
| Interface compatibility | SPI or I2C to MCU | All candidates support SPI and/or I2C | YES |

### Total Component Height Stack-Up (Worst Case)

```
Flex PCB substrate:    0.11mm
Solder paste:          0.05mm  (estimated after reflow)
Tallest component:     1.06mm  (ADXL362 -- not recommended)
                    or 0.91mm  (ICM-42688-P -- recommended)
Clearance to shell:    0.10mm  (minimum)
---------------------------------
Total:                 1.17mm  (with ICM-42688-P)
Available:             2.50mm
Margin:                1.33mm  -- ample
```

## Open Questions

1. **FSR 400 integration geometry:** How does the FSR 400 Short physically sit between the refill and the flex PCB? Does the refill press against it axially (force transmitted down the refill when writing), or does it wrap around the refill radially?
2. **Dual IMU synchronization:** Can two ICM-42688-P devices share the same SPI bus with independent chip selects, and can they be synchronized to sample simultaneously?
3. **Capacitive touch through the outer shell:** The touch electrodes are on the flex PCB inside the pen, but the user touches the outer shell. What is the maximum shell wall thickness that allows reliable capacitive sensing? This depends on shell material and dielectric properties.
4. **ADC requirements for FSR:** The FSR produces a variable resistance (analog). Does the MCU have sufficient ADC resolution and sampling rate for pressure sensing, or is an external ADC needed?
5. **IMU mounting orientation:** The helical flex PCB means the IMU is mounted at an angle relative to the pen axis. The ML model can compensate for this, but the exact mounting angle must be known and repeatable.

## Recommendations

1. **Order evaluation boards** for the ICM-42688-P (TDK InvenSense dev kit) and IQS263 (Azoteq evaluation kit) to validate sensor performance before flex PCB layout.
2. **Prototype the FSR 400 Short** in a pen-like fixture to characterize its force-to-resistance curve in the writing force range (0.5-5N typical writing pressure).
3. **Use SPI for IMU communication** (not I2C) to achieve the highest possible data throughput at 8kHz+ sampling rates. I2C at 400kHz or even 1MHz may become a bus bottleneck with two IMUs streaming 6-axis data.
4. **Design the capacitive touch electrode pattern** as 4-6 rectangular copper pads on the flex PCB, spaced evenly along the pen's grip zone, connected to the IQS263 channels.
5. **Budget 2.1mA for total sensor current** in the power budget calculations, with potential to reduce by duty-cycling the touch sensor.

## References

1. TDK ICM-42688-P Datasheet -- https://product.tdk.com/system/files/dam/doc/product/sensor/mortion-inertial/imu/data_sheet/ds-000347-icm-42688-p-v1.6.pdf
2. Bosch BMI270 Product Page -- https://www.bosch-sensortec.com/products/motion-sensors/imus/bmi270/
3. STMicroelectronics LSM6DSO Datasheet -- https://www.st.com/resource/en/datasheet/lsm6dso.pdf
4. Analog Devices ADXL362 Datasheet -- https://www.analog.com/media/en/technical-documentation/data-sheets/ADXL362.pdf
5. Interlink Electronics FSR 400 Series -- https://www.interlinkelectronics.com/fsr-400-series
6. TE Connectivity Piezo Film Sensors -- https://www.te.com/en/product-CAT-PFS0004.html
7. TI FDC1004 Product Page -- https://www.ti.com/product/FDC1004
8. Microchip AT42QT1012 Product Page -- https://www.microchip.com/en-us/product/at42qt1012
