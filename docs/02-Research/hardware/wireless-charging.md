---
title: "Wireless Charging for 3D Pen"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - wireless-charging
  - Qi
  - power-management
  - battery
related:
  - "[[flex-pcb-design]]"
  - "[[mechanical-design]]"
---

## Summary

This note investigates wireless charging implementation for the 3D Pen, covering Qi-standard receiver coil design for a cylindrical form factor, receiver IC selection (BQ51003, STWBC, P9221), PCB trace coils vs. wire-wound coils, charging IC integration with small Li-ion cells, and alignment tolerance for a pen-shaped device. The pen's cylindrical geometry presents a unique challenge: standard Qi coils are flat/planar, but the pen requires either a cylindrical receiver coil or a planar coil integrated into a flat section of the design.

## Context

The 3D Pen needs wireless (Qi-style) charging to maintain a sealed, waterproof-capable enclosure with no exposed ports. The battery is a small cylindrical or pouch Li-ion cell that must fit within the pen body alongside all other electronics. Key constraints:

- **Available space for coil:** The coil must fit within the pen's 11mm outer diameter
- **Power budget:** The pen's total electronics draw ~10-20mA during active streaming; a small battery (50-150mAh) provides 2-8 hours of use
- **Charging rate:** At these battery sizes, 50-250mA charging current is appropriate (0.5C-1C rate)
- **Alignment:** The user drops the pen into a cradle or lays it on a pad; alignment tolerance must be forgiving

## Key Findings

### 1. Coil Geometry Options for Cylindrical Receivers

Standard Qi receiver coils are flat spirals designed for planar devices (phones, watches). For a cylindrical pen, three approaches are viable:

**Option A: Axial Planar Coil at Pen End**
- Place a small flat spiral coil at one end of the pen (inside the end cap), oriented perpendicular to the pen axis
- The pen stands upright in a cradle, coil facing down toward a flat transmitter
- Coil diameter constrained to ~9mm (inside the outer shell)
- Simple Qi compatibility; standard alignment
- **Disadvantage:** Occupies valuable end-cap space; reduces available volume for other components

**Option B: Cylindrical/Solenoid Coil Wrapped Around Pen Body**
- Wind a solenoid-style coil around the pen body (or integrate into the flex PCB as helical traces)
- The pen lies in a cradle with a matching solenoid transmitter coil
- Better coupling for cylindrical geometry; larger coil area possible
- **Disadvantage:** Not standard Qi geometry; requires custom transmitter cradle; reduced coupling factor due to geometry mismatch with standard Qi pads

**Option C: PCB Trace Coil on Flex PCB**
- Implement the receiver coil as copper traces on the flex PCB itself
- When the flex PCB wraps helically, the traces naturally form a solenoid-like coil
- No separate coil component needed; minimal additional thickness
- **Disadvantage:** PCB trace coils have higher DC resistance than wire-wound coils, resulting in lower Q-factor and lower efficiency. Typical PCB coil efficiency is 60-70% vs. 80-85% for wire-wound.

**Recommendation for v1:** **Option A (Axial Planar Coil)** for maximum Qi compatibility and proven charging IC support. The pen stands upright in a simple cradle with a standard Qi transmitter pad at the base. For v2, investigate Option C (PCB trace coil) to eliminate the discrete coil component.

### 2. PCB Trace Coils: Design Considerations

If implementing the coil as PCB traces (Option C), several parameters must be optimized:

**Coil Structure on Flex PCB:**
- A multi-layer PCB coil uses traces on both copper layers connected by vias to increase inductance
- Typical PCB coil trace width: 0.15-0.3mm, with 0.1-0.15mm spacing
- For a solenoid geometry with the helical flex PCB, each wrap of the helix forms approximately one turn of the coil
- 5-10 turns are typical for Qi receiver coils; this maps to 5-10 helical wraps dedicated to the charging coil zone

**PCB Coil Performance Characteristics:**
| Parameter | Wire-Wound Coil | PCB Trace Coil |
|---|---|---|
| Typical Q-factor | 30-80 | 10-30 |
| DC resistance | 0.2-1.0 ohm | 2-10 ohm |
| Thickness | 0.5-2.0mm | 0.0-0.1mm (part of PCB) |
| Inductance range | 5-20 uH | 2-10 uH |
| Coupling efficiency | 80-85% | 60-70% |
| Cost (per unit) | $0.50-2.00 | $0 (part of PCB) |
| Assembly | Separate component | Integrated |
| Customization | Limited by stock sizes | Fully customizable |

**Ferrite Shielding:** Both coil types require a ferrite sheet behind the receiver coil to shield the battery and electronics from the AC magnetic field and improve coupling. For the pen, a thin flexible ferrite sheet (0.1-0.3mm, available from Laird or TDK) can be integrated into the flex PCB stack-up or bonded to the inner surface of the outer shell.

