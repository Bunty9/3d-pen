---
title: "Flex PCB Design for Helical Cylindrical Enclosure"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - flex-pcb
  - manufacturing
  - mechanical
related:
  - "[[sensor-selection]]"
  - "[[mechanical-design]]"
  - "[[wireless-charging]]"
---

## Summary

This note covers the design considerations for implementing a helical flex PCB inside the 3D Pen's cylindrical enclosure. The flex PCB must wrap around a ~6mm inner cylinder (the refill shell) within a ~2.5mm annular gap, placing components on the inner surface of an 11mm outer shell. Key topics include substrate material selection, bend radius constraints, rigid-flex vs. pure-flex trade-offs, component placement in bend zones, and fabrication capabilities at volume-accessible manufacturers (JLCPCB, PCBWay).

## Context

The 3D Pen requires all electronics -- MCU, sensors, wireless charging coils, communication circuits, antenna, and battery management -- to fit within the annular space between a 6mm refill and an 11mm outer shell. A conventional rigid PCB is geometrically impossible in this form factor. The solution is a flexible PCB that is manufactured flat and then wrapped helically around the inner cylindrical shell during assembly. This approach is used in medical catheters, endoscopes, cylindrical IoT sensors, and some smart pen designs (e.g., Livescribe internals).

## Key Findings

### 1. Bend Radius Constraints for the 3D Pen Geometry

The inner cylinder (refill housing) has an outer diameter of approximately 6mm, giving a bend radius of 3mm at the PCB mounting surface. According to IPC-2223 standards, the minimum bend radius for a **static** single-layer flex PCB is **6x the total PCB thickness**. For a 2-layer flex PCB, the rule is approximately **10-12x the thickness**.

**Calculation for our geometry:**
- Available bend radius: ~3mm (wrapping around a 6mm diameter cylinder)
- For single-layer static: max PCB thickness = 3mm / 6 = 0.5mm -- feasible
- For 2-layer static: max PCB thickness = 3mm / 12 = 0.25mm -- feasible but tight
- JLCPCB's standard 2-layer flex is 0.11mm total thickness (two 12um copper layers + polyimide dielectric), which gives a minimum static bend radius of ~1.1-1.3mm -- well within our 3mm requirement

**Critical note:** These bend radius rules apply to **unpopulated** flex areas. Populated areas with soldered components are locally rigid and must not be in the bend zone. The helical layout must be designed so that component pads and solder joints sit in flat or gently curved sections, with tighter bends occurring only in trace-only regions.

### 2. Substrate Materials and Layer Stack-Up Options

**Polyimide (Kapton) -- the standard choice:**
- Thermal rating: up to 400C (excellent for reflow soldering)
- Dielectric constant: 3.3-3.5 at 1MHz
- Available in 12.5um, 25um, and 50um thicknesses
- Excellent chemical resistance and dimensional stability
- JLCPCB uses polyimide with dielectric constant of 3.3 and 2.9 for their standard flex offerings

**Layer stack options for the 3D Pen:**

| Configuration | Typical Thickness | Min Bend Radius (static) | Notes |
|---|---|---|---|
| 1-layer flex | 0.06-0.11mm | 0.36-0.66mm | Simplest; limited routing |
| 2-layer flex | 0.11-0.20mm | 1.1-2.4mm | Standard at JLCPCB; recommended |
| 4-layer flex | 0.20-0.30mm | 2.4-3.6mm | Borderline for our radius |
| Rigid-flex | 0.8mm+ rigid zones | N/A in rigid zones | Best for connectors/debug |

**Recommendation:** A 2-layer pure flex PCB is the sweet spot. At 0.11mm thickness, the minimum static bend radius of ~1.3mm is well under our 3mm available radius, providing a comfortable safety margin. If more routing layers are needed, a 4-layer flex at 0.20mm is still within tolerance but leaves less margin.

### 3. Rigid-Flex vs. Pure Flex Trade-Offs

**Pure Flex Approach (Recommended for v1):**
- Entire PCB is flexible polyimide
- Components are placed in designated "flat zones" along the helix
- Stiffeners (FR4 or polyimide, 0.1-0.3mm) bonded behind component clusters provide local rigidity
- Simpler manufacturing; JLCPCB and PCBWay both support this
- Lower cost: flex PCB pricing is already premium; rigid-flex adds 2-3x cost multiplier

