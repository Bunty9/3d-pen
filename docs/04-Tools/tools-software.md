---
title: "Software Tool Evaluation for 3D Pen Host Software"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - tools
  - software
  - evaluation
  - host-app
  - canvas
  - drivers
related:
  - "[[hid-protocol]]"
  - "[[device-drivers]]"
  - "[[canvas-rendering]]"
  - "[[os-input-registration]]"
---

# Software Tool Evaluation for 3D Pen Host Software

## Overview

This document evaluates software tools and libraries relevant to the 3D Pen host application. The host software must: (1) receive wireless sensor data from the physical pen, (2) run ML inference to produce (x, y, pressure, tilt), (3) create a virtual pen/digitizer device recognized by the OS, and (4) optionally provide a companion canvas for testing and demonstration.

Tools are evaluated using the ADOPT / TRIAL / ASSESS / HOLD framework:

| Verdict  | Meaning                                                                 |
|----------|-------------------------------------------------------------------------|
| **ADOPT**    | Recommended for immediate use. Well-understood, low-risk.           |
| **TRIAL**    | Worth trying on a non-critical path. Promising but needs validation.|
| **ASSESS**   | Worth researching further. Not ready for project use yet.           |
| **HOLD**     | Not recommended at this time. Too risky, immature, or misaligned.   |

---

## 1. libusb / HIDAPI

**Category:** USB/HID device communication library
**Verdict:** ADOPT

### What It Is

HIDAPI is a cross-platform C library for communicating with USB and Bluetooth HID devices. It is maintained under the libusb organization on GitHub. It provides a simple API (`hid_open`, `hid_read`, `hid_write`, `hid_get_feature_report`) that works on Windows, macOS, Linux, and FreeBSD.

On Linux, HIDAPI supports two backends:
- **hidraw**: Uses the kernel's hidraw interface. Supports both USB and Bluetooth.
- **libusb**: Uses libusb-1.0 for direct USB communication. USB only.

### Relevance to Project

The host software needs to communicate with the 3D Pen's wireless receiver dongle (USB HID device) to read raw sensor data. HIDAPI is the standard tool for this across all platforms.

### Evaluation

| Criterion                  | Assessment                                                        |
|----------------------------|-------------------------------------------------------------------|
| Cross-platform             | Windows, macOS, Linux, FreeBSD                                    |
| Maturity                   | Maintained since 2009, moved to libusb org in 2019                |
| API simplicity             | Single header, single source file per platform, ~10 functions     |
| Language bindings           | C native; bindings for Rust (hidapi-rs), Python, Node.js, etc.  |
| Performance                | Low-overhead; suitable for 8 kHz polling                          |
| Licensing                  | BSD/GPL/HIDAPI (triple-licensed, permissive)                      |
| Active maintenance         | Yes, regular releases on GitHub                                   |

### Key API

```c
#include "hidapi.h"

// Enumerate devices
struct hid_device_info *devs = hid_enumerate(0x1234, 0x5678);

// Open device
hid_device *handle = hid_open(0x1234, 0x5678, NULL);

// Read input report (blocking or with timeout)
unsigned char buf[64];
int res = hid_read_timeout(handle, buf, sizeof(buf), 100); // 100ms timeout

// Non-blocking read (useful for high-frequency polling)
hid_set_nonblocking(handle, 1);
int res = hid_read(handle, buf, sizeof(buf));

// Write output report
unsigned char data[2] = {0x01, 0xFF};
hid_write(handle, data, sizeof(data));

hid_close(handle);
```

### Risks

- On Linux, accessing HID devices requires either root or a udev rule granting user access.
- Bluetooth HID support varies by platform and backend.
- Does not provide virtual device creation -- only communication with existing devices.

### Decision Rationale

HIDAPI is the de facto standard for HID device communication in user-space. It is used by OpenTabletDriver, Steam Controller support, and numerous other projects. There is no credible alternative with equivalent cross-platform support and simplicity.

**Reference:** https://github.com/libusb/hidapi

---

## 2. Tauri / Electron (Host App Framework)

**Category:** Cross-platform desktop application framework
**Verdict:** TRIAL (Tauri) / HOLD (Electron)

### What They Are

Both frameworks enable building cross-platform desktop applications using web technologies (HTML/CSS/JavaScript) for the UI. The key difference is the backend:

