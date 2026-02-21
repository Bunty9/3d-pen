---
title: "HID Haptic Pen Protocol and Haptic Feedback Implementation"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - research
  - software
  - hid
  - haptics
  - pen
  - waveform
  - digitizer
related:
  - "[[hid-protocol]]"
  - "[[device-drivers]]"
  - "[[os-input-registration]]"
  - "[[sensor-selection]]"
---

# HID Haptic Pen Protocol and Haptic Feedback Implementation

## Summary

The HID Haptic Pen specification extends the standard pen digitizer protocol (Usage Page 0x0D) with a dedicated Haptics Usage Page (0x0E) that allows the host OS and applications to send haptic waveform commands back to the pen. Microsoft's Haptic Pen Implementation Guide defines the complete protocol: the pen advertises its supported waveforms via feature reports (Waveform List, Duration List), and the host triggers haptic events via output reports (Manual Trigger, Intensity). Waveforms are split into two categories -- continuous inking waveforms (simulating pen, pencil, brush textures) and discrete interaction waveforms (click, hover, success, error). Apple's HIDDriverKit provides a parallel path for macOS, using the same HID Digitizer usage page with IOUserHIDEventDriver dispatching stylus events. This note documents the protocol details, waveform catalog, actuator selection, and integration plan for adding haptic feedback to the 3D Pen.

## Context

Our existing HID protocol research (see `[[hid-protocol]]`) covers the standard pen digitizer descriptor: Usage Page 0x0D, mandatory usages (Tip Switch, In Range, X, Y), and optional usages (Pressure, Tilt, Barrel Switch). That work establishes the virtual HID device foundation.

Haptic feedback is an additional layer: the pen must not only *send* input reports to the host but also *receive* output reports containing haptic commands. This creates a bidirectional HID communication channel. The 3D Pen's wireless link (ESB or BLE) must carry haptic commands from the host software back to the pen firmware, which drives a physical actuator (LRA or piezo) embedded in the pen body.

The Surface Slim Pen 2 is the primary commercial reference implementation, using a linear resonant actuator to simulate inking textures and provide interaction feedback. Understanding this protocol is essential if we want the 3D Pen to feel like a premium input device rather than a passive sensor streamer.

## Key Findings

### 1. HID Haptic Pen Device Class and Top-Level Collection

A Haptic Pen is an extension of the standard Pen Device class on Windows. Per Microsoft's Haptic Pen Implementation Guide, the device must present a top-level collection (TLC) as a **digitizer/stylus** using:

- **Usage Page 0x0D** (Digitizers)
- **Usage 0x20** (Stylus)

Within this stylus TLC, the haptic capability is exposed by embedding a **SimpleHapticsController** collection:

- **Usage Page 0x0E** (Haptics)
- **Usage 0x01** (Simple Haptic Controller)

Windows recognizes a pen as a "Haptic Pen" (rather than a regular pen) when both conditions are met: (1) the digitizer/stylus TLC is present with valid pen input reports, and (2) the haptic feedback collection (0x0E, 0x01) is included within that TLC with the mandatory waveforms declared.

A critical prerequisite is **unique pen identification**. The pen digitizer input report must include a Transducer Serial Number (Page 0x0D, Usage 0x5B, 32-bit) and Transducer Vendor ID (Page 0x0D, Usage 0x91, 16-bit USB-IF VID). Without these, haptic features and multi-pen scenarios are disabled by the OS.

### 2. Waveform Catalog: Continuous vs Discrete

The Haptic Pen specification defines 15 waveforms across two categories. The waveforms and their HID usage IDs on Usage Page 0x0E are:

**Mandatory waveforms (must be supported):**

| Waveform | Usage ID | Type | Description |
|---|---|---|---|
| WAVEFORM_NONE | 0x1001 | Control | No-op; does not affect ongoing playback |
| WAVEFORM_STOP | 0x1002 | Control | Stops all ongoing waveform playback |
| WAVEFORM_CLICK | 0x1003 | Discrete | Short "click" feedback; default fallback for unsupported interaction waveforms |
| WAVEFORM_INKCONTINUOUS | 0x100B | Continuous | Simulates ball-point pen inking; default fallback for unsupported inking waveforms |

**Optional waveforms (recommended for complete experience):**

