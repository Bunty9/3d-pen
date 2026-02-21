---
title: "OS-Level Pen/Digitizer Input Registration"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - research
  - software
  - input-registration
  - digitizer
  - pen-vs-mouse
  - cross-platform
related:
  - "[[hid-protocol]]"
  - "[[device-drivers]]"
---

# OS-Level Pen/Digitizer Input Registration

## Summary

Making a virtual input device appear as a pen/digitizer (rather than a mouse or touchpad) requires meeting platform-specific criteria at the device registration level. Each OS has distinct mechanisms for classifying input devices, and getting this classification wrong means applications will treat the 3D Pen as a mouse -- losing pressure, tilt, and pen-specific behaviors. This note documents the exact requirements on Windows, macOS, and Linux for proper pen/digitizer recognition, plus cross-platform alternatives like WebHID.

## Context

The 3D Pen project's core user experience depends on applications recognizing the virtual device as a genuine pen/digitizer. This is not merely a labeling issue -- it determines:

- Whether applications receive pressure and tilt data
- Whether pen-specific UI appears (e.g., Windows Ink workspace, palm rejection)
- Whether the cursor uses pen behavior (absolute positioning vs. relative mouse movement)
- Whether drawing applications activate their pen/tablet input code paths

If the OS classifies the device as a mouse, none of the above works correctly, regardless of what data the device reports.

## Key Findings

### 1. Windows: Tablet PC Input Subsystem and Pen Recognition

Windows has the most structured pen/digitizer recognition system, built on the Tablet PC input subsystem that originated in Windows XP Tablet Edition.

#### HID-Based Recognition

Windows identifies a device as a pen based on its HID report descriptor:

**Required top-level collection:**
```
Usage Page: 0x0D (Digitizer)
Usage: 0x02 (Pen) -- for integrated pen
Usage: 0x01 (Digitizer) -- for external digitizer
```

**Mandatory usages within the collection:**
- Tip Switch (0x0D/0x42)
- In Range (0x0D/0x32)
- X (0x01/0x30) -- must be absolute
- Y (0x01/0x31) -- must be absolute

**The critical distinction:** A device with Usage Page 0x0D and Usage 0x02 (Pen) is classified as a pen input device. A device with Usage Page 0x01 and Usage 0x02 (Mouse) is classified as a mouse. The usage page and usage in the top-level collection determine the classification.

#### Windows Pen Input Pipeline

```
HID Device (virtual or physical)
    |
    v
HID Class Driver (hidclass.sys)
    |
    v
Windows Input Stack
    |
    +-- Pointer Input (WM_POINTER messages)
    |     pointerType = PT_PEN
    |     includes: pressure, tilt, rotation
    |
    +-- Legacy Tablet PC (WM_TABLET_* messages)
    |     older applications use this path
    |
    +-- Windows Ink integration
          ink workspace, sticky notes, screen sketch
```

**WM_POINTER message properties for pen:**
```c
// Check if input is from a pen
POINTER_INPUT_TYPE inputType;
GetPointerType(pointerId, &inputType);
if (inputType == PT_PEN) {
    POINTER_PEN_INFO penInfo;
    GetPointerPenInfo(pointerId, &penInfo);

    // Available pen data:
    penInfo.pressure;     // 0 to 1024 (normalized from HID report)
    penInfo.rotation;     // 0 to 359 degrees
    penInfo.tiltX;        // -90 to 90 degrees
    penInfo.tiltY;        // -90 to 90 degrees
    penInfo.penFlags;     // PEN_FLAG_BARREL, PEN_FLAG_INVERTED, etc.
    penInfo.penMask;      // which fields are valid
}
```

#### Physical Range Requirements

Windows uses the physical range declared in the HID descriptor to map pen coordinates to screen coordinates. If the physical range is missing or zero, Windows may misclassify the device or apply incorrect scaling.

```
// MUST be present in descriptor for correct mapping
PHYSICAL_MINIMUM (0)
PHYSICAL_MAXIMUM (actual device width/height in units)
UNIT (inches or centimeters)
UNIT_EXPONENT (scaling factor)
```

### 2. macOS: Tablet Event Classification

