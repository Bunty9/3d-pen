---
title: "USB HID Digitizer Protocol for Pen Devices"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - research
  - software
  - hid
  - usb
  - digitizer
  - protocol
related:
  - "[[device-drivers]]"
  - "[[os-input-registration]]"
---

# USB HID Digitizer Protocol for Pen Devices

## Summary

The USB Human Interface Device (HID) specification defines a standardized protocol for input devices to communicate with host computers without device-specific drivers. Section 13 of the HID Usage Tables document defines Usage Page 0x0D (Digitizer Device Page), which covers pen digitizers, touch screens, and stylus devices. This research note documents the HID report descriptor format, mandatory and optional usages for pen digitizers, and how devices like Wacom tablets structure their HID reports. Understanding this protocol is critical for the 3D Pen project because the host software must present the pen as a virtual HID digitizer device that the OS recognizes natively.

## Context

The 3D Pen host software receives raw sensor data (pressure, accelerometer, capacitive touch) from the physical pen via wireless link, runs ML inference to produce (x, y, pressure, tilt) coordinates, and must then inject these as OS-level pen input events. The most robust way to achieve this is to create a virtual HID digitizer device that speaks the standard USB HID pen protocol. Every major OS (Windows, macOS, Linux) has built-in support for HID digitizer devices, meaning no additional application-level drivers are needed once the virtual device is correctly configured.

## Key Findings

### 1. HID Usage Page 0x0D -- Digitizer Device Page

The USB HID Usage Tables specification (maintained by USB-IF at usb.org) defines Usage Page 0x0D exclusively for digitizer devices. The key usage values for pen devices are:

| Usage ID | Usage Name       | Description                                      |
|----------|------------------|--------------------------------------------------|
| 0x01     | Digitizer        | External pen digitizer (e.g., standalone tablet) |
| 0x02     | Pen              | Integrated pen (e.g., tablet PC built-in screen) |
| 0x20     | Stylus           | Collection for stylus-specific data              |

For the 3D Pen project, the virtual device should report as **Usage 0x01 (Digitizer)** since it is an external device, not an integrated screen digitizer. The top-level collection must use Usage Page 0x0D with Usage 0x01 or 0x02.

### 2. Mandatory and Optional HID Usages for Pen Digitizers

Microsoft's Windows pen implementation guidelines define which usages are mandatory and which are optional. These align with the general HID spec and are widely respected across all OSes:

**Mandatory usages (must be present for OS recognition):**

| Usage Page | Usage ID | Usage Name | Report Size | Description                            |
|------------|----------|------------|-------------|----------------------------------------|
| 0x0D       | 0x42     | Tip Switch | 1 bit       | 1 when pen tip contacts surface        |
| 0x0D       | 0x32     | In Range   | 1 bit       | 1 when pen is within detection range   |
| 0x01       | 0x30     | X          | 16 bits     | Absolute X coordinate                  |
| 0x01       | 0x31     | Y          | 16 bits     | Absolute Y coordinate                  |

**Optional but recommended usages (required for full pen experience):**

| Usage Page | Usage ID | Usage Name     | Report Size | Description                          |
|------------|----------|----------------|-------------|--------------------------------------|
| 0x0D       | 0x30     | Tip Pressure   | 10-16 bits  | Contact force (0 = no contact)       |
| 0x0D       | 0x44     | Barrel Switch  | 1 bit       | Side button on pen barrel            |
| 0x0D       | 0x45     | Eraser         | 1 bit       | Eraser mode active                   |
| 0x0D       | 0x3C     | Invert         | 1 bit       | Pen is inverted (eraser end)         |
| 0x0D       | 0x3D     | X Tilt         | 16 bits     | Tilt angle along X axis (degrees)    |
| 0x0D       | 0x3E     | Y Tilt         | 16 bits     | Tilt angle along Y axis (degrees)    |

For the 3D Pen, we need at minimum: Tip Switch, In Range, X, Y, Tip Pressure, and X/Y Tilt. The ML model outputs (x, y, pressure, tilt) map directly to these usages.

### 3. HID Report Descriptor Structure and Example

A HID report descriptor is a binary blob that tells the host how to parse incoming data packets. It uses a tag-based encoding where each item is 1-3 bytes. Here is an annotated example report descriptor for a pen digitizer with pressure and tilt:

```c
// HID Report Descriptor for Pen Digitizer
// Usage Page: Digitizer (0x0D), Usage: Pen (0x02)

0x05, 0x0D,        // USAGE_PAGE (Digitizers)
0x09, 0x02,        // USAGE (Pen)
0xA1, 0x01,        // COLLECTION (Application)

0x85, 0x01,        //   REPORT_ID (1)
0x09, 0x20,        //   USAGE (Stylus)
0xA1, 0x00,        //   COLLECTION (Physical)

// --- Button/Switch fields (1 bit each) ---
0x09, 0x42,        //     USAGE (Tip Switch)
0x09, 0x44,        //     USAGE (Barrel Switch)
0x09, 0x3C,        //     USAGE (Invert)
0x09, 0x45,        //     USAGE (Eraser)
0x09, 0x32,        //     USAGE (In Range)
0x15, 0x00,        //     LOGICAL_MINIMUM (0)
0x25, 0x01,        //     LOGICAL_MAXIMUM (1)
0x75, 0x01,        //     REPORT_SIZE (1)
0x95, 0x05,        //     REPORT_COUNT (5)
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)
0x95, 0x03,        //     REPORT_COUNT (3) -- padding to byte boundary
0x81, 0x03,        //     INPUT (Constant, Variable, Absolute)

// --- X coordinate (16 bits) ---
0x05, 0x01,        //     USAGE_PAGE (Generic Desktop)
0x09, 0x30,        //     USAGE (X)
0x75, 0x10,        //     REPORT_SIZE (16)
0x95, 0x01,        //     REPORT_COUNT (1)
0x55, 0x0D,        //     UNIT_EXPONENT (-3)
0x65, 0x33,        //     UNIT (Inch, English Linear)
0x15, 0x00,        //     LOGICAL_MINIMUM (0)
0x26, 0xFF, 0x7F,  //     LOGICAL_MAXIMUM (32767)
0x35, 0x00,        //     PHYSICAL_MINIMUM (0)
0x46, 0x00, 0x08,  //     PHYSICAL_MAXIMUM (2048) -- ~2 inches
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)

// --- Y coordinate (16 bits) ---
0x09, 0x31,        //     USAGE (Y)
0x26, 0xFF, 0x7F,  //     LOGICAL_MAXIMUM (32767)
0x46, 0x00, 0x0B,  //     PHYSICAL_MAXIMUM (2816) -- ~2.8 inches
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)

// --- Tip Pressure (16 bits) ---
0x05, 0x0D,        //     USAGE_PAGE (Digitizers)
0x09, 0x30,        //     USAGE (Tip Pressure)
0x55, 0x00,        //     UNIT_EXPONENT (0)
0x65, 0x00,        //     UNIT (None)
0x15, 0x00,        //     LOGICAL_MINIMUM (0)
0x26, 0xFF, 0x0F,  //     LOGICAL_MAXIMUM (4095)
0x75, 0x10,        //     REPORT_SIZE (16)
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)

// --- X Tilt (16 bits, signed) ---
0x09, 0x3D,        //     USAGE (X Tilt)
0x16, 0x01, 0x80,  //     LOGICAL_MINIMUM (-32767)
0x26, 0xFF, 0x7F,  //     LOGICAL_MAXIMUM (32767)
0x36, 0xB4, 0xFF,  //     PHYSICAL_MINIMUM (-90) degrees
0x46, 0x5A, 0x00,  //     PHYSICAL_MAXIMUM (90) degrees
0x55, 0x00,        //     UNIT_EXPONENT (0)
0x65, 0x14,        //     UNIT (Degrees)
0x75, 0x10,        //     REPORT_SIZE (16)
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)

// --- Y Tilt (16 bits, signed) ---
0x09, 0x3E,        //     USAGE (Y Tilt)
0x81, 0x02,        //     INPUT (Data, Variable, Absolute)

0xC0,              //   END_COLLECTION (Physical)
0xC0               // END_COLLECTION (Application)
```

**Total report size per packet:** 1 byte (Report ID) + 1 byte (buttons/switches) + 2 bytes (X) + 2 bytes (Y) + 2 bytes (Pressure) + 2 bytes (X Tilt) + 2 bytes (Y Tilt) = **12 bytes**.

### 4. How Wacom Devices Structure HID Reports

