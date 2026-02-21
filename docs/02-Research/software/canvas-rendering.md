---
title: "Digital Ink Rendering and Pressure-Sensitive Canvas Input"
domain: "software"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "software-agent"
tags:
  - research
  - software
  - canvas
  - rendering
  - pressure
  - bezier
  - ink
related:
  - "[[hid-protocol]]"
  - "[[os-input-registration]]"
---

# Digital Ink Rendering and Pressure-Sensitive Canvas Input

## Summary

This note covers the rendering side of digital ink: how pen pressure and tilt data reach canvas applications, platform-specific ink APIs, and algorithms for converting discrete sampled points into smooth, visually appealing strokes. While the primary goal of the 3D Pen project is to register as an OS-level input device (so any canvas app can use it), understanding the rendering pipeline is important for two reasons: (1) we may build a companion demo/test application, and (2) understanding what canvas apps expect from pen input informs how we shape our virtual device output.

## Context

The 3D Pen host software produces (x, y, pressure, tilt) at the output of the ML inference pipeline. These values are injected into the OS input stack via a virtual digitizer device. Canvas applications then receive these values through platform-specific APIs and use them to render strokes. The rendering pipeline typically involves: receiving raw input events, applying pressure-to-width/opacity mapping, fitting curves through discrete sample points, and rasterizing the result.

## Key Findings

### 1. Platform-Specific Pen Input APIs

#### Windows Ink API (Windows.UI.Input.Inking)

The Windows Ink platform provides a comprehensive API for capturing, managing, and rendering digital ink.

**Key classes and properties:**

```csharp
// InkCanvas -- XAML control that handles ink rendering
<InkCanvas x:Name="inkCanvas" />

// InkPoint -- represents a single point with pressure
// Pressure: float (0.0 to 1.0)
// TiltX: float (degrees)
// TiltY: float (degrees)
var point = new InkPoint(
    new Point(x, y),
    pressure,    // 0.0f to 1.0f
    tiltX,       // degrees
    tiltY,       // degrees
    timestamp    // uint64, 100ns intervals
);

// InkDrawingAttributes -- controls stroke appearance
var attrs = new InkDrawingAttributes();
attrs.Size = new Size(4, 4);           // Base pen size
attrs.Color = Colors.Black;
attrs.FitToCurve = true;               // Enable Bezier smoothing
attrs.IgnorePressure = false;          // Use pressure data
attrs.IgnoreTilt = false;              // Use tilt data
attrs.PenTip = PenTipShape.Circle;     // Tip shape
```

**Windows Ink features:**
- Built-in wet ink rendering (immediate visual feedback, <15ms latency)
- Automatic Bezier curve fitting via `FitToCurve`
- Pressure and tilt support are first-class
- InkPresenter provides low-level control over input routing
- Win2D integration for hardware-accelerated rendering

**Limitation:** Windows Ink API is UWP/WinUI only. Desktop Win32 apps use the older Tablet PC API (`Microsoft.Ink`) or must host a UWP InkCanvas via XAML Islands.

#### macOS NSEvent Tablet Events

macOS delivers pen input through the standard NSEvent system with tablet-specific subtypes and properties.

**Event types for pen input:**
- `NSEventTypeTabletPoint` -- native tablet point event (rarely used directly)
- `NSEventTypeLeftMouseDown/Dragged/Up` with subtype `NSEventSubtypeTabletPoint` -- most common delivery mechanism

**Key properties:**

```swift
// Detecting pen input (vs mouse)
if event.subtype == .tabletPoint || event.subtype == .tabletProximity {
    // This is pen/tablet input

    let pressure = event.pressure         // Float: 0.0 to 1.0
    let tiltX = event.tilt.x              // Float: -1.0 to 1.0
    let tiltY = event.tilt.y              // Float: -1.0 to 1.0
    let rotation = event.rotation         // Float: degrees
    let tangentialPressure = event.tangentialPressure  // Float: -1.0 to 1.0

    // Tablet-specific identification
    let deviceID = event.deviceID         // Unique tablet device ID
    let pointingDeviceType = event.pointingDeviceType  // pen, cursor, eraser
}
```