macOS distinguishes tablet/pen input from mouse input through event subtypes and proximity events.

#### How macOS Identifies Pen Devices

When a tablet device connects (physically or virtually via IOHIDFamily), it issues proximity events that establish the device type:

```swift
// Proximity event establishes device identity
// NSEvent.EventType.tabletProximity
event.pointingDeviceType  // .pen, .cursor, .eraser
event.isEnteringProximity // true when pen enters range
event.vendorID
event.tabletID
event.deviceID            // unique per-device session identifier
```

**The critical requirement:** A device must issue proximity events with `pointingDeviceType = .pen` before macOS treats subsequent mouse events as tablet events. Without proximity events, the input is treated as regular mouse input.

#### Event Routing

```
IOHIDFamily (kernel)
    |
    v
Window Server (compositing)
    |
    v
NSApplication event dispatch
    |
    +-- Mouse events with subtype .tabletPoint
    |     event.pressure, event.tilt, event.rotation
    |
    +-- Standalone NSEvent.EventType.tabletPoint (rare)
    |
    +-- NSEvent.EventType.tabletProximity
          enters/leaves range notifications
```

**The subtype mechanism:** When a tablet device generates mouse events (mouseDown, mouseDragged, mouseUp), macOS attaches the subtype `NSEventSubtypeTabletPoint`. Applications check for this subtype to access pressure and tilt:

```swift
override func mouseDragged(with event: NSEvent) {
    if event.subtype == .tabletPoint {
        // This is pen input -- access tablet properties
        let pressure = event.pressure        // 0.0 to 1.0
        let tiltX = event.tilt.x             // -1.0 to 1.0
        let tiltY = event.tilt.y             // -1.0 to 1.0
        let rotation = event.rotation        // degrees
    } else {
        // Regular mouse input -- no pressure/tilt available
    }
}
```

#### Virtual Device Challenges on macOS

Creating a virtual device that issues proper proximity and tablet point events on macOS is difficult:

- **IOHIDUserDevice** can create a virtual HID device with digitizer usages, but requires a private entitlement from Apple
- **DriverKit/HIDDriverKit** is the official modern path, but documentation for digitizer-specific implementations is minimal
- **CGEventPost** can inject mouse events with tablet properties attached, but the events may not carry the correct subtype for all applications to recognize
- **OpenTabletDriver's approach** on macOS uses CGEventPost to inject tablet-flagged events, which works for many but not all applications

### 3. Linux: evdev Device Classification

Linux uses the evdev subsystem's capability bits and device properties to classify input devices. The key classification tool is libinput, which determines device type at connection time.

#### Required Capabilities for Pen Recognition

For libinput to classify a device as a tablet:

```c
// Required event types
EV_KEY  -- key/button events
EV_ABS  -- absolute axis events

// Required keys (at least one of these)
BTN_TOOL_PEN      // 0x140 -- pen tool in range
BTN_TOOL_RUBBER   // 0x141 -- eraser tool in range
BTN_TOOL_BRUSH    // 0x142
BTN_TOOL_PENCIL   // 0x143
BTN_TOOL_AIRBRUSH // 0x144

// Required axes
ABS_X             // absolute X position
ABS_Y             // absolute Y position

// Recommended for full functionality
ABS_PRESSURE      // contact pressure
ABS_TILT_X        // tilt angle X
ABS_TILT_Y        // tilt angle Y
BTN_TOUCH         // tip contact
BTN_STYLUS        // barrel button 1
BTN_STYLUS2       // barrel button 2
```

**The most critical bit:** `BTN_TOOL_PEN` is the primary signal that tells libinput this is a tablet, not a mouse. Without it, even if `ABS_PRESSURE` and other tablet-like capabilities are present, the device will be classified as a touchpad or pointing device.

#### INPUT_PROP_DIRECT vs INPUT_PROP_POINTER

Device properties further refine classification:

| Property             | Meaning                                              | Example Devices          |
|----------------------|------------------------------------------------------|--------------------------|
| `INPUT_PROP_DIRECT`  | Touch/pen surface maps directly to screen (1:1)      | Wacom Cintiq, tablet PC  |
| `INPUT_PROP_POINTER` | Touch/pen surface maps indirectly (like a touchpad)  | Wacom Intuos, trackpad   |
| (neither set)        | Default; behavior depends on other capabilities      | Basic USB devices        |