The linuxwacom project maintains a public database of HID descriptors extracted from real Wacom devices at [linuxwacom/wacom-hid-descriptors](https://github.com/linuxwacom/wacom-hid-descriptors). Key observations from Wacom's HID implementation:

- **Multi-collection descriptors**: Wacom devices typically define multiple top-level collections -- one for pen input, one for touch (if supported), one for pad buttons, and sometimes vendor-specific collections.
- **Vendor-specific extensions**: Wacom uses Usage Page 0xFF00 (Vendor Defined) for proprietary features like express keys, touch rings, and device configuration. These extend beyond the standard digitizer page.
- **Pressure resolution**: Professional Wacom devices report up to 8192 levels of pressure (13-bit), while consumer models use 2048 or 4096 levels.
- **Protocol evolution**: Wacom has used multiple protocols over the years (Wacom Protocol IV, Wacom Protocol V, HID-Wacom), with newer devices being more HID-compliant and older ones requiring custom parsing by the kernel driver (`wacom.ko`).
- **Report rates**: Wacom pro tablets typically report at 200 Hz, while newer models like the Wacom Pro Pen 3 reach 266 Hz.

### 5. Virtual HID vs Physical USB HID

For the 3D Pen project, the virtual device does not use a physical USB connection. Instead, the host software creates a software-emulated HID device:

| Aspect              | Physical USB HID                          | Virtual HID                                   |
|---------------------|-------------------------------------------|-----------------------------------------------|
| Connection          | Physical USB cable or Bluetooth            | Software-created in kernel/user-space         |
| Report Descriptor   | Stored in device firmware                  | Provided programmatically by host software    |
| Data Flow           | Hardware interrupt transfers               | Memory writes from user-space application     |
| Driver Requirements | OS built-in HID class driver               | Platform-specific virtual device API          |
| Latency             | ~1ms USB polling                           | Sub-millisecond (in-memory)                   |
| OS Recognition      | Automatic via USB enumeration              | Automatic once virtual device is registered   |

Platform-specific APIs for creating virtual HID devices:
- **Windows**: Virtual HID Framework (VHF) via KMDF driver, or HID minidriver (vhidmini2 sample)
- **macOS**: HIDDriverKit (DriverKit), IOHIDUserDevice (legacy IOKit), or Karabiner-DriverKit-VirtualHIDDevice
- **Linux**: `/dev/uhid` (HID-level), `/dev/uinput` (evdev-level, bypasses HID parsing)

### 6. Report Descriptor Physical Units and Ranges

A critical detail: the HID report descriptor must include accurate physical units and ranges for X/Y coordinates. The OS uses these to:
- Map logical coordinates to screen coordinates
- Calculate aspect ratio correction
- Determine tablet active area dimensions

If physical units are missing or incorrect, the pen cursor will exhibit incorrect mapping or aspect ratio distortion. The `UNIT` and `UNIT_EXPONENT` fields encode SI or English units. For digitizers, coordinates are typically expressed in thousandths of an inch or hundredths of a millimeter.

## Relevance to Project

| Constraint / Requirement                | Impact on 3D Pen                                                                 |
|-----------------------------------------|----------------------------------------------------------------------------------|
| Report descriptor must be well-formed   | Host software must generate a valid descriptor at virtual device creation time    |
| Physical units must be accurate         | ML model output range must be mapped to declared physical dimensions             |
| Pressure resolution (10-16 bits)        | ML model pressure output should target 12-bit (4096 levels) minimum              |
| Tilt support is optional but valuable   | Dual-IMU design enables tilt estimation; include X/Y Tilt in descriptor          |
| Report rate matters for smoothness      | At 8 kHz sensor rate, pen reports should be sent at 200+ Hz after ML inference   |
| In Range / Tip Switch state machine     | Host software must manage hover vs contact states based on pressure threshold    |
| Virtual HID requires platform-specific API | Need separate implementations for Windows (VHF), macOS (DriverKit), Linux (uhid) |

## Open Questions

1. **Pressure curve mapping**: Should pressure be linearly mapped from ML output to HID report, or should a configurable transfer curve (gamma, S-curve) be applied before reporting?
2. **Report rate throttling**: The sensor streams at ~8 kHz but ML inference may output at 200-1000 Hz. What is the optimal report rate for the virtual HID device to balance smoothness and CPU usage?
3. **Barrel switch and eraser emulation**: The physical pen has capacitive touch strips. How should touch gestures map to barrel switch and eraser HID usages?
4. **Multi-OS descriptor differences**: Can we use a single report descriptor across all three platforms, or do Windows/macOS/Linux have different requirements for recognition?
5. **Latency mode feature report**: Windows supports an optional latency mode feature report (Usage 0x60) to request low-latency mode from the device. Should the virtual device support this?

## Recommendations

1. **Start with the Microsoft sample descriptor** from the Windows pen implementation guidelines as the baseline, since Windows is the most prescriptive about what it expects. Both macOS and Linux are more permissive.
2. **Include pressure and tilt** in the report descriptor from day one, even if the ML model initially outputs only (x, y). Setting up the descriptor correctly is harder to change later.
3. **Use 16-bit resolution** for X, Y, and pressure fields. This provides room for high-resolution ML output and matches what professional Wacom devices report.
4. **Study the linuxwacom/wacom-hid-descriptors** repository to understand real-world descriptor patterns from shipping products.
5. **Implement a report descriptor builder** in the host software rather than hardcoding hex bytes. Libraries like `hidrd` or custom builder code make descriptors maintainable and testable.

## References

1. USB-IF HID Usage Tables v1.2 (Digitizer Page 0x0D, p161): https://usb.org/sites/default/files/hut1_2.pdf
2. Microsoft Learn -- Supporting Usages in Digitizer Report Descriptors: https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/supporting-usages-in-digitizer-report-descriptors
3. Microsoft Learn -- Pen Sample Report Descriptors: https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/pen-sample-report-descriptors
4. linuxwacom/wacom-hid-descriptors (real Wacom HID descriptor database): https://github.com/linuxwacom/wacom-hid-descriptors
5. Wacom Protocols Wiki (protocol evolution documentation): https://github.com/linuxwacom/input-wacom/wiki/Wacom-Protocols
6. Teensy Forum -- Pen/Stylus Digitizer HID Descriptor: https://forum.pjrc.com/threads/42729-Pen-stylus-digitizer-HID-descriptor-feature-needed