### 3. Wireless Charging Receiver ICs

#### Candidates Evaluated

| Parameter | TI BQ51003 | ST STWBC-EP | Renesas P9221R | TI BQ51050B |
|---|---|---|---|---|
| Standard | Qi v1.2 WPC | Qi v1.2 WPC | Qi v1.2 WPC | Qi v1.2 WPC |
| Max Power | 2.5W | 5W | 5W | 5W |
| Output Voltage | 5V regulated | 5V regulated | 5V or adjustable | 5V regulated |
| Package | QFN-20 (4x4mm) | QFN-48 (7x7mm) | WL-CSP (2.6x2.9mm) | QFN-20 (4x4mm) |
| Package Height | ~0.8mm | ~0.9mm | ~0.5mm | ~0.8mm |
| Integrated LDO | Yes | Yes | Yes | Yes |
| Integrated rectifier | Yes | Yes | Yes | Yes |
| Current consumption | ~5mA (active Rx) | ~8mA | ~6mA | ~5mA |
| Thermal protection | Yes | Yes | Yes | Yes |
| Key Feature | Ultra-small reference design (5x15mm) | Higher power; FOD | Smallest package; WL-CSP | Integrated charger option |
| Approx. Price | ~$2-3 | ~$3-5 | ~$3-4 | ~$2-3 |

**Analysis:**

- **TI BQ51003:** The most proven and compact option for low-power wearable charging. TI provides a reference design optimized for small wearables that fits in just 5mm x 15mm board area. Designed for 2.5W and below, which is more than adequate for our 50-250mA charging needs. Pairs directly with the BQ25100 ultra-low-current 1-cell Li-ion linear charger for charging currents from 10mA to 250mA. Package height of 0.8mm fits within our radial budget.

- **Renesas P9221R:** Smallest package (WL-CSP at 2.6x2.9x0.5mm) -- significantly smaller than alternatives. Supports up to 5W which is more than we need. The WL-CSP package requires careful PCB design for solder reliability on flex substrates.

- **ST STWBC-EP:** More features (foreign object detection, higher power) but the QFN-48 package at 7x7mm is too large for our application. Better suited for phone-sized devices.

- **TI BQ51050B:** Similar to BQ51003 but with 5W capability. Suitable but offers no advantage over the BQ51003 for our low-power application.

**Recommendation:** Use the **TI BQ51003** paired with the **TI BQ25100** charger IC. TI's reference design for this combination targets exactly our use case: low-power wearables with small batteries and minimal board area. The combined solution fits in a 5mm x 15mm footprint.

### 4. Battery and Charging System Design

**Battery Options:**

| Parameter | Cylindrical (10180) | Pouch Cell (Custom) | Pouch Cell (Small LiPo) |
|---|---|---|---|
| Form Factor | 10mm dia x 18mm long | Custom shape | ~20x10x3mm |
| Capacity | 70-100mAh | 50-150mAh | 50-80mAh |
| Voltage | 3.7V nominal | 3.7V nominal | 3.7V nominal |
| Weight | ~2-3g | ~1-3g | ~1-2g |
| Fit in Pen | Excellent (cylindrical) | Flexible shape | Marginal (rectangular) |

The **10180 cylindrical Li-ion cell** (10mm diameter x 18mm length) is the best geometric fit for the pen body. At 10mm diameter, it fits within the 11mm outer shell with minimal wasted space. Capacity of 70-100mAh provides approximately:
- At 20mA total draw: 3.5-5 hours of continuous use
- At 10mA (low-power mode): 7-10 hours

**Charging Circuit Architecture:**

```
[Qi Tx Pad] --> [Rx Coil] --> [BQ51003 Rectifier/Regulator] --> 5V out
                                                                  |
                                                         [BQ25100 Charger]
                                                                  |
                                                          [10180 Li-ion]
                                                                  |
                                                         [LDO/Buck to 1.8V/3.3V]
                                                                  |
                                                          [MCU + Sensors]
```

### 5. Alignment Tolerance and Cradle Design

For a pen that stands upright in a cradle:

- **Axial alignment (Option A):** The coil at the pen base aligns with the transmitter coil at the cradle base. Lateral tolerance is determined by coil diameter overlap. With a 9mm receiver coil and a 20-30mm transmitter coil, alignment tolerance is approximately +/-5mm lateral -- easily achieved with a simple cylindrical cradle hole.

- **Angular alignment:** Not critical for Option A since both coils are circular and coaxial when the pen is upright.

- **Z-axis gap:** The distance between receiver and transmitter coils affects coupling. Optimal gap is 1-3mm. The pen's bottom shell wall (1-1.5mm) provides this gap naturally.