For the 3D Pen, `INPUT_PROP_DIRECT` is appropriate if the pen is meant to map to a specific screen region, while `INPUT_PROP_POINTER` is appropriate if the pen's coordinate space is relative to an arbitrary virtual canvas.

**Setting the property via uinput:**
```c
ioctl(fd, UI_SET_PROPBIT, INPUT_PROP_DIRECT);
// or
ioctl(fd, UI_SET_PROPBIT, INPUT_PROP_POINTER);
```

#### libinput Classification Flow

```
evdev device connects
    |
    v
libinput examines capabilities
    |
    +-- Has BTN_TOOL_PEN and ABS_X/ABS_Y?
    |     -> Classified as TABLET_TOOL
    |     -> pressure, tilt, buttons exposed
    |
    +-- Has ABS_X/ABS_Y + BTN_TOUCH but no BTN_TOOL_*?
    |     -> Classified as TOUCHPAD
    |     -> no pen-specific behavior
    |
    +-- Has REL_X/REL_Y + BTN_LEFT?
          -> Classified as MOUSE
          -> no pressure or tilt
```

#### Wayland vs X11 Differences

- **X11**: Uses xf86-input-evdev or xf86-input-wacom drivers. The evdev driver matches tablets via udev rules at `/usr/share/X11/xorg.conf.d/10-evdev.conf`. Tablet devices get the evdev driver which exposes pressure and tilt to X11 applications.
- **Wayland**: Compositors (Sway, GNOME/Mutter, KDE/KWin) use libinput directly. Tablet tool events are delivered as `wl_tablet_tool` protocol events to Wayland applications.

### 4. WebHID API as a Browser-Based Alternative

The WebHID API allows web applications to communicate directly with HID devices from the browser, bypassing the OS input stack entirely.

**Architecture:**
```
Physical/Virtual HID Device
    |
    v (not through OS input stack)
Browser (Chrome/Edge)
    |
    | navigator.hid.requestDevice()
    v
Web Application (JavaScript)
    | Parse HID reports manually
    v
Canvas rendering
```

**Key API:**
```javascript
// Request access to a HID device
const devices = await navigator.hid.requestDevice({
    filters: [{
        usagePage: 0x0D,    // Digitizer
        usage: 0x02         // Pen
    }]
});

const device = devices[0];
await device.open();

// Receive input reports
device.addEventListener('inputreport', (event) => {
    const { data, reportId } = event;
    // Parse report according to device's report descriptor
    const tipSwitch = data.getUint8(0) & 0x01;
    const x = data.getUint16(1, true);  // little-endian
    const y = data.getUint16(3, true);
    const pressure = data.getUint16(5, true);
});
```

**Applicability for 3D Pen:**
- WebHID is suitable for a **web-based companion app** that talks directly to the 3D Pen's wireless receiver (if it presents as a HID device)
- It is NOT a replacement for the virtual device driver approach, because WebHID only works within the browser -- third-party canvas apps (Photoshop, OneNote) cannot use WebHID
- Browser support: Chrome 89+, Edge 89+, Opera 76+. Not supported in Firefox or Safari.

### 5. Cross-Platform Abstraction Strategies

Given the significant differences across platforms, the host software needs a clean abstraction:

**Option A: Platform-specific virtual device modules**
```
Host App Core
    |
    +-- WindowsPenDevice (VHF/KMDF driver)
    +-- MacOSPenDevice (HIDDriverKit or CGEventPost)
    +-- LinuxPenDevice (uinput via libevdev)
```

Each module implements the same interface but uses platform-native APIs. This is what OpenTabletDriver does.

**Option B: HID-level abstraction with uhid/VHF**
```
Host App Core
    |
    +-- Shared HID Report Descriptor
    +-- WindowsVHF (submits HID reports)
    +-- LinuxUHID (submits HID reports)
    +-- MacOSDriverKit (submits HID reports)
```

Use the same HID report descriptor everywhere. Each platform module submits raw HID report bytes. The OS parses the HID reports natively.

