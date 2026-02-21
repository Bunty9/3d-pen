---
title: "Virtual Pen/Digitizer Device Drivers Across Platforms"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - research
  - software
  - drivers
  - virtual-hid
  - windows
  - macos
  - linux
related:
  - "[[hid-protocol]]"
  - "[[os-input-registration]]"
---

# Virtual Pen/Digitizer Device Drivers Across Platforms

## Summary

To make the 3D Pen appear as a native digitizer/pen input device, the host software must create a virtual input device at the OS level. Each platform provides different mechanisms for this, ranging from kernel-mode drivers (Windows VHF) to user-space device nodes (Linux uhid/uinput). This note surveys the available approaches on Windows, macOS, and Linux, evaluating complexity, maturity, user-mode vs kernel-mode tradeoffs, and existing open-source implementations that can serve as reference or starting points.

## Context

The 3D Pen host software receives sensor data wirelessly, passes it through an ML inference pipeline, and produces (x, y, pressure, tilt) coordinates. These must be injected into the OS input stack such that the OS sees a pen/digitizer device (not a mouse). The virtual device driver is the bridge between the host application and the OS input subsystem. The choice of driver technology on each platform significantly impacts:

- Installation complexity (does the user need to install a kernel driver?)
- Security (does the driver need elevated privileges?)
- Latency (kernel-mode vs user-mode overhead)
- Maintenance burden (driver signing, OS update compatibility)

## Key Findings

### 1. Windows: Virtual HID Framework (VHF) and Alternatives

Windows provides several mechanisms for creating virtual HID devices, with VHF being the most modern and recommended approach.

#### Virtual HID Framework (VHF)

VHF is a Microsoft-provided framework specifically designed for virtual HID source drivers. It is **KMDF-only** (Kernel-Mode Driver Framework) -- it does not support UMDF (User-Mode Driver Framework).

**Architecture:**
```
User-mode app (3D Pen host)
    |
    | (IOCTL / shared memory)
    v
KMDF Driver (VHF source driver)
    |
    | VhfCreate() / VhfReadReportSubmit()
    v
VHF Framework (Vhf.sys)
    |
    v
HID Class Driver (hidclass.sys)
    |
    v
OS Input Stack (pen/digitizer recognized)
```

**Key API functions:**

```c
// Initialize VHF configuration
VHF_CONFIG vhfConfig;
VHF_CONFIG_INIT(&vhfConfig,
    WdfDeviceWdmGetDeviceObject(device),
    reportDescriptorLength,
    reportDescriptor);

// Create virtual HID device
NTSTATUS status = VhfCreate(&vhfConfig, &vhfHandle);

// Submit an input report (pen data)
HID_XFER_PACKET packet;
packet.reportBuffer = reportBuffer;
packet.reportBufferLen = sizeof(reportBuffer);
packet.reportId = 1;
status = VhfReadReportSubmit(vhfHandle, &packet);
```

**Drawbacks:** Requires KMDF driver development, kernel-mode code signing (EV certificate for production, or test signing mode for development), and the Windows Driver Kit (WDK) toolchain.

#### HID Minidriver (vhidmini2)

Microsoft provides the `vhidmini2` sample driver, which can be built with either KMDF or UMDF 2.x. The UMDF version runs in user-mode under `MsHidUmdf.sys`, which is less risky than full kernel-mode but still requires driver installation.

```
// UMDF approach
User-mode app
    |
    v
UMDF 2 HID Minidriver (vhidmini2)
    |
    v
MsHidUmdf.sys (Microsoft-provided)
    |
    v
HID Class Driver
```

**Reference:** https://github.com/microsoft/Windows-driver-samples/tree/main/hid/vhidmini2

#### ViGEm (Virtual Gamepad Emulation Framework)

ViGEm is an open-source project focused on virtual gamepad emulation, but its architecture provides useful patterns for virtual HID device creation. It consists of a signed kernel driver (`ViGEmBus`) and user-mode client libraries. However, ViGEm is gamepad-specific and would need significant modification for pen digitizer use.