- **Electron**: Bundles Chromium + Node.js. ~80-120 MB binary, ~100 MB RAM baseline.
- **Tauri**: Uses the OS native webview (WebView2 on Windows, WebKit on macOS/Linux). Rust backend. ~2.5-3 MB binary, ~30-40 MB RAM baseline.

### Relevance to Project

The host software needs a GUI for:
- Configuration (pressure curves, button mapping, wireless connection)
- Status display (battery, connection quality, sensor data visualization)
- Optional companion canvas for testing

### Evaluation

| Criterion                | Tauri                                    | Electron                                 |
|--------------------------|------------------------------------------|------------------------------------------|
| Binary size              | 2.5-3 MB                                | 80-120 MB                                |
| RAM usage (idle)         | 30-40 MB                                | 100+ MB                                  |
| Startup time             | <500 ms                                 | 1-2 seconds                              |
| Backend language         | Rust                                    | Node.js (JavaScript/TypeScript)          |
| Native API access        | Excellent (Rust FFI, Tauri plugins)     | Good (Node.js native modules, N-API)     |
| Maturity                 | v2.0 released late 2024                 | v31+ (2013, very mature)                 |
| Ecosystem/plugins        | Growing (2700+ stars, Tauri plugins)    | Massive (npm ecosystem)                  |
| Driver integration       | Rust FFI to C libraries (HIDAPI, uinput)| Node native modules or child processes   |
| Security model           | Strict permission system                | Full Node.js access (less restricted)    |

### Key Consideration for 3D Pen

The host software must interface with:
- HIDAPI (C library) for reading the wireless receiver
- Platform-specific virtual device APIs (C/Rust code)
- ML inference engine (likely ONNX Runtime or similar)

Tauri's Rust backend makes it natural to call C libraries directly via FFI. Electron would require Node.js native modules (N-API) or spawning child processes, adding complexity.

### Risks (Tauri)

- Tauri v2.0 is relatively new; some edge cases may emerge.
- The OS native webview has inconsistencies across platforms (especially Linux, where WebKitGTK is used).
- Smaller ecosystem compared to Electron -- fewer ready-made plugins.

### Risks (Electron)

- Excessive resource consumption is problematic for a background service that should be lightweight.
- Shipping a full Chromium instance for a utility application is disproportionate.
- Native module compilation across platforms adds CI/CD complexity.

### Decision Rationale

**Tauri (TRIAL):** The Rust backend aligns perfectly with the low-level system integration the 3D Pen requires (HIDAPI, uinput, VHF driver communication). The small binary and low RAM usage are important for a background service. However, Tauri v2 is still young, so a trial on a non-critical path (e.g., settings GUI) is appropriate before full commitment.

**Electron (HOLD):** The resource overhead is unjustifiable for the 3D Pen's use case. The host app will run continuously in the background, and a 100 MB RAM baseline for a settings GUI is excessive. Electron's maturity advantage does not outweigh this cost.

**References:**
- Tauri: https://tauri.app/
- Electron: https://www.electronjs.org/
- Comparison: https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/

---

## 3. WebHID API

**Category:** Browser API for direct HID device communication
**Verdict:** ASSESS

### What It Is

WebHID is a W3C Web API that allows web applications to communicate directly with HID devices via `navigator.hid`. It provides access to HID input reports, output reports, and feature reports from JavaScript, without requiring native drivers or browser extensions.

### Relevance to Project

WebHID could enable:
- A web-based configuration tool for the 3D Pen (firmware updates, settings)
- A web-based companion canvas that reads directly from the pen's receiver
- A zero-install experience for basic functionality

### Evaluation

| Criterion                  | Assessment                                                        |
|----------------------------|-------------------------------------------------------------------|
| Browser support            | Chrome 89+, Edge 89+, Opera 76+. NO Firefox or Safari.           |
| Security model             | User must grant permission per device via chooser dialog          |
| Performance                | Suitable for moderate report rates; not tested at 8 kHz           |
| HID report parsing         | Manual -- developer must parse raw bytes per report descriptor    |
| Virtual device support     | None -- WebHID is for physical/existing devices only              |
| Ecosystem                  | Small but growing. Wacom STU WebHID library exists.               |

### Key API