**Rigid-Flex Approach (Consider for v2+):**
- Rigid FR4 islands connected by flex segments
- Better mechanical support for connectors, debug interfaces, and high-pin-count ICs
- Altium Designer has superior rigid-flex design tools with 3D bend simulation
- More expensive and longer lead times
- PCBWay supports up to 16-layer rigid-flex with 2/2mil trace/space

**Decision:** Start with pure flex + stiffeners for prototyping. The 2-layer flex from JLCPCB at 0.11mm thickness provides adequate routing density for our relatively simple circuit (MCU, sensors, antenna, charging). Stiffeners bonded to component areas provide the needed rigidity without the cost of rigid-flex.

### 4. Helical Layout Design Strategy

The helical wrap geometry creates a unique design constraint: the PCB is manufactured flat as a long, narrow strip, and then wrapped around the cylinder. The key geometric parameters are:

**Helix geometry:**
- Cylinder diameter (outer surface of inner shell): ~6.5mm (6mm refill + shell wall)
- Cylinder circumference: ~20.4mm
- Available length along pen axis: ~100mm (accounting for nib mechanism and end cap)
- Helix pitch angle: determines how many wraps and available PCB area

**For a single wrap (0-degree pitch):** A simple cylinder wrap gives ~20.4mm x 100mm = 2,040mm2 of PCB area. However, this requires the PCB to be a wide sheet, which complicates manufacturing.

**For a helical wrap (e.g., 30-degree pitch):** The PCB becomes a narrow strip wound around the cylinder. Strip width ~10mm, total strip length ~230mm, yielding ~2,300mm2 of usable area. Components can be placed in "zones" along the strip that correspond to specific axial positions on the pen.

**Component zone planning (axial positions):**
- Zone A (nib end, 0-40mm): Pressure sensor area
- Zone B (lower-mid, 40-70mm): IMU #1 + capacitive touch IC
- Zone C (upper-mid, 70-100mm): MCU + wireless comms + antenna
- Zone D (top end, 100-130mm): Battery management + charging coil connections + IMU #2
- Debug connector tail: extends beyond the main helix, exits through a slot in the outer shell

### 5. Manufacturing Capabilities: JLCPCB vs. PCBWay

| Capability | JLCPCB | PCBWay |
|---|---|---|
| Flex layers | 1-4 | 1-4 (up to 16 rigid-flex) |
| Min trace/space | 2/2 mil (with LDI) | 2/2 mil (advanced) |
| Min via diameter | 0.15mm | 0.1mm (4mil) |
| Polyimide thickness | 25um, 50um | 12.5um, 25um, 50um |
| Copper weight | 1/3 oz, 1/2 oz, 1 oz | 1/3 oz, 1/2 oz, 1 oz |
| Stiffener support | PI, FR4, steel, adhesive | PI, FR4, steel |
| Coverlay | Yellow PI coverlay | Yellow/black PI coverlay |
| Cutting tolerance | +/-0.05mm (laser) | +/-0.05mm |
| Lead time | 4-5 days (flex) | 5-7 days (flex) |
| Prototype pricing | ~$20-50 for small flex | ~$30-60 for small flex |
| Assembly | SMT assembly available | SMT assembly available |

**Key advantage of JLCPCB:** LDI (Laser Direct Imaging) exposure enables 2/2mil traces without pad deviation, which is important for our fine-pitch component footprints and antenna traces. Laser cutting enables virtually any PCB outline shape with high precision -- essential for our custom helical strip shape.

### 6. Reference Designs and Precedents

**Medical catheter flex PCBs:** Companies like Flexible Circuit Technologies produce multi-layer flex circuits for catheter-based devices that wrap around cylindrical bodies of 2-5mm diameter. These demonstrate that our 3mm bend radius is well within industry capability.

**Amazon Echo Dot:** Uses flex PCBs for cylindrical internal layout, demonstrating commercial viability of flex circuits conforming to cylindrical enclosures.

