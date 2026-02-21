---
title: "Mechanical Design for 3D Pen Enclosure"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - mechanical-design
  - enclosure
  - injection-molding
  - ergonomics
related:
  - "[[flex-pcb-design]]"
  - "[[sensor-selection]]"
  - "[[wireless-charging]]"
---

## Summary

This note covers the mechanical design considerations for the 3D Pen's enclosure, including shell materials and manufacturing processes, the screw-thread nib mechanism for refill insertion, internal structural design, thermal management in the tight enclosure, drop/shock protection for internal electronics, and ergonomic considerations. The pen must feel like a premium writing instrument while housing a complete electronics package in the ~2.5mm annular gap between the refill and the outer shell.

## Context

The 3D Pen's mechanical design must satisfy two competing goals:
1. **Feel like a real pen:** Weight, balance, grip comfort, and dimensions must match high-quality writing instruments. Users will write on real paper for hours; any ergonomic compromise is a product failure.
2. **House complex electronics:** MCU, two IMUs, pressure sensor, capacitive touch IC, wireless charging coil, antenna, battery, and all interconnects must fit in the annular gap between the 6mm refill and 11mm outer shell.

Key mechanical dimensions:
- Outer shell diameter: ~11mm
- Inner refill diameter: ~6mm (standard gel pen refill)
- Annular gap: ~2.5mm radial
- Total length: ~150mm
- Refill length: ~110mm
- Nib end unscrews for refill insertion

## Key Findings

### 1. Shell Materials and Manufacturing Processes

#### Material Options

| Material | Density (g/cm3) | Tensile Strength | Key Properties | Use Case |
|---|---|---|---|---|
| ABS | 1.04 | 40-50 MPa | Tough, impact resistant, easy to mold | Clips, plugs, structural parts |
| SAN | 1.08 | 65-75 MPa | Transparent, stiff, scratch resistant | Transparent barrel sections |
| Polycarbonate (PC) | 1.20 | 55-75 MPa | Very strong, clear, heat resistant | Premium transparent shells |
| Polyacetal (POM) | 1.41 | 60-70 MPa | Low friction, dimensionally stable | Threaded nib mechanism |
| TPE/TPU | 1.0-1.3 | 5-30 MPa | Soft, flexible, comfortable grip | Grip section overmold |
| Aluminum 6061 | 2.70 | 310 MPa | Premium feel, excellent thermal | CNC machined outer shell |

**For the 3D Pen, a multi-material approach is recommended:**

- **Outer shell:** Polycarbonate (PC) or aluminum 6061. PC offers transparency (allowing internal LED visibility for charging status), high impact strength, and reasonable cost in injection molding. Aluminum provides a premium writing instrument feel, excellent thermal conductivity (useful for heat dissipation), and high durability, but at higher weight and cost (CNC machining required).
- **Inner cylindrical shell (refill housing):** Polyacetal (POM) for the structural tube that holds the refill and serves as the mounting surface for the helical flex PCB. POM's dimensional stability and low friction are ideal for the refill insertion interface.
- **Nib section (threaded):** POM for the screw-thread mechanism. Its low coefficient of friction, excellent fatigue resistance, and dimensional precision make it the standard choice for pen threading mechanisms.
- **Grip zone:** TPE/TPU overmolded onto the outer shell in the finger grip region (~30-40mm zone). Provides comfort and prevents slip. Must be thin enough (~0.5mm) to not block capacitive touch sensing through the shell.

#### Manufacturing Processes

| Process | Volume | Tolerance | Lead Time | Unit Cost | Best For |
|---|---|---|---|---|---|
| FDM 3D Printing | 1-10 units | +/-0.2mm | 1-3 days | $5-20 | Early concept validation |
| SLA 3D Printing | 1-50 units | +/-0.05mm | 1-5 days | $10-40 | Detailed prototypes |
| CNC Machining (plastic) | 1-100 units | +/-0.02mm | 3-10 days | $30-100 | Functional prototypes |
| CNC Machining (aluminum) | 1-500 units | +/-0.01mm | 5-15 days | $50-200 | Premium production |
| Injection Molding (plastic) | 500+ units | +/-0.05mm | 4-8 weeks (tooling) | $0.50-3 | Volume production |
| 2-shot Injection Molding | 1000+ units | +/-0.05mm | 6-12 weeks (tooling) | $1-5 | Shell + grip in one step |

**Prototype strategy:** Start with SLA 3D printing for form-factor validation, move to CNC machining for functional prototypes with real electronics, and target injection molding for production. The Rohk pen case study by Star Rapid demonstrates successful injection molding of a precision pen enclosure with similar complexity.