**Reference:** https://github.com/nefarius/ViGEmBus

#### Summary for Windows

| Approach         | Mode    | Complexity | Signing Required | Pen Support |
|------------------|---------|------------|------------------|-------------|
| VHF (KMDF)       | Kernel  | High       | Yes (EV cert)    | Native      |
| vhidmini2 (UMDF) | User*   | Medium     | Yes              | Native      |
| ViGEm            | Kernel  | Medium     | Pre-signed       | Needs fork  |

*UMDF still requires driver package installation but code runs in user-mode process.

### 2. macOS: DriverKit, IOKit, and Alternatives

macOS has undergone significant changes in its driver model. Starting with macOS 10.15 (Catalina), Apple deprecated kernel extensions (kexts) in favor of DriverKit, which runs drivers in user space.

#### HIDDriverKit (Modern, Recommended)

HIDDriverKit is Apple's framework for developing HID device drivers, including digitizers. It runs entirely in user space as a Driver Extension (dext).

**Architecture:**
```
User-mode app (3D Pen host)
    |
    | (XPC / IPC)
    v
DriverKit Driver Extension (.dext)
    |
    | HIDDriverKit framework
    v
IOHIDFamily (kernel framework)
    |
    v
macOS Input Stack (pen/digitizer recognized)
```

**Key aspects:**
- Runs in user space -- no kernel panics from driver bugs
- Requires Apple Developer account and notarization for distribution
- Can create virtual HID devices that are recognized as hardware
- Karabiner-DriverKit-VirtualHIDDevice is a working open-source example: https://github.com/pqrs-org/Karabiner-DriverKit-VirtualHIDDevice

**Drawbacks:** Documentation is sparse. The Digitizer usage in HIDDriverKit exists (Apple documents it at Usage 0x0D) but examples specifically for pen digitizers are rare.

#### IOHIDUserDevice (Legacy but Functional)

Before DriverKit, `IOHIDUserDevice` allowed creation of virtual HID devices from user space via IOKit. It is still functional on current macOS but Apple has signaled it may be deprecated.

```objectivec
// Create virtual HID device properties
NSDictionary *properties = @{
    @"ReportDescriptor": reportDescriptorData,
    @"VendorID": @(0x1234),
    @"ProductID": @(0x5678),
    @"Transport": @"Virtual"
};

// Create device
IOHIDUserDeviceRef device = IOHIDUserDeviceCreate(
    kCFAllocatorDefault, (__bridge CFDictionaryRef)properties);

// Schedule with run loop and handle reports
IOHIDUserDeviceScheduleWithRunLoop(device,
    CFRunLoopGetCurrent(), kCFRunLoopDefaultMode);
```

**Drawback:** Requires `com.apple.developer.hid.virtual.device` entitlement from Apple (not freely available).

#### foohid (Deprecated, Insecure)

foohid was a popular open-source IOKit kext for creating virtual HID devices. It is now deprecated, unsupported, and has known thread-safety issues. It will not load on modern macOS with SIP enabled.

**Reference:** https://github.com/unbit/foohid

#### Summary for macOS

| Approach            | Mode     | Complexity | Apple Account | Pen Support  |
|---------------------|----------|------------|---------------|--------------|
| HIDDriverKit (dext) | User     | High       | Yes           | Native       |
| IOHIDUserDevice     | User     | Medium     | Entitlement   | Native       |
| foohid (kext)       | Kernel   | Low        | No            | Deprecated   |

### 3. Linux: uhid, uinput, and evdev

Linux provides the most accessible user-space APIs for virtual input device creation. Two main approaches exist: uhid (HID-level) and uinput (evdev-level).

#### uhid (/dev/uhid) -- HID-Level Virtual Device