| Waveform | Usage ID | Type | Description |
|---|---|---|---|
| WAVEFORM_PRESS | 0x1006 | Discrete | Press feedback for incremental UI actions |
| WAVEFORM_RELEASE | 0x1007 | Discrete | Release feedback paired with PRESS |
| WAVEFORM_HOVER | 0x1008 | Discrete | Signal when hovering over interactive UI elements |
| WAVEFORM_SUCCESS | 0x1009 | Discrete | Strong signal indicating action success |
| WAVEFORM_ERROR | 0x100A | Discrete | Strong signal indicating failure or error |
| WAVEFORM_PENCILCONTINUOUS | 0x100C | Continuous | Pencil inking texture |
| WAVEFORM_MARKERCONTINUOUS | 0x100D | Continuous | Marker inking texture |
| WAVEFORM_CHISELMARKERCONTINUOUS | 0x100E | Continuous | Chisel marker / highlighter texture |
| WAVEFORM_BRUSHCONTINUOUS | 0x100F | Continuous | Brush inking texture |
| WAVEFORM_ERASERCONTINUOUS | 0x1010 | Continuous | Eraser texture |
| WAVEFORM_SPARKLECONTINUOUS | 0x1011 | Continuous | Special effect (multi-colored brush) |

**Key protocol rules:**
- WAVEFORM_NONE and WAVEFORM_STOP occupy implicit ordinals 1 and 2 and need not appear in the Waveform List or Duration List declarations
- Continuous waveforms have duration defined as zero (play until WAVEFORM_STOP)
- Discrete waveforms must have a positive non-zero duration in milliseconds
- The host only configures (Auto Trigger) continuous waveforms; discrete waveforms are only issued via Manual Trigger output reports
- WAVEFORM_PRESS and WAVEFORM_RELEASE are highly recommended by Microsoft for valuable interaction feedback

### 3. Haptic Output Report Structure

The host issues haptic commands to the pen via output reports within the SimpleHapticsController collection. The report structure contains:

| Field | Usage Page | Usage ID | Mandatory | Description |
|---|---|---|---|---|
| Manual Trigger | 0x0E | 0x21 | Yes | Waveform usage ID to play immediately |
| Intensity | 0x0E | 0x23 | Yes | Percentage (0-100%) of maximum actuator strength |
| Repeat Count | 0x0E | 0x24 | Optional | Number of repeats after initial play |
| Retrigger Period | 0x0E | 0x25 | Optional | Delay in ms between repeats |

Feature reports configure the device's persistent haptic behavior:

| Field | Usage Page | Usage ID | Mandatory | Description |
|---|---|---|---|---|
| Waveform List | 0x0E | 0x10 | Yes | Ordered list of supported waveform usages |
| Duration List | 0x0E | 0x11 | Yes | Duration in ms for each waveform (0 = continuous) |
| Auto Trigger | 0x0E | 0x20 | Yes | Waveform that fires automatically (inking feedback) |
| Auto Trigger Associated Control | 0x0E | 0x22 | Yes | HID usage of the associated input control |
| Waveform Cutoff Time | 0x0E | 0x28 | Optional | Max playback time before automatic cutoff |

**State machine for haptic playback:**
The pen transitions between three haptic states:
1. **Playing** -- actively driving the actuator with a waveform
2. **Paused** -- configured with a waveform but not playing (pen lifted / out of contact)
3. **Stopped** -- no waveform configured, actuator idle

When the pen tip makes contact (Tip Switch = 1), a configured continuous waveform (Auto Trigger) starts playing. When the pen lifts, playback pauses. At any time, the host can issue a Manual Trigger for discrete waveforms (click, success, error), which interrupts the inking waveform temporarily. When the pen goes out of range, it is recommended (but not required) to clear the haptic configuration.

### 4. Sample HID Report Descriptor for Haptic Pen

Microsoft provides a reference descriptor. The key haptic section (nested within the Stylus TLC) follows this structure:

```
05,0E,        // Usage Page (Haptics)
09,01,        // Usage (Simple Haptic Controller)
A1,02,        // Collection (Logical)
  // --- Feature/Output: Repeat Count ---
  85,41,      //   Report ID (65)
  09,24,      //   Usage (Repeat Count)
  B1,02,      //   Feature (Data,Var,Abs)
  09,24,      //   Usage (Repeat Count)
  91,02,      //   Output (Data,Var,Abs)
  // --- Feature/Output: Intensity ---
  09,23,      //   Usage (Intensity)
  B1,02,      //   Feature (Data,Var,Abs)
  09,23,      //   Usage (Intensity)
  91,02,      //   Output (Data,Var,Abs)
  // --- Feature: Auto Trigger / Output: Manual Trigger ---
  09,20,      //   Usage (Auto Trigger)
  B1,02,      //   Feature (Data,Var,Abs)
  09,21,      //   Usage (Manual Trigger)
  91,02,      //   Output (Data,Var,Abs)
  // --- Auto Trigger Associated Control ---
  85,42,      //   Report ID (66)
  09,22,      //   Usage (Auto Trigger Associated Control)
  B1,02,      //   Feature (Data,Var,Abs)
  // --- Duration List (ordinals 3-18) ---
  09,11,      //   Usage (Duration List)
  A1,02,      //   Collection (Logical)
    05,0A,    //     Usage Page (Ordinal)
    19,03,    //     Usage Minimum (Ordinal 3)
    29,12,    //     Usage Maximum (Ordinal 18)
    B1,02,    //     Feature (Data,Var,Abs)
  C0,         //   End Collection
  // --- Waveform List (ordinals 3-18) ---
  05,0E,      //   Usage Page (Haptics)
  09,10,      //   Usage (Waveform List)
  A1,02,      //   Collection (Logical)
    05,0A,    //     Usage Page (Ordinal)
    16,03,10, //     Logical Minimum (0x1003 = WAVEFORM_CLICK)
    26,FF,2F, //     Logical Maximum (0x2FFF)
    19,03,    //     Usage Minimum (Ordinal 3)
    29,12,    //     Usage Maximum (Ordinal 18)
    B1,02,    //     Feature (Data,Var,Abs)
  C0,         //   End Collection
C0            // End Collection (Haptics)
```

Note: Ordinals 1 and 2 are implicitly WAVEFORM_NONE and WAVEFORM_STOP. The Waveform List declares supported waveforms starting from ordinal 3, with the Logical Minimum/Maximum of each ordinal entry specifying the waveform usage ID.

### 5. Apple HIDDriverKit and macOS/iPadOS Stylus Support

Apple's approach to HID stylus input differs from Microsoft's in implementation but shares the same underlying HID specification:

**HIDDriverKit framework:** Apple provides the HIDDriverKit DriverKit extension for developing human interface device drivers, supporting keyboards, pointing devices, and digitizers (pens and touch pads). The key class is `IOUserHIDEventDriver`, which dispatches keyboard, digitizer, scrolling, and pointer events from HID devices.

**Stylus input handling:** Apple's documentation on "Handling Stylus Input from a Human Interface Device" describes processing stylus-related HID reports and dispatching them as system events. The driver reads digitizer usage page (0x0D) reports and translates them into macOS/iPadOS pointer events with pressure and tilt data.

**Key differences from Windows:**
- Apple does not currently document a haptic pen protocol equivalent to Microsoft's Haptic Pen Implementation Guide. Apple Pencil haptic feedback is handled through proprietary Apple-internal protocols, not via HID output reports.
- For third-party pens on macOS, the HID digitizer descriptor (Page 0x0D, Usage 0x20 Stylus) is recognized for input, but haptic output support requires a custom DriverKit extension.
- On iPadOS, only Apple Pencil is supported as a stylus input device; third-party HID pens are not recognized.

**Practical implication for our project:** The 3D Pen's haptic feedback will work natively on Windows (via the standard HID Haptic Pen protocol). On macOS, the pen's input will work as a standard HID digitizer, but haptic feedback will require either a custom DriverKit driver or be handled entirely by our host application software bypassing the OS haptics API.

### 6. Actuator Options for the 3D Pen

Two actuator technologies are viable within the pen's 2.5mm radial gap:

**Linear Resonant Actuator (LRA):**
- Coin-type LRAs as small as 6mm diameter x 2.5mm height are commercially available (e.g., Jinlong Z-LRA-0625)
- Operate at a specific resonant frequency (typically 150-250 Hz); driven with AC signal
- Require a dedicated haptic driver IC (e.g., TI DRV2605L) for waveform generation and auto-resonance tracking
- The DRV2605L (3x3x0.75mm QFN) has a built-in library of over 100 haptic effects
- Pros: Strong, crisp haptic feedback; well-characterized for pen inking simulation; used in Surface Slim Pen 2
- Cons: Physically the largest option; a 6mm LRA plus the driver IC consumes significant space in the pen

