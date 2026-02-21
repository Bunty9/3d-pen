---
title: "3D Pen Hardware Design Specification — AI Render & Exploded View Reference"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - hardware
  - mechanical-design
  - 3d-modeling
  - render-reference
  - exploded-view
related:
  - "[[mechanical-design]]"
  - "[[sensor-selection]]"
  - "[[flex-pcb-design]]"
  - "[[wireless-charging]]"
  - "[[advanced-sensor-options]]"
---

# 3D Pen Hardware Design Specification

Comprehensive dimensional, material, and geometric reference for generating AI renders, exploded views, and 3D CAD models of the 3D Pen.

---

## 1. Overall Pen Dimensions

```
                         ← ————————————— 150mm total length ————————————— →

  ┌──────┐┌─────────────────────────────────────────────────────────┐┌──────┐
  │ NIB  ││                    BODY BARREL                          ││ END  │
  │SECTION││                                                        ││ CAP  │
  └──────┘└─────────────────────────────────────────────────────────┘└──────┘
  ← 15mm →← ———————————————— 120mm ——————————————————————————————— →← 15mm →

  Outer diameter:  11.5mm (recommended; 11.0mm minimum if tolerances permit)
  Inner bore:      6.0mm (refill channel)
  Cross-section:   Circular (constant diameter along body barrel)
  Weight target:   20–28g (PC shell: 14–22g; Al shell: 19–32g)
```

| Parameter | Value | Notes |
|---|---|---|
| Total length | 150mm | Nib tip to end cap top |
| Body barrel length | 120mm | Between nib thread and end cap |
| Nib section length | 15mm | Threaded, removable |
| End cap length | 15mm | Houses charging coil, sealed |
| Outer diameter | 11.5mm | Recommended (11mm is technically possible but zero-margin) |
| Inner bore diameter | 6.0mm | Standard gel pen refill clearance |
| Annular gap (radial) | 2.75mm | Per side, at 11.5mm OD |
| Wall thickness (outer shell) | 0.8mm | Minimum for injection molding or CNC |
| Wall thickness (inner shell) | 0.5mm | POM structural tube |
| Available for PCB+components | 1.45mm | At 11.5mm OD; 1.2mm at 11.0mm OD |

---

## 2. Exploded View — Component List (Nib-to-Cap Order)

The pen disassembles into 12 primary parts. Listed from nib end (bottom) to end cap (top):

| # | Part Name | Material | Color/Finish | Dimensions (L x W/D x H) | Weight |
|---|---|---|---|---|---|
| 1 | Nib Tip Cone | POM (Delrin) | Black, matte | 8mm cone, 1.5mm bore tip | 0.5g |
| 2 | Nib Thread Sleeve | POM (Delrin) | Black, matte | 15mm L x 11.5mm OD, M10x0.75 thread | 1.5g |
| 3 | Refill Centering O-Ring | Silicone | Translucent white | ID 6.0mm, cross-section 0.5mm | <0.1g |
| 4 | Gel Pen Refill | (consumable) | Blue/black ink | 110mm L x 6.0mm dia | 3.5g |
| 5 | Inner Cylindrical Shell | POM (Delrin) | Natural (ivory/cream) | 120mm L x 7.0mm OD x 6.0mm ID | 1.5g |
| 6 | Helical Flex PCB (populated) | Polyimide + copper | Amber/gold (coverlay) | ~230mm flat L x 10mm W x 0.11mm thick | 1.5g |
| 7 | PI Stiffeners (x5) | Polyimide | Amber | Various sizes, 0.2mm thick | 0.3g |
| 8 | 10180 Li-ion Battery | Steel can + Li-ion | Silver metallic | 18mm L x 10mm dia | 2.5g |
| 9 | TPE Grip Sleeve | TPE/TPU | Dark gray, soft-touch | 35mm L x 11.5mm OD x 10.5mm ID, 0.5mm wall | 0.8g |
| 10 | Outer Shell (upper half) | Polycarbonate | Matte black or space gray | 120mm L x 11.5mm, half-cylinder | 2.5g |
| 11 | Outer Shell (lower half) | Polycarbonate | Matte black or space gray | 120mm L x 11.5mm, half-cylinder | 2.5g |
| 12 | End Cap | Polycarbonate or Aluminum | Matching shell finish | 15mm L x 11.5mm dia, press-fit | 1.5g |

**Total estimated weight: ~16–17g (PC shell) or ~22–25g (Aluminum shell)**

---