### 2. Screw-Thread Nib Mechanism

The nib end of the pen unscrews to allow refill insertion and replacement. This is a critical mechanical interface that must be:
- Reliable over hundreds of screw/unscrew cycles
- Precisely aligned to center the refill tip in the nib opening
- Sealed enough to prevent dust/debris ingress during use
- Quick to operate (2-3 turns maximum)

**Design specifications:**

| Parameter | Value | Rationale |
|---|---|---|
| Thread type | Metric fine (M10 x 0.75) or custom | Fine pitch for precise engagement in small diameter |
| Thread material | POM (nib) mating with PC/Al (shell) | POM-to-PC/Al provides low friction, no galling |
| Thread length | 5-8mm | 2-3 full turns for secure engagement |
| Nib bore diameter | 6.5mm | Slight clearance over 6mm refill |
| Nib tip opening | 1.5-2.0mm | Allows refill tip to protrude; guides refill center |
| O-ring seal | Silicone, 1mm cross-section | Optional; prevents debris ingress |
| Anti-rotation feature | D-flat or keyed interface | Prevents nib from loosening during writing |

**Refill retention mechanism:** Inside the nib section, a small spring-loaded collet or friction fit holds the refill centered and provides the slight preload needed for the pressure sensor to register writing force. The refill must be free to translate axially by ~0.5mm (the travel range of the pressure sensor) but constrained radially.

### 3. Internal Structure and Component Mounting

The pen's internal architecture consists of concentric cylinders:

```
Cross-section (not to scale):

    |<------- 11mm ------->|
    |                       |
    |  [Outer Shell - 1mm]  |
    |  [Gap for flex PCB]   |
    |  [Inner Shell - 0.5mm]|
    |  [Refill - 6mm dia]   |
    |  [Inner Shell - 0.5mm]|
    |  [Gap for flex PCB]   |
    |  [Outer Shell - 1mm]  |
    |                       |

Radial budget:
  Outer shell wall:     1.0mm
  Flex PCB + components: 1.5mm (max, including tallest component)
  Inner shell wall:     0.5mm
  Refill:               3.0mm (radius)
  -------------------------
  Total radius:         6.0mm --> 12mm diameter

Wait -- this exceeds 11mm. Need to optimize:

  Outer shell wall:     0.8mm  (minimum for PC injection molding)
  Flex PCB + components: 1.2mm (ICM-42688-P at 0.91mm + PCB 0.11mm + clearance)
  Inner shell wall:     0.5mm
  Refill:               3.0mm (radius, fixed)
  -------------------------
  Total radius:         5.5mm --> 11.0mm diameter -- exact fit
```

**Critical observation:** The 11mm outer diameter is very tight. With 0.8mm shell walls, 0.5mm inner shell walls, and a 6mm refill, only 1.2mm remains for the flex PCB and components. This is feasible with the recommended sensors (tallest is 0.91mm for ICM-42688-P) but leaves essentially zero margin. Options to recover margin:

1. **Thin the outer shell to 0.7mm** -- feasible for PC or aluminum, but reduces impact protection
2. **Thin the inner shell to 0.3mm** -- possible for POM with ribs/stiffening
3. **Increase outer diameter to 12mm** -- a 1mm increase provides significant relief; still within normal pen dimensions
4. **Place components only on one side** (half-cylinder) rather than wrapping fully around -- creates a heavier side but simplifies clearance

**Recommendation:** Increase the outer diameter to 11.5-12mm. This is still well within the range of premium pens (Montblanc Starwalker: 13.7mm, Lamy Safari: 12mm) and provides critical margin for manufacturing tolerances and component placement.

### 4. Thermal Management

Heat sources in the pen:
- MCU: ~10-30mW (depending on wireless TX power)
- Wireless charging (during charge): ~200-500mW waste heat
- Battery (during charge): ~50-100mW

**During normal use:** Total waste heat is ~30-50mW. This is negligible and can be dissipated through the shell wall without any special thermal management. The pen body surface area (~150mm x 11mm x pi = ~5,200mm2) provides ample natural convection.

**During wireless charging:** Waste heat peaks at ~500mW. In the small, enclosed volume of the pen, this could raise internal temperature by 10-20C above ambient. Mitigation strategies:

| Strategy | Effectiveness | Complexity | Recommended? |
|---|---|---|---|
| Aluminum outer shell | High (thermal conductor) | Low (material choice) | YES for production |
| Thermal pad to shell | Medium | Low (adhesive pad) | YES for all versions |
| Charge rate limiting | High (reduce current) | Low (firmware) | YES as safety feature |
| Active cooling (fan) | N/A | Impossible in pen | NO |
| Thermally conductive potting | Medium | Medium | MAYBE for production |