uhid allows user-space programs to create kernel HID devices by writing to `/dev/uhid`. The user-space program provides a HID report descriptor and then sends raw HID reports. The kernel's HID subsystem parses these reports and creates the corresponding evdev nodes.

**Architecture:**
```
User-mode app (3D Pen host)
    |
    | write() to /dev/uhid
    v
uhid kernel module
    |
    | HID report parsing
    v
hid-generic driver
    |
    v
evdev subsystem (/dev/input/eventN)
    |
    v
libinput / X11 / Wayland compositor
```

**Example (C):**
```c
#include <linux/uhid.h>
#include <fcntl.h>

int fd = open("/dev/uhid", O_RDWR);

// Create device
struct uhid_event ev = {0};
ev.type = UHID_CREATE2;
strcpy((char*)ev.u.create2.name, "3D Pen Virtual Digitizer");
ev.u.create2.rd_size = sizeof(report_descriptor);
memcpy(ev.u.create2.rd_data, report_descriptor, sizeof(report_descriptor));
ev.u.create2.bus = BUS_VIRTUAL;
ev.u.create2.vendor = 0x1234;
ev.u.create2.product = 0x5678;
write(fd, &ev, sizeof(ev));

// Send input report
struct uhid_event input = {0};
input.type = UHID_INPUT2;
input.u.input2.size = report_size;
memcpy(input.u.input2.data, report_data, report_size);
write(fd, &input, sizeof(input));
```

**Advantages:** Uses standard HID report descriptors (same as Windows/macOS), kernel handles HID parsing, proper device classification.
**Drawbacks:** Requires read/write access to `/dev/uhid` (typically root or udev rule).

#### uinput (/dev/uinput) -- evdev-Level Virtual Device

uinput bypasses HID entirely and creates virtual evdev devices directly. The user-space program defines capabilities (event types, axis ranges) and emits evdev events.

**Example (C):**
```c
#include <linux/uinput.h>
#include <fcntl.h>

int fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);

// Enable event types
ioctl(fd, UI_SET_EVBIT, EV_KEY);
ioctl(fd, UI_SET_EVBIT, EV_ABS);
ioctl(fd, UI_SET_KEYBIT, BTN_TOOL_PEN);
ioctl(fd, UI_SET_KEYBIT, BTN_TOUCH);
ioctl(fd, UI_SET_KEYBIT, BTN_STYLUS);

// Configure absolute axes
struct uinput_abs_setup abs_x = {
    .code = ABS_X,
    .absinfo = { .minimum = 0, .maximum = 32767,
                 .resolution = 100 }  // units per mm
};
ioctl(fd, UI_ABS_SETUP, &abs_x);

struct uinput_abs_setup abs_y = {
    .code = ABS_Y,
    .absinfo = { .minimum = 0, .maximum = 32767,
                 .resolution = 100 }
};
ioctl(fd, UI_ABS_SETUP, &abs_y);

struct uinput_abs_setup abs_pressure = {
    .code = ABS_PRESSURE,
    .absinfo = { .minimum = 0, .maximum = 4095 }
};
ioctl(fd, UI_ABS_SETUP, &abs_pressure);

struct uinput_abs_setup abs_tilt_x = {
    .code = ABS_TILT_X,
    .absinfo = { .minimum = -90, .maximum = 90 }
};
ioctl(fd, UI_ABS_SETUP, &abs_tilt_x);

struct uinput_abs_setup abs_tilt_y = {
    .code = ABS_TILT_Y,
    .absinfo = { .minimum = -90, .maximum = 90 }
};
ioctl(fd, UI_ABS_SETUP, &abs_tilt_y);

// Set device properties
ioctl(fd, UI_SET_PROPBIT, INPUT_PROP_DIRECT);  // Direct input (like tablet)

// Create the device
struct uinput_setup setup = {
    .id = { .bustype = BUS_VIRTUAL,
             .vendor = 0x1234,
             .product = 0x5678 },
    .name = "3D Pen Virtual Digitizer"
};
ioctl(fd, UI_DEV_SETUP, &setup);
ioctl(fd, UI_DEV_CREATE);

// Emit events
struct input_event events[] = {
    { .type = EV_ABS, .code = ABS_X, .value = x },
    { .type = EV_ABS, .code = ABS_Y, .value = y },
    { .type = EV_ABS, .code = ABS_PRESSURE, .value = pressure },
    { .type = EV_ABS, .code = ABS_TILT_X, .value = tilt_x },
    { .type = EV_ABS, .code = ABS_TILT_Y, .value = tilt_y },
    { .type = EV_KEY, .code = BTN_TOUCH, .value = (pressure > 0) },
    { .type = EV_KEY, .code = BTN_TOOL_PEN, .value = in_range },
    { .type = EV_SYN, .code = SYN_REPORT, .value = 0 },
};
write(fd, events, sizeof(events));
```