## 3. Cross-Section Geometry

### 3.1 Standard Cross-Section (Body Barrel, any point along 120mm)

```
                    11.5mm outer diameter
          ┌──────────────────────────────────────┐
          │                                      │
    ┌─────┤      OUTER SHELL (PC, 0.8mm)         ├─────┐
    │     │                                      │     │
    │  ┌──┤  ┌──────────────────────────────┐    ├──┐  │
    │  │  │  │  FLEX PCB + COMPONENTS       │    │  │  │
    │  │  │  │  (0.11mm PCB + up to 0.91mm  │    │  │  │
    │  │  │  │   component height + 0.1mm   │    │  │  │
    │  │  │  │   clearance = 1.12mm max)    │    │  │  │
    │  │  │  └──────────────────────────────┘    │  │  │
    │  │  │                                      │  │  │
    │  │  ├──── INNER SHELL (POM, 0.5mm) ────────┤  │  │
    │  │  │                                      │  │  │
    │  │  │        REFILL (6.0mm dia)            │  │  │
    │  │  │        ● ● ● ● ● ●                  │  │  │
    │  │  │                                      │  │  │
    │  │  ├──── INNER SHELL (POM, 0.5mm) ────────┤  │  │
    │  │  │                                      │  │  │
    │  │  │  ┌──────────────────────────────┐    │  │  │
    │  │  │  │  FLEX PCB (opposite side)    │    │  │  │
    │  │  │  └──────────────────────────────┘    │  │  │
    │  │  │                                      │  │  │
    │  └──┤                                      ├──┘  │
    │     │                                      │     │
    └─────┤      OUTER SHELL (PC, 0.8mm)         ├─────┘
          │                                      │
          └──────────────────────────────────────┘

  Radial stack (from center outward):
    Refill radius ................ 3.00mm
    Inner shell wall ............. 0.50mm  → inner shell OD = 7.00mm
    Flex PCB substrate ........... 0.11mm
    Solder paste ................. 0.05mm
    Tallest component ............ 0.91mm  (ICM-42688-P)
    Clearance to shell ........... 0.10mm
    --- subtotal PCB+comp ........ 1.17mm
    Remaining gap ................ 0.28mm  (margin at 11.5mm OD)
    Outer shell wall ............. 0.80mm
    ──────────────────────────────
    Total radius ................. 5.75mm → diameter = 11.50mm ✓
```

### 3.2 Cross-Section at Pressure Sensor Zone (z = 5–45mm from nib tip)

```
          ┌──────────────────────────────────────┐
          │         OUTER SHELL (0.8mm)          │
          │  ┌──────────────────────────────────┐│
          │  │  FLEX PCB                        ││
          │  │  ┌─FSR 400 Short (0.3mm)──────┐  ││
          │  │  │  active area 5.6mm dia      │  ││
          │  │  └────────────────────────────┘  ││
          │  │                                  ││
          │  ├─── INNER SHELL (0.5mm) ──────────┤│
          │  │                                  ││
          │  │      REFILL (6.0mm dia)          ││
          │  │      axial force → ↓ → FSR       ││
          │  │                                  ││
          │  ├─── INNER SHELL (0.5mm) ──────────┤│
          │  │                                  ││
          │  └──────────────────────────────────┘│
          └──────────────────────────────────────┘

  The FSR 400 Short sits between the refill tip area and the inner shell.
  Writing force is transmitted axially through the refill into the FSR.
  The refill has 0.5mm axial travel (compression) for force measurement.
```

### 3.3 Cross-Section at Battery Zone (z = 55–73mm from nib tip)

```
          ┌──────────────────────────────────────┐
          │         OUTER SHELL (0.8mm)          │
          │  ┌──────────────────────────────────┐│
          │  │  FLEX PCB (wraps around battery  ││
          │  │  housing area — no tall          ││
          │  │  components in this zone,        ││
          │  │  only traces for power routing)  ││
          │  │                                  ││
          │  │  ┌────────────────────────────┐  ││
          │  │  │  10180 Battery             │  ││
          │  │  │  10mm dia x 18mm length    │  ││
          │  │  │  replaces refill+inner     │  ││
          │  │  │  shell in this zone        │  ││
          │  │  └────────────────────────────┘  ││
          │  │                                  ││
          │  └──────────────────────────────────┘│
          └──────────────────────────────────────┘

  The battery occupies the central bore where the refill would be.
  The refill terminates before the battery zone (refill = 110mm, but
  nib section + pressure zone consume the first ~55mm of refill).
  Inner shell has a battery cradle cutout with foam padding (0.5mm).
  Battery is held in place by POM cradle features in the inner shell.
```