```javascript
// Request device access
const [device] = await navigator.hid.requestDevice({
    filters: [{ vendorId: 0x1234, productId: 0x5678 }]
});

await device.open();

// Read input reports
device.addEventListener('inputreport', (event) => {
    const { data, reportId, device } = event;
    // Parse raw bytes...
});

// Write output report
const outputData = new Uint8Array([0x01, 0x00, 0xFF]);
await device.sendReport(reportId, outputData);

// Get feature report
const featureData = await device.receiveFeatureReport(reportId);
```

### Risks

- Cannot create virtual input devices. WebHID is read/write to existing devices only.
- No Firefox or Safari support limits cross-browser reach.
- High-frequency polling (8 kHz) has not been validated in browser context.
- Cannot replace the native virtual device driver -- third-party apps (Photoshop) cannot use WebHID.

### Decision Rationale

**ASSESS:** WebHID is interesting for a supplementary web-based configuration tool or diagnostic page, but it cannot replace the core virtual device driver architecture. The lack of Firefox/Safari support and inability to create virtual devices make it unsuitable as a primary input path. Worth researching further for auxiliary features.

**Reference:** https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API

---

## 4. evdev (Linux)

**Category:** Linux kernel input event interface
**Verdict:** ADOPT

### What It Is

evdev is the Linux kernel's generic input event interface. It provides a standardized way for input devices to report events (key presses, absolute/relative axis movements, etc.) to user space via `/dev/input/eventN` device nodes. The uinput module allows user-space programs to create virtual evdev devices.

### Relevance to Project

On Linux, the virtual pen device will be created via uinput and consumed by applications through evdev. This is the only reliable path for pen/tablet input on Linux.

### Evaluation

| Criterion                  | Assessment                                                        |
|----------------------------|-------------------------------------------------------------------|
| Platform                   | Linux only                                                        |
| Maturity                   | Part of the Linux kernel since 2.6; extremely stable              |
| API simplicity             | ioctl-based for setup, write() for events. Well-documented.       |
| Tablet support             | Full -- ABS_PRESSURE, ABS_TILT, BTN_TOOL_PEN, INPUT_PROP_DIRECT  |
| User-space wrappers        | libevdev (C), python-evdev (Python), evdev crate (Rust)           |
| Latency                    | Sub-millisecond for uinput event injection                        |
| Privilege requirements     | Needs /dev/uinput access (root or udev rule)                     |

### Recommended Wrapper: libevdev

libevdev (maintained by freedesktop.org) wraps raw uinput/evdev ioctl calls with a cleaner, less error-prone API:

```c
#include <libevdev/libevdev.h>
#include <libevdev/libevdev-uinput.h>

struct libevdev *dev = libevdev_new();
libevdev_set_name(dev, "3D Pen Virtual Digitizer");

// Enable capabilities
libevdev_enable_event_type(dev, EV_ABS);
libevdev_enable_event_type(dev, EV_KEY);

struct input_absinfo abs_info = {
    .minimum = 0, .maximum = 32767, .resolution = 100
};
libevdev_enable_event_code(dev, EV_ABS, ABS_X, &abs_info);
libevdev_enable_event_code(dev, EV_ABS, ABS_Y, &abs_info);

struct input_absinfo pressure_info = {
    .minimum = 0, .maximum = 4095
};
libevdev_enable_event_code(dev, EV_ABS, ABS_PRESSURE, &pressure_info);

libevdev_enable_event_code(dev, EV_KEY, BTN_TOOL_PEN, NULL);
libevdev_enable_event_code(dev, EV_KEY, BTN_TOUCH, NULL);

libevdev_enable_property(dev, INPUT_PROP_DIRECT);

// Create virtual device
struct libevdev_uinput *uidev;
libevdev_uinput_create_from_device(dev, LIBEVDEV_UINPUT_OPEN_MANAGED, &uidev);

// Send events
libevdev_uinput_write_event(uidev, EV_ABS, ABS_X, x_value);
libevdev_uinput_write_event(uidev, EV_ABS, ABS_Y, y_value);
libevdev_uinput_write_event(uidev, EV_ABS, ABS_PRESSURE, pressure);
libevdev_uinput_write_event(uidev, EV_KEY, BTN_TOOL_PEN, 1);
libevdev_uinput_write_event(uidev, EV_KEY, BTN_TOUCH, pressure > 0);
libevdev_uinput_write_event(uidev, EV_SYN, SYN_REPORT, 0);
```