**Thermal simulation should be performed** using Fusion 360's simulation capabilities once the internal layout is finalized. Key hotspot areas: the wireless charging IC, the battery, and the MCU during continuous high-rate streaming.

### 5. Drop and Shock Protection

The pen will inevitably be dropped. Pens typically fall from desk height (~0.75m) onto hard surfaces. The IEC 60068-2-31 standard for rough handling of portable equipment provides the testing framework.

**Shock loads in a pen drop:**
- Drop height: 0.75m (desk)
- Impact deceleration: ~500-1500g depending on surface and impact orientation
- Duration: 0.5-2ms (half-sine pulse)

**Protection strategies:**

| Component at Risk | Failure Mode | Protection | Implementation |
|---|---|---|---|
| Solder joints on flex PCB | Crack / fracture | Conformal coating + stiffeners | Apply after assembly |
| Battery | Puncture / deformation | Snug mechanical housing | POM cradle with foam padding |
| IMU sensor elements | MEMS element fracture | Component-level shock rating | ICM-42688-P rated to 10,000g |
| Refill glass tip | Breakage | Retractable or recessed nib | Nib design with small recess |
| Flex PCB trace cracking | Open circuit at bend | Follow bend radius rules | Design margin per IPC-2223 |
| Outer shell | Crack / cosmetic damage | Material selection (PC > acrylic) | PC or aluminum shell |

**The ICM-42688-P IMU is rated for 10,000g shock survival**, which far exceeds the ~1,500g expected in a desk-height drop. The flex PCB and solder joints are the weakest mechanical links; conformal coating (e.g., HumiSeal 1B73) applied after assembly adds significant solder joint robustness.

### 6. Ergonomic Considerations

Ergonomics research for writing instruments establishes clear targets:

**Weight:**
| Reference Pen | Weight | Notes |
|---|---|---|
| Apple Pencil (2nd gen) | 21g | Very light; some users find too light |
| Livescribe Symphony | 27g | Comfortable for extended writing |
| Livescribe 3 | 34g (1.2 oz) | Heavier; some fatigue in long sessions |
| Pilot G2 (ballpoint) | 11g | Standard lightweight pen |
| Montblanc Meisterstuck | 30g | Premium weight feel |
| **3D Pen target** | **20-30g** | Matches smart pen category |

**Weight budget for the 3D Pen:**

| Component | Estimated Weight |
|---|---|
| Outer shell (PC, 0.8mm wall) | 4-6g |
| Inner shell (POM) | 1-2g |
| Flex PCB + components | 1-2g |
| Battery (10180 Li-ion) | 2-3g |
| Refill (gel pen) | 3-4g |
| Nib mechanism + hardware | 2-3g |
| Miscellaneous (adhesive, wires) | 1-2g |
| **Total estimate** | **14-22g** |

This falls in the lower end of the target range. An aluminum shell would add 5-10g, bringing it to 19-32g -- right in the sweet spot for a premium-feeling pen.

**Balance point (center of gravity):**
The battery (heaviest single component at 2-3g) should be positioned near the pen's balance point, approximately 60-70mm from the nib (slightly forward of center). This provides a comfortable writing balance. The two IMUs at opposite ends balance each other. The refill contributes ~3-4g concentrated toward the nib end, which is desirable for a natural "front-weighted" writing feel.

**Grip dimensions:**
- Grip zone: 25-35mm from the nib tip
- Grip diameter: 10-12mm (our 11-12mm outer diameter is appropriate)
- Surface texture: matte or soft-touch (TPE overmold) in grip zone
- Cross-section: circular (simplest for helical flex PCB; also universal for all grip styles)

**Grip pressure and capacitive touch interaction:**
The TPE grip layer must be thin enough (~0.3-0.5mm) to allow capacitive touch sensing through it. TPE has a dielectric constant of ~3-5, similar to many plastics, and at 0.5mm thickness the capacitive coupling should be adequate. This needs validation with the IQS263 evaluation board.

### 7. Refill Insertion and Retention

The refill insertion process:

1. User unscrews the nib section (2-3 turns)
2. Nib section separates from pen body, exposing the inner shell bore
3. User slides new refill (110mm x 6mm) into the inner shell from the nib end
4. Refill bottoms out against a stop (spring or hard stop) at the top end
5. User screws nib section back on; nib bore centers and guides the refill tip

**Retention mechanism options:**