**Option A is recommended** because:
- Linux uinput (evdev-level) is simpler and more reliable than uhid
- macOS may need CGEventPost rather than true virtual HID (entitlement issues)
- The shared interface is at the semantic level (x, y, pressure, tilt), not the byte level

## Relevance to Project

| Constraint / Requirement                         | Impact on 3D Pen                                                          |
|--------------------------------------------------|---------------------------------------------------------------------------|
| Must be classified as pen, not mouse              | Each platform has specific bits/usages that trigger pen classification    |
| Pressure and tilt must be accessible to apps      | Only pen-classified devices expose these properties to applications       |
| Windows is the primary target market              | Windows has the most structured requirements but best documentation      |
| Cross-platform needed for broad appeal            | Three separate implementations required, unified by common interface      |
| No driver installation preferred                  | Linux achievable; Windows and macOS require some form of driver setup    |
| Works with existing apps (Photoshop, etc.)        | Real virtual device needed; API injection (SendInput) is insufficient    |

## Open Questions

1. **macOS entitlement access**: Can we obtain the `com.apple.developer.hid.virtual.device` entitlement from Apple, or must we rely on CGEventPost? Does our product category (hardware accessory) qualify for this entitlement?
2. **Windows driver distribution**: Should the VHF driver be distributed as a standalone installer, bundled with the host app, or installed via Windows Update (hardware partner program)?
3. **Linux INPUT_PROP_DIRECT vs INPUT_PROP_POINTER**: The 3D Pen does not have a fixed physical mapping to the screen. Should it present as DIRECT (like a Cintiq) or POINTER (like an Intuos)? This affects cursor behavior.
4. **Fallback mode**: If the virtual device driver is not available (e.g., user denied installation), should the host software fall back to mouse emulation with SendInput/CGEventPost? This would lose pressure and tilt.
5. **WebHID for configuration**: Could the wireless receiver itself be accessed via WebHID for firmware updates and configuration, even though the main input path uses the virtual device driver?

## Recommendations

1. **On Windows, use the HID Pen usage (0x0D/0x02) in the VHF driver's report descriptor.** This is the single most important requirement for Windows pen recognition. Verify with the `POINTER_INPUT_TYPE` check (`PT_PEN`).
2. **On Linux, ensure `BTN_TOOL_PEN` is set** in the uinput device capabilities. This is the gating criterion for libinput tablet classification. Set `INPUT_PROP_POINTER` unless mapping to a specific screen.
3. **On macOS, prototype with CGEventPost** first, then evaluate whether pursuing HIDDriverKit or the IOHIDUserDevice entitlement is feasible for production.
4. **Build a platform-specific test harness** on each OS that creates the virtual device, sends known test data, and verifies that a test application receives the data with correct type classification (pen, not mouse).
5. **Test with real applications** (Photoshop, Krita, OneNote, GIMP, Procreate-alternatives) on each platform early. Different applications may use different APIs to detect pen input.
6. **Investigate the Windows Hardware Partner program** for pre-installing the VHF driver via Windows Update, which would eliminate the need for a separate driver installer.

## References

1. Microsoft Learn -- Pen Protocol Implementation: https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/pen-protocol-implementation
2. Microsoft Learn -- Pen Input, Ink, and Recognition (Win32 Tablet PC): https://learn.microsoft.com/en-us/windows/win32/tablet/pen-input--ink--and-recognition
3. Apple Developer -- Handling Tablet Events: https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/HandlingTabletEvents/HandlingTabletEvents.html
4. Apple Developer -- HIDDriverKit Digitizer Usage: https://developer.apple.com/documentation/hiddriverkit/3201484-digitizer
5. libinput Tablet Support Documentation: https://wayland.freedesktop.org/libinput/doc/latest/tablet-support.html
6. Arch Linux Wiki -- Graphics Tablet: https://wiki.archlinux.org/title/Graphics_tablet
7. DIGImend Project (tablet driver support): https://digimend.github.io/
8. MDN -- WebHID API: https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
9. WebHID Specification: https://wicg.github.io/webhid/
10. OpenTabletDriver (cross-platform reference): https://github.com/OpenTabletDriver/OpenTabletDriver