**Wearable sensor patches:** Devices like continuous glucose monitors (Dexcom G7) use thin flex PCBs (~0.1mm) with populated components in a very small form factor, validating our approach to placing sensors on thin flex substrates.

## Relevance to Project

### Constraints Mapping

| Project Constraint | Flex PCB Implication | Status |
|---|---|---|
| 2.5mm annular gap | PCB + components must be < 2.0mm total height | Feasible with 0.11mm PCB + low-profile components |
| 11mm outer / 6mm inner diameter | ~3mm bend radius at inner surface | 2-layer flex at 0.11mm easily meets 6x rule |
| 150mm pen length | ~100mm usable PCB length along axis | Sufficient for all component zones |
| ~8kHz sensor streaming | Requires adequate trace routing for SPI/I2C buses | 2-layer flex provides adequate routing |
| Wireless charging | Coil traces can be integrated on flex PCB | Requires dedicated area; see [[wireless-charging]] |
| Debug interface | Flex tail connector to external debug board | Flex tail extends from main helix strip |

### Risk Assessment

- **LOW RISK:** Bend radius compliance -- our geometry is well within limits for 1-2 layer flex
- **MEDIUM RISK:** Component placement density -- all components must fit in flat zones along the helix strip; layout may require multiple helix wraps
- **MEDIUM RISK:** Assembly -- populating a long, narrow flex strip and then wrapping it is a manual assembly step for prototypes
- **HIGH RISK:** Thermal management during reflow -- the thin flex substrate has low thermal mass; components near bend zones may experience solder joint stress during assembly

## Open Questions

1. **Helix pitch angle optimization:** What pitch angle maximizes usable component area while maintaining mechanical stability? Needs FEA or physical prototyping.
2. **Adhesive for mounting flex to inner shell:** What adhesive is appropriate for bonding the wrapped flex PCB to the cylindrical inner shell? Must survive thermal cycling and not outgas.
3. **Connector interface for debug tail:** Should the debug flex tail use a ZIF connector or a custom pad interface to the external debug board?
4. **EMI shielding:** In such close proximity, do the MCU and wireless circuits need shielding? Can a ground plane on the flex PCB provide adequate isolation?
5. **Assembly jig design:** How do we ensure repeatable positioning when wrapping the flex PCB during assembly?

## Recommendations

1. **Start with 2-layer flex from JLCPCB** at 0.11mm total thickness. This gives adequate routing, a comfortable bend radius margin, and is the most cost-effective option for prototyping.
2. **Use PI stiffeners** (0.1-0.2mm) bonded behind component clusters rather than rigid-flex for v1 prototypes.
3. **Design the flex strip as a long rectangle** with component zones mapped to axial positions. Use KiCad 8 for layout with flex bend radius DRC enabled.
4. **Order a geometry test coupon first** -- a simple flex strip with dummy pads at the correct dimensions -- to validate the helical wrap process before committing to a fully populated design.
5. **Plan for manual assembly** of prototypes. The flex strip will be populated flat (SMT reflow), then wrapped and bonded to the inner shell.

## References

1. JLCPCB Flex PCB Capabilities -- https://jlcpcb.com/capabilities/flex-pcb-capabilities
2. JLCPCB Flex PCB Design Tips -- https://jlcpcb.com/blog/flex-pcb-design-tips
3. PCBWay Flex PCB Bending Area Design Guidelines -- https://www.pcbway.com/blog/PCB_Design_Layout/Flex_PCB_Bending_Area_Design_Guidelines_How_to_Prevent_Trace_Cracking_and_Failu_c5658260.html
4. IPC-2223 Flex PCB Bend Radius Calculation Guide -- https://www.hemeixinpcb.com/company/news/489-how-to-calculate-the-flex-pcb-bend-radius-and-the-rigid-flex-pcb-minimum-bend-radius.html
5. Flex PCB Bend Radius Planning for Wearable Devices -- https://www.allpcb.com/blog/pcb-design/flex-pcb-bend-radius-planning-for-wearable-devices.html
6. PCBWay FPC Manufacturing Capabilities -- https://www.pcbway.com/pcb-products/FPC.html
7. JHYPCB Flex PCB Applications in 2025 -- https://www.pcbelec.com/blog/industry-applications/flexible-pcb-applications.html