**Cradle concept:** A simple cylindrical hole (12mm diameter, 30mm deep) in a base unit containing a standard Qi transmitter coil (Adafruit Universal Qi module or similar). The pen drops in vertically, self-aligning by gravity. A magnet at the base could assist alignment and provide a satisfying "snap" feel.

### 6. Power Delivery and Efficiency Analysis

**End-to-end efficiency estimation:**

| Stage | Efficiency | Power In | Power Out |
|---|---|---|---|
| Qi transmitter (wall to coil) | ~85% | 1.5W | 1.28W |
| Coil coupling (wire-wound Rx) | ~80% | 1.28W | 1.02W |
| BQ51003 rectifier/regulator | ~85% | 1.02W | 0.87W |
| BQ25100 charger (to battery) | ~90% | 0.87W | 0.78W |
| **Overall** | **~52%** | **1.5W** | **0.78W** |

At 0.78W delivered to the battery: charging a 100mAh cell from empty to full takes approximately 30-40 minutes at ~200mA charge rate. If using PCB trace coils (lower coupling efficiency ~65%), overall efficiency drops to ~40%, extending charge time to ~45-55 minutes. Both are acceptable for a pen that charges overnight or between use sessions.

## Relevance to Project

### Constraints Mapping

| Constraint | Requirement | Proposed Solution | Status |
|---|---|---|---|
| 2.5mm radial gap | Coil + IC must fit radially | BQ51003 (0.8mm) + flat coil at end cap | Feasible |
| 11mm outer diameter | Coil diameter < 10mm | 9mm flat spiral at pen base | Feasible |
| Small battery | 50-150mAh Li-ion | 10180 cylindrical cell (~100mAh) | Selected |
| Sealed enclosure | No USB port for charging | Qi wireless charging eliminates ports | Achieved |
| Charge time | < 1 hour ideally | ~30-55 min depending on coil type | Feasible |
| Standard compatibility | Qi WPC v1.2 | BQ51003 is Qi v1.2 compliant | Achieved |
| Cradle simplicity | Easy to use; drop-in | Cylindrical hole with Qi pad at base | Feasible |

## Open Questions

1. **Ferrite sheet sourcing:** What specific flexible ferrite sheet product (e.g., Laird Flex-Shield, TDK IFL series) fits within our thickness budget and provides adequate shielding?
2. **Battery protection circuit:** Does the BQ25100 include sufficient protection (OVP, OCP, OTP), or is a separate battery protection IC (like the BQ29700) needed?
3. **NFC interference:** The pen's wireless communication antenna and the Qi charging coil operate at different frequencies (2.4GHz vs. ~100-200kHz), but physical proximity may cause interference. Need to verify in testing.
4. **10180 cell availability:** The 10180 form factor is less common than AAA or 18650. Need to identify reliable suppliers with cells rated for the required discharge current.
5. **Heat dissipation during charging:** The BQ51003 and BQ25100 will generate heat in the confined pen enclosure. Is the thermal path through the shell adequate, or do we need a thermal pad to the outer shell?

## Recommendations

1. **Prototype with the TI BQ51003 + BQ25100 wearable reference design** (TIDA-00318 or similar). This validated combination minimizes design risk for the charging subsystem.
2. **Use a wire-wound receiver coil for v1** (e.g., Wurth WR-WPC series or TDK WCT series, ~9mm diameter). Switch to PCB trace coil only after validating the wire-wound approach.
3. **Place the charging coil at the pen's top end** (opposite the nib) to maximize distance from the pressure sensor and nib-end IMU, reducing magnetic interference with sensitive analog measurements.
4. **Design the charging cradle as a v1 deliverable** alongside the pen. Use a COTS Qi transmitter module (5V, 1A capable) embedded in a 3D-printed or machined cradle body.
5. **Include LED charge status indication** -- a small LED (on the flex PCB near the end cap) visible through the translucent shell, driven by the BQ25100 status output.

## References

1. TI BQ51003 Datasheet -- https://www.ti.com/lit/ds/symlink/bq51003.pdf
2. TI BQ51003 Product Page -- https://www.ti.com/product/BQ51003
3. TI Wearable Wireless Charging Reference Design -- https://www.eenewseurope.com/en/adapting-qi-compliant-wireless-power-solutions-to-low-power-wearable-products/
4. Adafruit Universal Qi Wireless Receiver Module -- https://www.adafruit.com/product/1901
5. NXP Coils Used for Wireless Charging Application Note (AN4866) -- https://www.nxp.com/docs/en/application-note/AN4866.pdf
6. ST Wireless Power Transfer Coil Design (AN5961) -- https://www.st.com/resource/en/application_note/an5961-wireless-power-transfer-coil-design-stmicroelectronics.pdf
7. Altium Components for Wireless Power Transfer Charger Design -- https://resources.altium.com/p/components-for-wireless-power-transfer-charger-design