---

## 4. Axial Zone Map (Component Positions Along Pen Axis)

The pen is divided into 6 functional zones along its 150mm length. All z-coordinates measured from the nib tip (z=0).

```
z=0mm                                                               z=150mm
  │                                                                     │
  │  ZONE N  │   ZONE A    │  ZONE B   │   ZONE C    │ ZONE D │ ZONE E │
  │  NIB     │  PRESSURE   │  SENSING  │    MCU &     │ POWER  │  END   │
  │  SECTION │  SENSOR     │  & TOUCH  │   WIRELESS   │ MGMT   │  CAP   │
  │          │             │           │              │        │        │
  │ 0–15mm   │  15–55mm    │  55–80mm  │  80–110mm    │110–135 │135–150 │
  │          │             │           │              │        │        │
  ▼          ▼             ▼           ▼              ▼        ▼        ▼
```

### Zone N — Nib Section (z = 0–15mm)
- **Parts**: Nib tip cone (#1), nib thread sleeve (#2), centering O-ring (#3)
- **Function**: Removable section for refill insertion; guides and centers refill tip
- **Thread**: M10 x 0.75mm metric fine, 5–8mm engagement length
- **Bore**: 6.5mm inner diameter (clearance for 6mm refill), tapers to 1.5mm tip opening
- **Material**: POM (black), injection molded or CNC machined
- **Geometry**: Conical taper at tip (60-degree included angle), cylindrical body matching shell OD

### Zone A — Pressure Sensor Zone (z = 15–55mm, 40mm length)
- **Parts on flex PCB**: Interlink FSR 400 Short, IMU #1 (ICM-42688-P)
- **IMU #1 position**: z = 20–23mm (near nib end), mounted on flex PCB stiffener
- **FSR position**: z = 25–45mm, between refill and inner shell wall
- **Stiffener #1**: 8mm x 5mm PI stiffener behind IMU #1
- **Function**: Measures writing pressure (FSR) and nib-end acceleration/rotation (IMU)

### Zone B — Sensing & Touch Zone (z = 55–80mm, 25mm length)
- **Parts on flex PCB**: Azoteq IQS263 capacitive touch IC, ADXL367 wake controller
- **IQS263 position**: z = 60mm, with 4 copper electrode pads extending z = 55–75mm
- **ADXL367 position**: z = 65mm (near pen center of mass)
- **Stiffener #2**: 5mm x 4mm PI stiffener behind IQS263
- **Stiffener #3**: 5mm x 4mm PI stiffener behind ADXL367
- **Electrode pads**: 4 rectangular copper pads (4mm x 3mm each, spaced 5mm apart) on flex PCB surface, forming the capacitive touch slider
- **This zone overlaps with the user's grip area**

### Zone C — MCU & Wireless Zone (z = 80–110mm, 30mm length)
- **Parts on flex PCB**: nRF52840 (QFN48), 32MHz crystal, decoupling caps, 2.4GHz PCB antenna
- **nRF52840 position**: z = 85–91mm (6mm package length along axis)
- **Crystal**: z = 92mm, 1.6mm x 1.2mm ceramic package
- **Antenna**: z = 100–108mm, PCB trace inverted-F antenna (IFA), ~12mm trace length
- **Stiffener #4**: 10mm x 8mm PI stiffener behind MCU cluster (largest stiffener)
- **Decoupling caps**: 3x 100nF (0402 size, 1.0x0.5x0.35mm) adjacent to MCU
- **Function**: All computation, radio TX/RX, sensor bus master

### Zone D — Power Management Zone (z = 110–135mm, 25mm length)
- **Parts**: 10180 Li-ion battery (#8), BQ51003 Qi receiver IC, BQ25100 charger IC, MAX17048 fuel gauge, IMU #2 (ICM-42688-P)
- **Battery position**: z = 112–130mm (18mm cell length), centered in bore
- **BQ51003 position**: z = 131mm (on flex PCB, above battery)
- **BQ25100 position**: z = 132mm (adjacent to BQ51003)
- **MAX17048 position**: z = 130mm (below BQ51003)
- **IMU #2 position**: z = 133–136mm (rear-end IMU), mounted on flex PCB stiffener
- **Stiffener #5**: 8mm x 5mm PI stiffener behind IMU #2
- **Charging LED**: z = 134mm, 0402 LED (green/red), visible through translucent shell

### Zone E — End Cap (z = 135–150mm)
- **Parts**: End cap (#12), Qi receiver coil (wire-wound, 9mm dia flat spiral)
- **Coil position**: z = 140mm, flat spiral coil 9mm diameter, ~0.5mm thick, facing downward when pen stands upright in cradle
- **Ferrite shield**: z = 139mm, flexible ferrite sheet (Laird/TDK), 10mm dia, 0.2mm thick, between coil and battery
- **Function**: Sealed end; houses wireless charging receiver coil
- **Assembly**: Press-fit or snap-fit to body barrel; could be glued for IP sealing
- **Debug connector exit**: Flex PCB tail exits through a 2mm x 0.5mm slot at z = 137mm before end cap seal

---

## 5. Material Specifications

### 5.1 Outer Shell — Polycarbonate (PC)

| Property | Value |
|---|---|
| Grade | Makrolon 2805 or equivalent |
| Density | 1.20 g/cm3 |
| Tensile strength | 55–75 MPa |
| Transparency | Available in clear, translucent, or opaque |
| Color options | Matte black, space gray, translucent smoke, pearl white |
| Surface finish | Matte (VDI 3400 texture, Ra 3.2um) or satin |
| Wall thickness | 0.8mm |
| Manufacturing | Injection molding (production); CNC machining (prototype) |
| Split line | Longitudinal (left/right halves), bonded with ultrasonic welding or adhesive |
| UV stability | Good with UV stabilizer additive |
| Thermal | Vicat softening temp 148C; adequate for pen use |

**Alternative: Aluminum 6061-T6 (premium variant)**

| Property | Value |
|---|---|
| Density | 2.70 g/cm3 |
| Tensile strength | 310 MPa |
| Color options | Anodized black, silver, gunmetal, custom colors |
| Surface finish | Type II anodize (5–25um layer), bead-blasted before anodize |
| Wall thickness | 0.8mm (CNC from solid) |
| Manufacturing | CNC machining only; single-piece barrel possible (no split line) |
| Thermal conductivity | 167 W/m-K (excellent heat dissipation) |

### 5.2 Inner Cylindrical Shell — POM (Polyacetal / Delrin)

| Property | Value |
|---|---|
| Grade | DuPont Delrin 500P or equivalent |
| Density | 1.41 g/cm3 |
| Color | Natural (ivory/cream), not painted |
| Surface finish | As-machined, smooth (Ra 0.8um) |
| Wall thickness | 0.5mm |
| Manufacturing | CNC turning (prototype); injection molding (production) |
| Features | Battery cradle cutout (z=112–130mm), refill stop (z=55mm), O-ring groove at nib end |
| Coefficient of friction | 0.20 (POM-on-POM), 0.35 (POM-on-PC) — ideal for threading |
| Dimensional stability | Excellent; low moisture absorption (0.22%) |

### 5.3 Nib Section — POM (Polyacetal / Delrin)

| Property | Value |
|---|---|
| Grade | Same Delrin as inner shell |
| Color | Black (carbon-filled POM for contrast) |
| Thread | M10 x 0.75mm, 5–8mm engagement, 2–3 full turns |
| Bore | 6.5mm at entry, tapers to 1.5mm at tip |
| Tip geometry | 60-degree included angle cone, 1.5mm opening for refill tip protrusion |
| O-ring groove | 1.0mm wide x 0.7mm deep groove at z=2mm for debris seal |
| Anti-rotation | Optional D-flat or hex key feature at thread engagement |

### 5.4 Grip Sleeve — TPE/TPU

| Property | Value |
|---|---|
| Grade | Kraiburg TPE or equivalent, Shore A 40–60 |
| Density | 1.05 g/cm3 |
| Color | Dark gray or charcoal black |
| Surface finish | Fine micro-texture (diamond knurl or dot pattern) |
| Wall thickness | 0.5mm |
| Length | 35mm, centered at z = 40–75mm (grip zone) |
| Dielectric constant | 3–5 (allows capacitive touch sensing through it) |
| Manufacturing | Overmolded onto outer shell (2-shot) or slip-on sleeve |
| Adhesion | Thermal bonding to PC; mechanical interlock if slip-on |

### 5.5 Flex PCB — Polyimide

| Property | Value |
|---|---|
| Substrate | Polyimide (Kapton equivalent), 25um base thickness |
| Copper | Rolled annealed (RA) copper, 12um per layer, 2 layers |
| Total thickness | 0.11mm (including coverlay) |
| Coverlay | Yellow polyimide coverlay, 12.5um + 25um adhesive |
| Flat dimensions | ~230mm length x 10mm width (unwrapped) |
| Stiffeners | Polyimide, 0.2mm thick, bonded behind component clusters |
| Color | Amber/golden (natural polyimide with yellow coverlay) |
| Surface finish | ENIG (Electroless Nickel Immersion Gold) on pads |
| Outline | Laser-cut to helical strip shape |
| Copper traces | 0.1mm (4mil) min width, 0.1mm min spacing |
| Bend radius | 3mm static (wraps around 7mm OD inner shell) |
| Manufacturer | JLCPCB or PCBWay |

### 5.6 Battery — 10180 Li-ion

| Property | Value |
|---|---|
| Chemistry | Lithium-ion (Li-ion) or Lithium polymer (LiPo) |
| Form factor | 10180 cylindrical (10mm dia x 18mm length) |
| Nominal voltage | 3.7V |
| Capacity | 70–100mAh |
| Can material | Steel with nickel plating |
| Color | Silver metallic |
| Weight | 2.0–3.0g |
| Tab | Spot-welded nickel strip tabs (+ and -) |
| Protection | External protection circuit (on flex PCB via BQ25100) |
| Position | Central bore, z = 112–130mm |

---

## 6. Helical Flex PCB — Flat Layout Geometry

The flex PCB is manufactured flat and wrapped helically during assembly. Here is the flat layout:

```
  ← ————————————————————— ~230mm total strip length ————————————————————— →

  ┌───────────────────────────────────────────────────────────────────────────┐
  │                                                                           │
  │  Zone A           Zone B          Zone C              Zone D              │
  │  (Pressure+IMU1)  (Touch+Wake)    (MCU+Radio)         (Power+IMU2)        │
  │                                                                           │
  │  ┌──────┐         ┌────┐┌────┐   ┌────────┐┌───┐    ┌────┐┌────┐┌──────┐│
  │  │IMU #1│  [FSR]  │IQS ││ADXL│   │nRF52840││XTAL│   │BQ51││BQ25││IMU #2││
  │  │2.5x3 │  conn.  │263 ││367 │   │ 6x6mm  ││1.6x│   │003 ││100 ││2.5x3 ││
  │  │x0.91 │         │2x2 ││2.2x│   │        ││1.2 │   │4x4 ││2x2 ││x0.91 ││
  │  └──────┘         └────┘└────┘   └────────┘└───┘    └────┘└────┘└──────┘│
  │   ●●●●            ●●●●           decoupling          ┌────┐  [LED]      │
  │   stiff.#1        stiff.#2,#3    caps (x3)           │MAX │  0402       │
  │   8x5mm           5x4mm ea.      stiff.#4            │170 │             │
  │                   electrodes     10x8mm              │48  │   ┌────────┐│
  │                   (4x copper                         └────┘   │antenna ││
  │                    pads)                              stiff.#5 │IFA     ││
  │                                                      8x5mm    │traces  ││
  │                                                               └────────┘│
  │  ┌─────────────────────────────────────────────────────────────┐ ┌──────┐│
  │  │  GND plane (layer 2) — continuous except antenna keep-out  │ │debug ││
  │  └─────────────────────────────────────────────────────────────┘ │tail  ││
  │                                                                  │flex  ││
  │                                                                  └──────┘│
  └───────────────────────────────────────────────────────────────────────────┘
                                                                      ↑
                                                               exits pen shell
                                                               at z=137mm
  Strip width: ~10mm
  Strip thickness: 0.11mm (bare), up to 1.12mm at tallest component
```

### Component Placement Table (on flex PCB)

| Component | Part Number | Package | Dimensions (LxWxH mm) | Zone | z-position | Qty |
|---|---|---|---|---|---|---|
| IMU #1 | ICM-42688-P | LGA-14 | 2.5 x 3.0 x 0.91 | A | 20mm | 1 |
| Pressure sensor | FSR 400 Short | Film | 5.6mm dia x 0.3 | A | 25–45mm | 1 |
| Capacitive touch IC | IQS263 | DFN-10 | 2.0 x 2.0 x 0.75 | B | 60mm | 1 |
| Wake controller | ADXL367 | LGA | 2.2 x 2.3 x 0.87 | B | 65mm | 1 |
| MCU | nRF52840 | QFN-48 | 6.0 x 6.0 x 0.85 | C | 85mm | 1 |
| Crystal | 32MHz XTAL | Ceramic | 1.6 x 1.2 x 0.35 | C | 92mm | 1 |
| Decoupling cap (x3) | 100nF C0G | 0402 | 1.0 x 0.5 x 0.35 | C | 88–90mm | 3 |
| PCB antenna | IFA trace | Copper trace | ~12mm trace length | C | 100–108mm | 1 |
| Qi receiver IC | BQ51003 | QFN-20 | 4.0 x 4.0 x 0.8 | D | 131mm | 1 |
| Charger IC | BQ25100 | DSBGA-6 | 1.6 x 1.6 x 0.5 | D | 132mm | 1 |
| Fuel gauge | MAX17048 | DFN-8 | 2.0 x 2.0 x 0.8 | D | 130mm | 1 |
| IMU #2 | ICM-42688-P | LGA-14 | 2.5 x 3.0 x 0.91 | D | 133mm | 1 |
| Status LED | 0402 LED | 0402 | 1.0 x 0.5 x 0.35 | D | 134mm | 1 |
| Charge amp op-amp | AD8615 (optional) | SC70-5 | 2.0 x 2.1 x 1.0 | A | 30mm | 0–1 |

---

## 7. Assembly Sequence (for Exploded View Animation)

The exploded view should show parts separating along the pen's central axis (z-axis). The assembly sequence, from inside out:

### Step 1 — Inner Shell
The POM inner cylindrical shell (#5) forms the central structural spine. It has:
- A bore running the full length for the refill (6.0mm ID)
- A battery cradle cutout at z = 112–130mm (enlarged bore to 10.5mm for battery)
- A refill hard-stop feature at z = 55mm
- An O-ring groove at z = 14mm for the centering O-ring
- Two alignment grooves running axially (for flex PCB positioning)

### Step 2 — Flex PCB Wrap
The populated flex PCB (#6) is wrapped helically around the inner shell:
- Start the wrap at z = 15mm (just above nib thread interface)
- Wind the strip at approximately 30-degree pitch angle
- Components face outward (toward the outer shell)
- Stiffeners face inward (bonded to inner shell surface)
- Adhesive (3M 467MP or VHB) bonds the flex PCB to the inner shell

### Step 3 — Battery Insertion
The 10180 battery (#8) is placed into the battery cradle cutout:
- Slides into the enlarged bore section from the cap end
- Nickel strip tabs connect to flex PCB pads via solder
- Foam padding (0.5mm, EAR C-1002 or equivalent) wraps around battery for shock absorption

### Step 4 — Refill Insertion
The gel pen refill (#4) slides into the inner shell bore from the nib end:
- Passes through the centering O-ring (#3) at z = 14mm
- Tip protrudes 5mm below the inner shell
- Rear end seats against the hard-stop at z = 55mm
- Axial play: 0.5mm (compression travel for pressure sensor)

### Step 5 — Shell Halves
The two outer shell halves (#10, #11) close around the inner assembly:
- Left and right halves (split along the longitudinal axis)
- Join line runs along the top and bottom meridians of the cylinder
- Bonded by ultrasonic welding (PC) or screwed together (Al prototype)
- Alignment features: snap tabs every 30mm along the join line
- The TPE grip sleeve (#9) is either overmolded (production) or slid on before closing (prototype)

### Step 6 — Nib Section
The nib section (#1 + #2) threads onto the body barrel:
- 2–3 turns to fully engage
- O-ring provides dust sealing
- Nib cone centers and guides the refill tip
- Thread torque: hand-tight, ~0.1 Nm

### Step 7 — End Cap
The end cap (#12) press-fits onto the top of the body barrel:
- Contains the Qi receiver coil (pre-assembled inside the cap)
- Ferrite shield sits between coil and battery
- Flex PCB debug tail exits through the slot at z = 137mm before cap is seated
- Press-fit with 0.05mm interference fit

---

## 8. Exploded View Positioning Guide

For a vertical exploded view (pen axis = vertical, nib at bottom):

| Part | Exploded Offset from Body (mm) | Direction | Angle |
|---|---|---|---|
| Nib tip cone (#1) | 40mm below | Down (-Z) | 0 |
| Nib thread sleeve (#2) | 25mm below | Down (-Z) | 0 |
| O-ring (#3) | 15mm below | Down (-Z) | 0 |
| Refill (#4) | Visible inside body (cutaway) or 20mm left | Left (-X) | 0 |
| Inner shell (#5) | Center (reference position) | None | 0 |
| Flex PCB (#6) | 15mm right, partially unwrapped from shell | Right (+X) | 15 degree unwind |
| Stiffeners (#7) | Attached to flex PCB (shown as highlights) | With PCB | — |
| Battery (#8) | 10mm right | Right (+X) | 0 |
| TPE grip (#9) | 20mm left | Left (-X) | 0 |
| Outer shell upper (#10) | 25mm right | Right (+X) | 0 |
| Outer shell lower (#11) | 25mm left | Left (-X) | 0 |
| End cap (#12) | 30mm above | Up (+Z) | 0 |

### Leader Lines (callouts for AI render)

Each part should have a thin leader line pointing to a label showing:
- Part name
- Material
- Key dimension (length or diameter)

---

## 9. Color & Finish Specification

### Default Colorway — "Stealth Black"

| Part | Color | Finish | Pantone/RAL |
|---|---|---|---|
| Outer shell | Matte black | VDI 3400 #27 texture | RAL 9005 Jet Black |
| Nib section | Black | Smooth matte | RAL 9005 |
| End cap | Black | Smooth matte | RAL 9005 |
| TPE grip | Dark charcoal gray | Micro-dot texture | RAL 7016 Anthracite Gray |
| Inner shell | Natural cream | Smooth (hidden) | N/A |
| Flex PCB | Amber gold | Natural coverlay | N/A |
| Battery | Silver metallic | Nickel-plated | N/A |
| Refill | Translucent blue/black | Visible through nib | N/A |
| Status LED | Green (charging) / Red (low) | Visible through translucent window | N/A |

### Alternative Colorway — "Silver Studio"

| Part | Color | Finish |
|---|---|---|
| Outer shell (Aluminum) | Silver/gunmetal | Bead-blasted + Type II anodize |
| Nib section | Dark chrome PVD | Mirror-polished |
| End cap | Matching anodize | Bead-blasted |
| TPE grip | Medium gray | Silicone-like texture |

### Alternative Colorway — "Translucent Tech"

| Part | Color | Finish |
|---|---|---|
| Outer shell (PC) | Smoke translucent | Polished clear, slight tint |
| Nib section | Black POM | Matte |
| End cap | Smoke translucent | Matching shell |
| TPE grip | Frosted white | Soft touch |
| Note: Internal components (PCB, battery) visible through translucent shell |

---

## 10. Charging Cradle Design

The pen charges by standing upright in a cylindrical cradle:

```
          ┌───────────────────────┐
          │     PEN (upright)     │
          │         │             │
          │    ┌────┴────┐        │
          │    │ END CAP │        │
  ┌───────┼────┼─────────┼────────┼───────┐
  │ CRADLE │    │  Qi RX  │        │       │
  │  BODY  │    │  COIL   │        │       │
  │        │    └─────────┘        │       │
  │        │                       │       │
  │        │   ┌─────────────┐     │       │
  │        │   │ Qi TX COIL  │     │       │
  │        │   │ (20-30mm)   │     │       │
  │        │   └─────────────┘     │       │
  │        └───────────────────────┘       │
  │                                        │
  │  Cradle hole: 12mm dia, 30mm deep      │
  │  Material: Aluminum or ABS             │
  │  Color: Matching pen finish            │
  │  Qi TX module: COTS 5V/1A             │
  │  Base: Weighted (~100g) for stability  │
  │  USB-C input for power                 │
  └────────────────────────────────────────┘

  Cradle dimensions: ~40mm dia x 40mm tall (disc shape)
  Self-alignment: gravity + optional magnet at base
```

---

## 11. Key Modeling Notes for 3D CAD / AI Render

### Geometry Tips
1. **The pen is a simple cylinder** — constant circular cross-section along the body barrel. No tapers except at the nib cone.
2. **Nib cone** is a truncated cone: 11.5mm base diameter tapering to ~4mm at the tip over 8mm length, with a 1.5mm bore through the center.
3. **Shell split line** runs along two diametrically opposite meridians (top and bottom when pen is horizontal). In renders, this can be shown as a very faint line or omitted for a clean look.
4. **The helical flex PCB** is the most visually interesting internal component. When shown in exploded view, partially unwrap it to reveal the spiral geometry. The amber/gold polyimide color contrasts nicely against the black shell and cream inner shell.
5. **The 10180 battery** is a standard cylindrical cell, like a tiny AAA. It sits in the center of the pen, visually prominent in cutaway views.
6. **Component heights are exaggerated in cross-sections** for clarity. In reality, the tallest component (0.91mm) is barely visible on an 11.5mm diameter pen.

### Render Camera Angles
1. **Hero shot**: 30-degree perspective, pen resting at slight angle on surface, nib touching paper
2. **Cutaway**: Longitudinal half-section (front half of shell removed), showing all internal zones
3. **Exploded view**: Vertical axis, parts separated as per Section 8
4. **Detail: Nib section**: Close-up showing thread engagement and refill tip protrusion
5. **Detail: Flex PCB unwrapped**: PCB shown flat with components labeled, then ghost-overlaid on pen showing wrap position
6. **Charging scene**: Pen standing upright in cradle, LED glowing green through translucent end cap

### Scale References
- The pen is approximately the size and weight of a premium ballpoint pen (Lamy Safari, Montblanc Starwalker)
- For scale, render alongside a standard No. 2 pencil (19cm x 7mm) or a coin (US quarter = 24.26mm)
- The pen should look and feel like a writing instrument first, tech device second

---

## 12. Bill of Materials Summary (Prototype v1)

| # | Component | Qty | Est. Unit Cost | Supplier |
|---|---|---|---|---|
| 1 | ICM-42688-P | 2 | $5 | DigiKey/Mouser |
| 2 | IQS263 | 1 | $1.20 | DigiKey |
| 3 | ADXL367 | 1 | $5 | DigiKey |
| 4 | nRF52840 (QFN48) | 1 | $4 | DigiKey/Nordic |
| 5 | FSR 400 Short | 1 | $7 | Interlink/SparkFun |
| 6 | BQ51003 | 1 | $2.50 | TI/DigiKey |
| 7 | BQ25100 | 1 | $1.50 | TI/DigiKey |
| 8 | MAX17048 | 1 | $2 | Maxim/DigiKey |
| 9 | 10180 Li-ion cell | 1 | $3 | AliExpress/18650BatteryStore |
| 10 | 32MHz crystal | 1 | $0.30 | DigiKey |
| 11 | 0402 LED | 1 | $0.10 | DigiKey |
| 12 | Passive components (R, C) | ~15 | $0.50 total | DigiKey |
| 13 | 2-layer flex PCB | 1 | $25 | JLCPCB |
| 14 | PI stiffeners | 5 | included in PCB | JLCPCB |
| 15 | Qi RX coil (9mm wire-wound) | 1 | $2 | Wurth/DigiKey |
| 16 | Ferrite sheet (10mm) | 1 | $1 | TDK/Laird |
| 17 | Outer shell (CNC PC) | 2 halves | $40 | Local CNC / Pune |
| 18 | Inner shell (CNC POM) | 1 | $20 | Local CNC / Pune |
| 19 | Nib section (CNC POM) | 1 | $15 | Local CNC / Pune |
| 20 | End cap (CNC PC) | 1 | $10 | Local CNC / Pune |
| 21 | TPE grip sleeve | 1 | $5 | Custom molding |
| 22 | O-rings, adhesive, foam | misc | $5 | Amazon/local |
| 23 | Gel pen refill (Pilot G2) | 1 | $1 | Stationery store |
| | **Total prototype cost** | | **~$156** | |

---

## 13. Dimensional Reference Card (Quick Reference)

```
┌─────────────────────────────────────────────────────────────────┐
│                   3D PEN DIMENSIONAL REFERENCE                  │
├─────────────────────────────────────────────────────────────────┤
│  Overall:     150mm L  x  11.5mm D  x  20–28g                  │
│  Refill:      110mm L  x  6.0mm D   (Pilot G2 compatible)      │
│  Battery:     18mm L   x  10.0mm D  (10180 Li-ion, 100mAh)     │
│  Flex PCB:    230mm L  x  10mm W    x  0.11mm T  (flat)        │
│  Tallest IC:  0.91mm  (ICM-42688-P)                             │
│  Shell wall:  0.8mm   (PC or Al)                                │
│  Inner wall:  0.5mm   (POM)                                     │
│  Annular gap: 2.75mm  per side (at 11.5mm OD)                  │
│  PCB budget:  1.45mm  available for PCB + components            │
│  Thread:      M10 x 0.75mm  (nib section)                      │
│  Grip zone:   z = 40–75mm from nib tip                          │
│  Weight:      14–22g (PC)  /  19–32g (Al)                       │
└─────────────────────────────────────────────────────────────────┘
```