**Key behavior:**
- Tablet pointer events are almost always delivered as subtypes of mouse events, not as standalone tablet events
- Pressure of 0.0 indicates hover (pen in range but not touching)
- The `pointingDeviceType` property distinguishes pen from eraser
- Proximity events (`NSEventSubtypeTabletProximity`) signal when the pen enters or leaves the tablet's detection range

#### Linux evdev and libinput

On Linux, pen events arrive through the evdev subsystem and are consumed by either X11 (via xf86-input-evdev or xf86-input-wacom) or Wayland compositors (via libinput).

**Event codes for pen tablets:**

```
EV_ABS ABS_X          -- X coordinate (absolute)
EV_ABS ABS_Y          -- Y coordinate (absolute)
EV_ABS ABS_PRESSURE   -- Contact pressure (0 to max)
EV_ABS ABS_TILT_X     -- Tilt in X axis (degrees)
EV_ABS ABS_TILT_Y     -- Tilt in Y axis (degrees)
EV_KEY BTN_TOOL_PEN   -- Pen is in range
EV_KEY BTN_TOUCH      -- Pen is touching surface
EV_KEY BTN_STYLUS     -- Barrel button 1
EV_KEY BTN_STYLUS2    -- Barrel button 2
EV_SYN SYN_REPORT     -- End of event frame
```

**Application-level access:**
- GTK: `GdkDevice` with `GDK_SOURCE_PEN`, access pressure via `gdk_event_get_axis(event, GDK_AXIS_PRESSURE, &pressure)`
- Qt: `QTabletEvent` with `pressure()`, `xTilt()`, `yTilt()`, `pointerType()`
- libinput directly: `libinput_event_tablet_tool_get_pressure()`

### 2. HTML5 Pointer Events and Web Canvas

The W3C Pointer Events specification provides cross-platform, device-agnostic input handling in browsers, with explicit support for pen pressure and tilt.

**PointerEvent properties for pen input:**

```javascript
canvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'pen') {
        const x = event.clientX;
        const y = event.clientY;
        const pressure = event.pressure;      // 0.0 to 1.0
        const tiltX = event.tiltX;            // -90 to 90 degrees
        const tiltY = event.tiltY;            // -90 to 90 degrees
        const twist = event.twist;            // 0 to 359 degrees
        const width = event.width;            // Contact width
        const height = event.height;          // Contact height

        // Render stroke with pressure-dependent width
        const strokeWidth = minWidth + (maxWidth - minWidth) * pressure;
        ctx.lineWidth = strokeWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});

// Prevent default to avoid browser gestures
canvas.style.touchAction = 'none';
canvas.addEventListener('pointerdown', (e) => e.preventDefault());
```

**Browser support for Pointer Events with pressure:**
- Chrome/Edge: Full support since Chrome 55
- Firefox: Full support since Firefox 59
- Safari: Full support since Safari 13

**Important detail:** The `pressure` property returns 0.5 for mouse input when a button is pressed (not 0.0), and 0.0 when no button is pressed. Only pen-type pointers provide true variable pressure between 0.0 and 1.0.

### 3. Pressure Curve Mapping

Raw pressure from the sensor (or ML model) rarely maps linearly to ideal brush behavior. A pressure curve (transfer function) transforms raw pressure into the value used for rendering.

**Common pressure curve types:**

```
// Linear (identity)
output = input

// Power/Gamma curve
output = input^gamma    // gamma < 1: softer feel, gamma > 1: harder feel

// S-curve (sigmoid)
output = 1 / (1 + exp(-k * (input - 0.5)))  // k controls steepness

// Piecewise linear (Wacom-style)
// Define control points and interpolate:
// (0,0) -> (0.2, 0.05) -> (0.5, 0.4) -> (0.8, 0.9) -> (1.0, 1.0)
```

**Pressure-to-visual mapping:**
- **Line width**: `width = minWidth + (maxWidth - minWidth) * curve(pressure)`
- **Opacity**: `opacity = minOpacity + (maxOpacity - minOpacity) * curve(pressure)`
- **Combined**: Many brushes vary both width and opacity simultaneously