**Piezoelectric (Piezo) Actuator:**
- TDK PowerHap series: ultra-thin piezoelectric actuators (~0.5mm thickness)
- Can be driven directly by a high-voltage boost driver (e.g., Boreas BOS1211, 3x3x1mm)
- Piezo actuators can produce both haptic feedback and audio/buzzer output
- Pros: Extremely thin; lower power than LRA; faster response time
- Cons: Weaker force output than LRA; requires high-voltage drive circuit (up to 120V for some piezos); more complex driver electronics

**Recommendation for v1:** If space permits, use a **coin-type LRA (6mm diameter)** paired with the **TI DRV2605L** haptic driver. The LRA provides the most authentic inking feedback and is proven in the Surface Slim Pen 2. Place the LRA in the pen body between the two IMU zones, where the user's fingers grip the pen for maximum felt feedback. If space is too tight, fall back to a **TDK PowerHap piezo actuator** with a Boreas BOS1211 driver for a thinner but weaker haptic solution.

### 7. Integration with Existing HID Report Descriptor

Our existing pen HID descriptor (from `[[hid-protocol]]`) uses Usage Page 0x0D, Usage 0x02 (Pen) as the top-level collection. To add haptic support, the following modifications are needed:

1. **Add Transducer Serial Number and Vendor ID** to the input report (required for haptic feature enablement):
   ```
   09,5B,  // Usage (Transducer Serial Number) - 32 bits
   09,91,  // Usage (Transducer Vendor ID) - 16 bits
   ```

2. **Embed the Haptics collection** (Usage Page 0x0E, Usage 0x01) within the existing Stylus TLC, containing the Waveform List, Duration List, Auto Trigger, and Manual Trigger output report.

3. **Add the Bluetooth keyboard collection** (optional) for tail-end button support: Single Click = WIN+F20, Double Click = WIN+F19, Press and Hold = WIN+F18.

4. **Update the virtual HID device** on the host side to handle bidirectional communication: input reports (pen data from sensor stream) and output reports (haptic commands routed back to the physical pen via the wireless link).

The wireless protocol must support a **downlink channel** from host to pen for haptic commands. The ESB protocol supports bidirectional communication via ACK payloads (the receiver can attach up to 32 bytes of payload to each ACK packet). The haptic output report is small enough (4-6 bytes: Manual Trigger + Intensity + optional Repeat Count) to fit within an ESB ACK payload, providing essentially zero additional latency for haptic commands.

### 8. Surface Slim Pen 2 Developer Notes

The Surface Slim Pen 2 is the primary commercial reference for haptic pen implementation. Key developer findings:

- **Inking waveform interruption bug:** After an interaction waveform (e.g., CLICK) completes, the inking waveform (e.g., INKCONTINUOUS) may not automatically resume. Developers must explicitly re-enable the inking waveform after interaction feedback stops.
- **Unsupported features on Slim Pen 2:** Play Count, Replay Pause Interval, and Play Duration are declared in the descriptor but return incorrect values. The functions `IsPlayCountSupported`, `IsPlayDurationSupported`, and `IsReplayPauseIntervalSupported` should not be relied upon.
- **Haptic categories in practice:** Inking feedback (continuous waveforms) simulates tool textures during active drawing. Interaction feedback (discrete waveforms) provides tactile responses to hovering over buttons, clicking, or completing tasks.

These limitations inform our firmware design: we should implement robust waveform state management and not depend on auto-resume behavior.

## Relevance to Project