**Key configuration for pen recognition:**
- `BTN_TOOL_PEN` -- tells libinput/X11 this is a pen, not a mouse
- `INPUT_PROP_DIRECT` -- direct-input device (absolute coordinates map to screen)
- `ABS_PRESSURE` -- enables pressure sensitivity
- `ABS_TILT_X` / `ABS_TILT_Y` -- enables tilt data

**Advantages:** Simpler API, no HID descriptor needed, well-documented, widely used by tablet driver projects.
**Drawbacks:** Linux-only, bypasses HID layer (no shared descriptor with Windows/macOS).

#### libevdev (Higher-Level Wrapper)

libevdev is a library maintained by freedesktop.org that wraps uinput with a cleaner API. It is recommended over raw uinput ioctl calls for new projects.

**Reference:** https://www.freedesktop.org/software/libevdev/doc/latest/group__uinput.html

#### Summary for Linux

| Approach     | Level  | Complexity | HID Descriptor | Pen Recognition |
|--------------|--------|------------|----------------|-----------------|
| uhid         | HID    | Medium     | Required       | Via HID parsing |
| uinput       | evdev  | Low        | Not needed     | Via capabilities|
| libevdev     | evdev  | Low        | Not needed     | Via capabilities|

### 4. Cross-Platform Reference: OpenTabletDriver

OpenTabletDriver is the most relevant open-source reference implementation. It is a cross-platform, user-mode tablet driver supporting 800+ devices.

**Architecture:**
```
Physical tablet (USB/Bluetooth)
    |
    v
OpenTabletDriver.Daemon (background process)
    |  - Reads raw HID reports via hidapi
    |  - Applies filters, smoothing, mapping
    |
    +-- Windows: Uses vmulti driver (virtual HID minidriver)
    +-- macOS:   Uses CGEventPost (Core Graphics event injection)
    +-- Linux:   Uses evdev/uinput virtual device
    |
    v
OS Input Stack
```

**Key design decisions from OpenTabletDriver:**
- Two-process architecture: daemon (hardware I/O) + GUI (configuration)
- Communication via JSON-RPC over named pipes
- Platform-specific output modules abstracted behind a common interface
- On macOS, they use Core Graphics event injection (`CGEventPost`) rather than IOHIDUserDevice because the entitlement requirement makes virtual HID devices impractical for open-source distribution.

**Limitation on macOS:** CGEventPost can inject mouse events with tablet properties but this is fragile and not all applications recognize the events as true pen input.

**Reference:** https://github.com/OpenTabletDriver/OpenTabletDriver

### 5. Privilege and Installation Requirements

| Platform | Approach              | Privileges Needed                          | Installation Complexity |
|----------|-----------------------|--------------------------------------------|-------------------------|
| Windows  | VHF/vhidmini2        | Admin install, driver signing              | High (driver package)   |
| macOS    | HIDDriverKit          | Developer account, notarization            | High (system extension)  |
| macOS    | CGEventPost           | Accessibility permission                   | Low (app permission)    |
| Linux    | uinput                | Root or udev rule (`MODE="0666"`)          | Low (udev rule)         |
| Linux    | uhid                  | Root or udev rule                          | Low (udev rule)         |