| Mechanism | Pros | Cons | Recommendation |
|---|---|---|---|
| Spring-loaded plunger | Consistent preload; good for pressure sensor | Adds length; spring calibration needed | YES for v2 |
| Friction fit (O-ring) | Simple; compact | Variable retention force; wears over time | YES for v1 |
| Collet in nib | Self-centering; secure | Complex machining; adds cost | MAYBE for production |
| Magnetic retention | Click feel; easy insertion | Magnets may interfere with IMUs | NO |

**For v1 prototypes:** Use a small silicone O-ring (ID 6mm, cross-section 0.5mm) pressed into a groove in the inner shell bore near the nib end. This provides friction retention and radial centering of the refill. The refill's axial position is set by the nib section screwing tight against it.

## Relevance to Project

### Constraints Compliance

| Constraint | Requirement | Proposed Solution | Status |
|---|---|---|---|
| Outer diameter | ~11mm (target) | 11.5-12mm (recommended increase) | Modified |
| Total length | ~150mm | 150mm (nib: 15mm, body: 120mm, cap: 15mm) | Feasible |
| Refill compatibility | Standard gel pen refill (110x6mm) | POM inner shell with friction-fit retention | Feasible |
| Weight | 20-30g target | 14-22g (PC shell) or 19-32g (Al shell) | Feasible |
| Drop protection | Survive 0.75m drop | PC/Al shell + conformal coating + shock-rated components | Feasible |
| Thermal management | < 50C surface during charging | Thermal pad to shell + charge rate limiting | Feasible |
| User ergonomics | Comfortable for 2+ hour writing | Weight/balance targets met; TPE grip zone | Feasible |

## Open Questions

1. **Outer diameter decision:** Should we target 11mm (as spec'd) or 11.5-12mm (as recommended for margin)? This affects the refill model compatibility and the overall pen feel. Need user testing with dummy shells at different diameters.
2. **Shell material decision:** PC (plastic, lighter, cheaper, transparent) vs. aluminum (premium, heavier, better thermal, opaque)? Could offer both as product variants.
3. **IP rating requirement:** Does the pen need any ingress protection (IP rating)? If so, the nib thread joint needs a proper O-ring seal, and the outer shell joints need gaskets.
4. **Refill type lock-in:** Is the pen designed for exactly one refill model (e.g., Pilot G2 refill), or should it accept a range of "standard" gel pen refills? Different refills have slightly different diameters (5.5-6.5mm).
5. **End cap design:** Is the top end permanently sealed (for waterproofing), or does it need to open for battery access or reset button?

## Recommendations

1. **Increase outer diameter to 11.5mm** for v1 prototypes to provide manufacturing and assembly margin. Re-evaluate at 11mm for v2 if component miniaturization allows.
2. **Prototype with CNC-machined aluminum** for the first functional prototypes. Aluminum provides the best dimensional accuracy, thermal management, and premium feel. Switch to injection-molded PC for volume production.
3. **Use POM (Delrin) for all internal structural components** -- the inner shell, nib thread section, and refill retention features. POM's combination of precision, low friction, and fatigue resistance is ideal.
4. **Design the shell as two half-shells** (left/right split, not top/bottom) bonded or screwed together. This allows the flex PCB to be mounted on the inner shell before the outer shells are closed around it.
5. **Create a detailed 3D model in Fusion 360** with all internal components modeled at correct dimensions. Use the assembly environment to verify clearances and the simulation environment for thermal/structural analysis.
6. **Order 3D-printed shells immediately** (SLA, multiple diameters: 11, 11.5, 12mm) for ergonomic testing with team members before committing to final dimensions.

## References

1. Star Rapid: Rohk Pen Injection Molding Case Study -- https://www.starrapid.com/project/the-rohk-pen-case-study/
2. Fictiv: Enclosure Design 101 for Injection Molding and 3D Printing -- https://www.fictiv.com/articles/enclosure-design-101-for-injection-molding-and-3d-printing
3. Promwad: How to Design Injection-Molded Enclosures for Electronics -- https://promwad.com/news/injection-molded-enclosure-design
4. Livescribe Smartpen Size and Weight -- https://livescribe.helpscoutdocs.com/article/674-20013-smartpen-size-and-weight
5. IEC 60068-2-31 Rough Handling Shock Testing -- https://keystonecompliance.com/iec-60068-2-31/
6. IEC 60068-2-27 Mechanical Shock Testing -- https://keystonecompliance.com/iec-60068-2-27/
7. Assembly Magazine: Ergonomics of Injector Pen Design -- https://www.assemblymag.com/articles/98825-design-firm-helps-drugmaker-improve-ergonomics-of-injector-pen