| Constraint / Requirement | Impact on 3D Pen |
|---|---|
| Bidirectional HID protocol needed | Wireless link (ESB) must carry haptic output reports from host to pen via ACK payloads |
| Transducer Serial Number required | Pen firmware must store and report a unique 32-bit serial number + 16-bit vendor ID |
| 4 mandatory waveforms minimum | Pen firmware must implement at least NONE, STOP, CLICK, and INKCONTINUOUS |
| Actuator fits in 2.5mm radial gap | LRA (6mm x 2.5mm) fits but consumes most of available radial space; piezo (~0.5mm) is thinner alternative |
| Haptic driver IC needed | DRV2605L (3x3x0.75mm) for LRA or BOS1211 (3x3x1mm) for piezo adds to component count |
| Windows-native haptic support | HID Haptic Pen protocol provides OS-level integration on Windows 11 |
| macOS haptic support limited | No standard haptic pen protocol on macOS; requires custom DriverKit driver or app-level handling |
| Haptic latency budget | Haptic commands must reach actuator within ~10-20ms of host trigger for perceptible responsiveness |

## Open Questions

1. **Wireless downlink bandwidth:** Can ESB ACK payloads carry haptic commands reliably at 4-8 kHz polling rates without impacting sensor data upload throughput?
2. **Actuator space allocation:** With two IMUs, pressure sensor, touch IC, MCU, battery, and charging coil, is there physically enough space for a 6mm LRA plus its driver IC? This requires a detailed mechanical layout study.
3. **Power impact of haptics:** What is the current draw during continuous inking waveform playback? An LRA at resonance typically draws 50-100mA peak, which would significantly impact battery life during extended inking sessions.
4. **macOS haptic path:** Should we implement a custom HIDDriverKit extension for macOS haptics, or route haptic commands entirely through our host application, bypassing the OS?
5. **Waveform tuning:** How do we tune the LRA/piezo drive parameters to differentiate between inking textures (pen vs. pencil vs. brush)? This likely requires iterative user testing with adjustable firmware parameters.
6. **Linux support:** Linux does not have a standard haptic pen protocol. Should we implement haptics on Linux via a custom userspace daemon, or deprioritize it?

## Recommendations

1. **Add haptic support to the HID descriptor from day one**, even if the physical actuator is not present in v1 hardware. Declaring the waveforms in the descriptor is low-cost and ensures Windows recognizes the device as a Haptic Pen, enabling future firmware updates to activate haptics without changing the HID descriptor.
2. **Use ESB ACK payloads for haptic downlink** in the wireless protocol. The 32-byte ACK payload is sufficient for the haptic output report and adds no latency to the sensor data uplink path.
3. **Start with the 4 mandatory waveforms** (NONE, STOP, CLICK, INKCONTINUOUS) plus PRESS and RELEASE for v1. Add the remaining optional waveforms in v2 based on user feedback.
4. **Evaluate the TI DRV2605L + coin LRA** on a breadboard prototype before committing to the flex PCB layout. Measure current draw, vibration amplitude, and subjective haptic quality for each waveform.
5. **Design the firmware haptic state machine** carefully, following Microsoft's state diagram (Playing/Paused/Stopped), and do not rely on auto-resume behavior (per Surface Slim Pen 2 developer notes).
6. **Plan for macOS** by routing haptic commands through the host application layer rather than depending on OS-level HID haptic support, since Apple does not currently expose a standard haptic pen API.

## References

1. Microsoft Learn -- Haptic Pen Implementation Guide: https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/haptic-pen-implementation-guide
2. Microsoft Learn -- Surface Slim Pen 2 Haptics Developer Notes: https://learn.microsoft.com/en-us/surface/surface-slim-pen2-haptics-dev-notes
3. Microsoft Learn -- Pen Interactions and Haptic Feedback (Windows apps): https://learn.microsoft.com/en-us/windows/apps/develop/input/pen-haptics
4. Microsoft Learn -- KnownSimpleHapticsControllerWaveforms Class: https://learn.microsoft.com/en-us/uwp/api/windows.devices.haptics.knownsimplehapticscontrollerwaveforms
5. USB-IF HID Haptics Page Ratification (HUTRR63): https://usb.org/sites/default/files/hutrr63b_-_haptics_page_redline_0.pdf
6. Apple Developer -- Handling Stylus Input from a Human Interface Device: https://developer.apple.com/documentation/hiddriverkit/handling-stylus-input-from-a-human-interface-device
7. Apple Developer -- HIDDriverKit Framework: https://developer.apple.com/documentation/hiddriverkit
8. Microsoft Learn -- Haptic Pen Validation Guide: https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/haptic-pen-validation-guide
9. TI DRV2605L Haptic Driver Datasheet: https://www.ti.com/product/DRV2605L