### Risks

- Linux only -- different approaches needed for Windows and macOS.
- udev rule distribution must be handled during installation.
- Wayland compositors may have different behavior than X11 for tablet tool events.

### Decision Rationale

**ADOPT:** evdev/uinput is the standard, well-proven mechanism for virtual input devices on Linux. There is no viable alternative. Using the libevdev wrapper is recommended over raw ioctl calls. Rust bindings exist via the `evdev` crate.

**References:**
- libevdev: https://www.freedesktop.org/software/libevdev/doc/latest/group__uinput.html
- Linux kernel uinput docs: https://docs.kernel.org/next/input/uinput.html
- python-evdev: https://python-evdev.readthedocs.io/

---

## 5. Windows Ink API

**Category:** Windows digital ink capture and rendering API
**Verdict:** ASSESS

### What It Is

The Windows.UI.Input.Inking namespace (commonly called "Windows Ink API") provides a complete ink stack: capture, storage, rendering, and recognition of digital ink strokes. It includes the InkCanvas XAML control, InkPresenter for low-level input routing, and wet ink rendering for low-latency visual feedback.

### Relevance to Project

Windows Ink API is relevant in two ways:
1. **As a consumer of our virtual device**: When the 3D Pen's virtual device is correctly configured, Windows Ink apps automatically receive its data. Understanding the API helps us verify correct behavior.
2. **As a framework for a Windows companion app**: If we build a native Windows test/demo application, Windows Ink provides turnkey ink rendering.

### Evaluation

| Criterion                  | Assessment                                                        |
|----------------------------|-------------------------------------------------------------------|
| Platform                   | Windows 10/11 only (UWP/WinUI)                                   |
| Pen pressure support       | First-class; InkPoint.Pressure (0.0 to 1.0)                      |
| Tilt support               | First-class; InkPoint.TiltX/TiltY (degrees)                      |
| Latency                    | Very low (~1 frame) via wet ink rendering                         |
| Bezier curve fitting       | Built-in via InkDrawingAttributes.FitToCurve                     |
| Ink recognition            | Built-in handwriting recognition engine                           |
| Integration with Win32     | Possible via XAML Islands but adds complexity                     |
| Ink serialization          | ISF (Ink Serialized Format) and GIF with embedded ink             |

### Risks

- UWP/WinUI only -- cannot be used in a cross-platform Tauri/Electron app directly.
- Ties the companion app to Windows, while the host software must be cross-platform.
- InkCanvas is a heavy control that may be overkill for a simple test canvas.

### Decision Rationale

**ASSESS:** Windows Ink API is the gold standard for ink on Windows, but it is Windows-only and UWP-specific. It is not suitable as the basis for a cross-platform companion app. However, understanding it is essential for verifying that the virtual device integrates correctly with Windows Ink applications. Worth investigating whether XAML Islands make it practical to embed InkCanvas in a Tauri/Electron window.

**Reference:** https://learn.microsoft.com/en-us/windows/apps/develop/input/pen-and-stylus-interactions

---

## 6. Canvas Rendering Libraries (Paper.js, Fabric.js, Raw Canvas 2D)

**Category:** JavaScript canvas rendering libraries for web-based drawing
**Verdict:** TRIAL (Paper.js) / HOLD (Fabric.js) / ADOPT (Raw Canvas 2D)

### What They Are

JavaScript libraries for rendering 2D graphics on HTML5 Canvas. They differ in abstraction level, performance, and feature set.

### Evaluation

| Criterion            | Paper.js                  | Fabric.js                | Raw Canvas 2D            |
|----------------------|---------------------------|--------------------------|--------------------------|
| **Type**             | Vector graphics framework | Object model + Canvas    | Browser built-in API     |
| **Bezier support**   | Built-in path.simplify()  | Built-in paths           | ctx.bezierCurveTo()      |
| **Pen pressure**     | Via Pointer Events (manual)| Via Pointer Events       | Via Pointer Events       |
| **Performance**      | 16 fps @ 8K objects       | 9 fps @ 8K objects       | Varies (highest ceiling) |
| **Bundle size**      | ~220 KB minified          | ~300 KB minified         | 0 (native)               |
| **Object model**     | Full scene graph          | Full object model + JSON | None (immediate mode)    |
| **Serialization**    | SVG export                | SVG, JSON, Canvas        | Manual                   |
| **Learning curve**   | Moderate                  | Moderate                 | Low                      |
| **Maintenance**      | Active                    | Active                   | Browser-maintained       |