**For the 3D Pen:** The ML model should output raw (linear) pressure values. The pressure curve should be applied at the rendering layer (either by the canvas application or by a configurable mapping in the host software before injecting into the virtual device).

### 4. Bezier Curve Fitting for Smooth Strokes

Discrete sample points from the input device (typically at 60-266 Hz) must be connected into smooth curves. Direct line-segment rendering produces jagged strokes, especially at low sample rates or during fast movement.

#### Catmull-Rom to Bezier Conversion

A common approach is to treat input points as a Catmull-Rom spline and convert each segment to a cubic Bezier for rendering:

```javascript
// Convert Catmull-Rom control points to cubic Bezier
function catmullRomToBezier(p0, p1, p2, p3, alpha = 0.5) {
    const d1 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
    const d2 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const d3 = Math.sqrt(Math.pow(p3.x - p2.x, 2) + Math.pow(p3.y - p2.y, 2));

    // Compute Bezier control points
    const b1 = {
        x: p1.x + (p2.x - p0.x) / (6 * Math.pow(d1, alpha)),
        y: p1.y + (p2.y - p0.y) / (6 * Math.pow(d1, alpha))
    };
    const b2 = {
        x: p2.x - (p3.x - p1.x) / (6 * Math.pow(d2, alpha)),
        y: p2.y - (p3.y - p1.y) / (6 * Math.pow(d2, alpha))
    };

    return { start: p1, cp1: b1, cp2: b2, end: p2 };
}
```

#### Least-Squares Bezier Fitting (Philip Schneider Algorithm)

For fitting a cubic Bezier to an arbitrary set of points, the classic algorithm by Philip Schneider (from "Graphics Gems") uses iterative Newton-Raphson refinement:

1. Parameterize points by chord length along the path
2. Compute initial Bezier control points via least-squares
3. Iteratively reparameterize and refit until error is below threshold
4. If error exceeds threshold, split the curve and fit recursively

This algorithm is used by libraries like Paper.js (`path.simplify()`) and Inkscape.

#### Raph Levien's Fitting Approach

Raph Levien (author of the Kurbo/Peniko Rust libraries for 2D graphics) has published research on Bezier fitting that uses Euler spiral segments as an intermediate representation, achieving better accuracy than direct Bezier fitting for pen strokes. This is relevant if the host software performs stroke smoothing before injection.

**Reference:** https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html

### 5. Canvas Rendering Libraries

| Library    | Type          | Pen Pressure | Bezier Curves | Performance     | Use Case                    |
|------------|---------------|--------------|---------------|-----------------|------------------------------|
| Paper.js   | Vector/Canvas | Via events   | Built-in      | 16 fps @ 8K     | Vector graphics, path editing|
| Fabric.js  | Canvas/SVG    | Via events   | Built-in      | 9 fps @ 8K      | Object model, serialization  |
| PixiJS     | WebGL/Canvas  | Manual       | Manual        | 60 fps @ 8K     | High-performance rendering   |
| Raw Canvas 2D | Canvas     | Via events   | `bezierCurveTo` | Varies        | Full control, no overhead    |
| Atrament   | Canvas        | Built-in     | Built-in      | Good            | Handwriting/drawing specific |

**Paper.js** provides a complete vector graphics scripting framework with built-in path simplification (`path.simplify(tolerance)`) that converts point sequences into smooth Bezier paths. It is well-suited for a demo/test application.

**Fabric.js** adds an object model on top of Canvas, enabling serialization to SVG/JSON. Its `freeDrawingBrush` supports pressure-sensitive width when combined with Pointer Events.

**PixiJS** is a WebGL-first renderer optimized for performance. It does not natively handle pen input or Bezier strokes, but its rendering speed is unmatched. Suitable if building a custom stroke engine.

**Raw Canvas 2D** with `ctx.bezierCurveTo()` and manual pressure handling gives maximum control and zero library overhead. This is what most custom drawing apps use internally.

### 6. Latency Considerations in Ink Rendering

End-to-end latency from pen movement to pixels on screen is critical for a natural writing/drawing experience:

| Stage                        | Typical Latency | Notes                                    |
|------------------------------|-----------------|------------------------------------------|
| Sensor sampling              | 0.125 ms        | At 8 kHz sampling rate                   |
| Wireless transmission        | 1-2 ms          | Low-latency 2.4 GHz protocol             |
| ML inference                 | 2-10 ms         | Depends on model size, GPU availability  |
| Virtual device injection     | <0.1 ms         | Memory write                              |
| OS input processing          | 1-3 ms          | HID parsing, input dispatch              |
| Application rendering        | 4-16 ms         | Frame-rate dependent (60-240 Hz display) |
| Display scanout              | 2-8 ms          | Display response time                    |
| **Total (estimated)**        | **10-40 ms**    | Target: <20ms for pen-on-paper feel      |

Microsoft's research indicates that latency below 20ms is perceived as near-instantaneous for inking. Windows Ink achieves this with "wet ink" rendering that bypasses the normal composition pipeline. For the 3D Pen, the ML inference step is the largest contributor to latency.

## Relevance to Project

| Constraint / Requirement                   | Impact on 3D Pen                                                               |
|--------------------------------------------|--------------------------------------------------------------------------------|
| Pressure must reach canvas apps            | Virtual device must report pressure in HID descriptor; verified per platform   |
| Tilt data enriches drawing experience      | Dual-IMU tilt estimation should be reported via X/Y Tilt usages               |
| Stroke smoothness depends on report rate   | Target 200+ Hz report rate to virtual device for smooth Bezier interpolation   |
| Pressure curve is personal preference      | Host software should provide configurable pressure curve before HID injection  |
| Demo app needed for testing                | Use Paper.js or raw Canvas 2D + Pointer Events for a cross-platform test app  |
| End-to-end latency budget is tight         | ML inference must stay under 10ms to hit <20ms total latency target            |

## Open Questions

1. **Where should pressure curve mapping live?** In the host software (before virtual device injection), in a system-level driver setting, or left entirely to canvas applications?
2. **Should we build a companion canvas app?** A lightweight web-based test app using Pointer Events would help validate the virtual device output without depending on third-party apps.
3. **Stroke prediction**: Some platforms (Apple Pencil, Windows Ink) use prediction algorithms to render strokes ahead of actual input. Should the host software implement prediction, or leave this to canvas applications?
4. **Variable-width stroke rendering**: Standard Canvas 2D `lineWidth` is constant per path segment. Rendering variable-width strokes (pressure-dependent) requires either stamping circles along the path or using a custom mesh/triangle strip approach.

## Recommendations

1. **Build a minimal web-based test canvas** using raw HTML5 Canvas + Pointer Events as the first test harness. This is the fastest way to verify that the virtual device's pressure and tilt data reaches applications correctly.
2. **Use Paper.js for any demo application** that needs to showcase smooth, professional-looking strokes. Its built-in path simplification and Bezier handling are well-tested.
3. **Implement a configurable pressure curve** in the host software settings. Default to a gentle gamma curve (~0.7 exponent) that makes light pressure easier to register.
4. **Target 200 Hz minimum report rate** from ML inference to virtual device. This provides enough points for smooth Bezier interpolation without overwhelming the input stack.
5. **Study Windows Ink "wet ink" rendering** for insights on low-latency inking if building a native Windows companion app.

## References

1. Microsoft Learn -- Pen Interactions and Windows Ink: https://learn.microsoft.com/en-us/windows/apps/develop/input/pen-and-stylus-interactions
2. Microsoft Learn -- Windows.UI.Input.Inking Namespace: https://learn.microsoft.com/en-us/uwp/api/windows.ui.input.inking?view=winrt-22621
3. Apple Developer -- Handling Tablet Events: https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/HandlingTabletEvents/HandlingTabletEvents.html
4. MDN -- Using Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events
5. Raph Levien -- Fitting Cubic Bezier Curves: https://raphlinus.github.io/curves/2021/03/11/bezier-fitting.html
6. Pomax -- A Primer on Bezier Curves: https://pomax.github.io/bezierinfo/
7. Pressure.js (Force Touch/Pointer Pressure library): https://pressurejs.com/
8. Wacom Developer -- Windows Ink Overview: https://developer-docs.wacom.com/docs/icbt/windows/windows-ink/windows-ink-overview/