## Relevance to Project

| Constraint / Requirement                     | Impact on 3D Pen                                                              |
|----------------------------------------------|-------------------------------------------------------------------------------|
| Must work without manual driver installation | Favor user-mode approaches; consider bundled signed driver for Windows        |
| Must be recognized as pen, not mouse         | Each platform has specific requirements (see os-input-registration note)      |
| Cross-platform consistency                   | Need platform abstraction layer in host software                              |
| Latency must be minimal                      | Kernel-mode (VHF) is fastest on Windows; uinput is fast on Linux              |
| Open-source distribution                     | macOS entitlements and Windows driver signing complicate open-source releases  |
| ML inference runs at variable rate           | Virtual device must accept reports at any rate without buffering issues        |

## Open Questions

1. **macOS strategy**: Should we pursue HIDDriverKit (complex, proper pen recognition) or CGEventPost (simpler, incomplete pen recognition)? OpenTabletDriver chose CGEventPost due to entitlement barriers.
2. **Windows driver signing**: For initial development, test signing mode is acceptable. For production, do we need an EV code signing certificate (~$300-500/year)?
3. **Linux uinput vs uhid**: Using uinput is simpler and more common for tablet drivers. Is there a benefit to using uhid (shared HID descriptor) that justifies the added complexity?
4. **Bundled driver installer**: Should the host application include an automated driver installer for Windows, or require manual installation?
5. **Report rate synchronization**: The virtual device receives reports from ML inference. Should it use a fixed-rate timer (e.g., 200 Hz) or submit reports as they arrive from the inference pipeline?

## Recommendations

1. **Start with Linux (uinput)** for initial development. It has the lowest barrier to entry, best documentation, and fastest iteration cycle. Use libevdev as the wrapper library.
2. **Use OpenTabletDriver as reference architecture** for the platform abstraction layer. Its daemon/GUI split and platform-specific output modules are directly applicable.
3. **For Windows, plan for a KMDF VHF driver** from the beginning. The vhidmini2 sample provides a solid starting point. Budget for an EV code signing certificate for production.
4. **For macOS, initially use CGEventPost** for rapid prototyping, then investigate HIDDriverKit for production. The Karabiner-DriverKit-VirtualHIDDevice project provides patterns for DriverKit virtual devices.
5. **Abstract the virtual device layer** behind a platform trait/interface early:

```rust
// Pseudocode for platform abstraction
trait VirtualPenDevice {
    fn create(config: PenDeviceConfig) -> Result<Self>;
    fn send_report(report: PenReport) -> Result<()>;
    fn destroy(&mut self) -> Result<()>;
}

struct PenReport {
    x: u16,
    y: u16,
    pressure: u16,
    tilt_x: i16,
    tilt_y: i16,
    tip_switch: bool,
    in_range: bool,
    barrel_switch: bool,
    eraser: bool,
}
```

## References

1. Microsoft Learn -- Write a HID Source Driver Using VHF: https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/virtual-hid-framework--vhf-
2. Microsoft Windows Driver Samples -- vhidmini2: https://github.com/microsoft/Windows-driver-samples/tree/main/hid/vhidmini2
3. Apple Developer -- HIDDriverKit: https://developer.apple.com/documentation/hiddriverkit
4. Karabiner-DriverKit-VirtualHIDDevice: https://github.com/pqrs-org/Karabiner-DriverKit-VirtualHIDDevice
5. Linux Kernel Documentation -- uhid: https://docs.kernel.org/hid/uhid.html
6. Linux Kernel Documentation -- uinput: https://docs.kernel.org/next/input/uinput.html
7. libevdev uinput device creation: https://www.freedesktop.org/software/libevdev/doc/latest/group__uinput.html
8. OpenTabletDriver: https://github.com/OpenTabletDriver/OpenTabletDriver