### Decision Rationale

**Raw Canvas 2D (ADOPT):** For the initial test harness, raw Canvas 2D with Pointer Events is the simplest, zero-dependency approach. It provides direct access to `bezierCurveTo()`, full control over pressure-to-width mapping, and no library overhead. This is the right starting point for validating the virtual device output.

```javascript
// Minimal pressure-sensitive drawing with raw Canvas 2D
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.style.touchAction = 'none';

let lastX, lastY;

canvas.addEventListener('pointerdown', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
});

canvas.addEventListener('pointermove', (e) => {
    if (e.buttons > 0) {
        const pressure = e.pressure || 0.5;
        ctx.lineWidth = 1 + pressure * 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);
    }
});
```

**Paper.js (TRIAL):** If we build a more polished demo/companion application, Paper.js provides excellent Bezier path handling and the `path.simplify()` method that converts raw points into smooth curves. It is worth trialing for the demo app while using raw Canvas 2D for the initial test harness.

```javascript
// Paper.js example with pressure-sensitive stroke width
paper.setup('canvas');

var path;
var tool = new paper.Tool();

tool.onMouseDown = function(event) {
    path = new paper.Path();
    path.strokeColor = 'black';
    path.strokeCap = 'round';
    path.add(event.point);
};

tool.onMouseDrag = function(event) {
    // Access pressure via native event
    var pressure = event.event.pressure || 0.5;
    path.strokeWidth = 1 + pressure * 6;
    path.add(event.point);
};

tool.onMouseUp = function(event) {
    // Simplify path to smooth Bezier curves
    path.simplify(10);  // tolerance in pixels
};
```

**Fabric.js (HOLD):** Fabric.js is slower than both Paper.js and raw Canvas 2D in benchmarks. Its strengths (object model, JSON serialization, SVG interop) are not critical for a test/demo canvas. Its performance (9 fps at 8K objects) could cause perceptible lag during continuous drawing. Not recommended for this project.

### Risks (Paper.js)

- 16 fps at 8K objects is adequate for drawing but may struggle with very complex scenes.
- Running inside a Tauri webview adds another layer of potential inconsistency.
- Pen pressure is not natively integrated -- must bridge Pointer Events manually.

**References:**
- Paper.js: http://paperjs.org/
- Fabric.js: http://fabricjs.com/
- Canvas API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Canvas Engines Comparison (benchmarks): https://benchmarks.slaylines.io/

---

## Summary Table

| Tool / Library        | Category              | Verdict     | Primary Use in Project                         |
|-----------------------|-----------------------|-------------|------------------------------------------------|
| HIDAPI                | USB/HID communication | **ADOPT**   | Read sensor data from wireless receiver        |
| Tauri                 | Desktop app framework | **TRIAL**   | Host application GUI and system integration    |
| Electron              | Desktop app framework | **HOLD**    | Too resource-heavy for background service      |
| WebHID API            | Browser HID access    | **ASSESS**  | Potential web-based config/diagnostic tool     |
| evdev/uinput          | Linux virtual input   | **ADOPT**   | Virtual pen device on Linux                    |
| Windows Ink API       | Windows ink rendering | **ASSESS**  | Understanding Windows ink pipeline; companion  |
| Raw Canvas 2D        | Web canvas rendering  | **ADOPT**   | Initial test harness for virtual device output |
| Paper.js              | Web vector graphics   | **TRIAL**   | Polished demo/companion canvas application     |
| Fabric.js             | Web canvas + objects  | **HOLD**    | Insufficient performance for real-time drawing |

## Next Steps

1. **Prototype the wireless receiver communication** using HIDAPI (Rust bindings: `hidapi` crate).
2. **Build a minimal Linux virtual pen device** using libevdev/uinput to validate pen recognition.
3. **Create a raw Canvas 2D test page** with Pointer Events to verify pressure/tilt data flows from the virtual device through the OS to a web application.
4. **Evaluate Tauri v2** for the host application GUI by building a settings panel prototype.
5. **Research Windows VHF driver development** separately (not covered by any library -- requires WDK and KMDF).
