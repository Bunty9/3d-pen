---
title: "Manufacturing Ecosystem: Pune, India for PCB/Electronics Prototyping"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - research
  - hardware
  - manufacturing
  - pcb
  - flex-pcb
  - pune
  - prototyping
  - supply-chain
related:
  - "[[flex-pcb-design]]"
  - "[[prior-art-smart-pens]]"
  - "[[mechanical-design]]"
---

## Summary

This note evaluates the Pune, India manufacturing ecosystem for PCB fabrication and electronics assembly relevant to prototyping the 3D Pen. Six local vendors are profiled for capabilities ranging from PCB design and fabrication to SMT/THT assembly. The note also assesses flex PCB manufacturing capability within India, DFM considerations for the pen's helical flex PCB geometry, and cost comparisons against Chinese fabrication houses (JLCPCB, PCBWay). The key finding is that Pune vendors can handle standard rigid PCB prototyping and basic flex PCB fabrication, but the helical flex PCB with component placement constraints will almost certainly require Chinese or specialized US/EU fabricators for initial prototypes, with a potential transition to Indian manufacturing for later production runs.

## Context

The 3D Pen requires a single flexible PCB made from polyimide substrate that wraps helically around an inner cylindrical shell (6 mm ID, 11 mm OD, ~2.5 mm annular gap). Components (MCU, sensors, antenna, charging coils) must land in precise positions when the flat PCB is rolled into the helix. This is a non-standard geometry that pushes the limits of flex PCB DFM.

For the prototype phase, we need:
1. **Rigid PCB prototyping** for the external debug board and breakout boards
2. **Flex PCB fabrication** for the pen's main circuit (polyimide, single or double-sided, thin copper)
3. **SMT assembly** for fine-pitch components (0201-size passives, QFN/BGA MCU packages)
4. **Rapid turnaround** for design iterations (target: 5-7 day fabrication + assembly)

Pune is the team's local city, making face-to-face vendor management feasible.

## Key Findings

### 1. Pune-Based PCB Vendors

#### MRK Electronics

| Attribute | Details |
|---|---|
| **Location** | Abhimaan Township, Gat No 8 & 12, K-Wing 305, Shirgaon, Somantane Phata, Mumbai-Pune Expressway, Pune 411033 |
| **Established** | 2015 |
| **Entity type** | Sole Proprietorship |
| **Contact** | Phone: +91 9518370605; Email: mrkelectronics2018@gmail.com, info@mrkelectronics.com |
| **Website** | https://www.mrkelectronics.com/ |

**Services:**
- PCB Layout design
- PCB Fabrication: single-sided, double-sided, MCPCB (metal-core)
- PCB Fabrication: Flex (polyimide-based flexible circuits)
- PCB Assembly (SMT and THT)
- PCB Stencil manufacturing
- Component Sourcing

**Assessment for 3D Pen:**
MRK is the most promising Pune-based vendor because they explicitly list flex PCB fabrication as a service. Located on the Mumbai-Pune Expressway near Chakan (an industrial zone), they offer end-to-end service from layout through assembly. However, their flex PCB capability likely covers standard flat flex circuits, not helical-wrap geometries. Best suited for our rigid debug board and potentially simple flat flex test coupons. Worth an in-person visit to evaluate their flex fabrication equipment and tolerances.

---

#### Rapid Circuit

| Attribute | Details |
|---|---|
| **Location** | Ground Floor, Gat No 533/1, Dnyanjan Wearhouse Services, Charholi Bypass Road, Pune 412105 |
| **Established** | 2017 (headquarters in Rajkot, Gujarat) |
| **Contact** | Phone: +91 74054 07973; Email: info@rapidcircuit.in |
| **Website** | https://rapidcircuit.in/ |

**Services:**
- PCB Design / CAD services
- PCB CAM processing
- PCB File Conversion and Gerber editing
- PCB Reverse Engineering / PCB Copy / PCB Cloning
- Fabrication: single-layer, FR4, CEM1, CEM3, FR1, Aluminium/metal-core, XPC
- Quick-turn prototyping (urgent orders with expedited pricing)

**Assessment for 3D Pen:**
Rapid Circuit's strength is in Gerber editing and quick-turn rigid PCBs. They do not list flex PCB as a service. Useful for urgent rigid board prototypes (debug board, breakout boards) when we need fast turnaround. Their Gerber editing capability could help with panelization and file preparation. Not suitable for flex PCB fabrication.

---

#### Alfa Electronics

| Attribute | Details |
|---|---|
| **Location** | S.No. 37/3, Ajinkyatara Industrial Estate, Wadgaon Khurd, Sinhagad Road, Pune 411041 |
| **Established** | 2003 |
| **Contact** | Website: https://www.alfaelectronicsindia.com/ |
| **Certifications** | ISO 9001 quality management |

**Services:**
- SMT Assembly (fine pitch down to 0201-size components, 12 mil pitch)
- THT Assembly
- SMD Assembly
- Development and prototyping (high mix, low-to-medium volume)
- Cable and device assembly
- Materials management and logistics
- Box building / turnkey solutions

**Target industries:** Telecom, Power Electronics, GPS, Medical, Automotive, IoT

**Assessment for 3D Pen:**
Alfa is the strongest assembly partner in Pune for our needs. Their 0201 placement capability and 12 mil pitch handling are critical for the fine-pitch components on our flex PCB. ISO 9001 certification adds confidence. Their experience with IoT and wearable-adjacent products (GPS, medical) suggests familiarity with miniaturized designs. Established in 2003, they have 20+ years of operational history. Best candidate for PCB assembly once we have fabricated boards (from any source).

---

#### TSIE (Tecno Systems Industrial Electronics)

| Attribute | Details |
|---|---|
| **Location** | Headquarters in Bangalore; services delivered to Pune |
| **Established** | 34+ years in operation |
| **Contact** | Website: https://tsie.in/ |

**Services:**
- SMT and THT assembly
- Low-volume prototyping with rapid turnaround
- High-volume manufacturing
- PCB fabrication (manufacturer in Pune context, though HQ is Bangalore)

**Assessment for 3D Pen:**
TSIE is a well-established EMS provider with Bangalore headquarters. Their Pune service is likely through shipping rather than a local facility, which reduces the face-to-face advantage. Their 34+ years of experience is notable, but for a project requiring hands-on iteration with flex PCB prototypes, a truly local vendor is preferable. Consider TSIE for later-stage production runs where remote manufacturing is acceptable.

---

#### Ask Electronics

| Attribute | Details |
|---|---|
| **Location** | Bhosarigoan (Bhosari), Pune |
| **Established** | 2021 |
| **Contact** | Listed on IndiaMART: https://www.indiamart.com/askelectronics/ |

**Services:**
- PCB Assembly
- Assembly services (general)

**Assessment for 3D Pen:**
Ask Electronics is a very young company (est. 2021) with limited publicly available information. Their service listing is generic (PCB assembly). For a project with tight tolerances and non-standard geometries, a more established vendor with documented capabilities is preferable. Not recommended as a primary partner, but could serve as a backup for simple rigid board assembly if capacity is needed.

---

#### FPGA Tech Solution

| Attribute | Details |
|---|---|
| **Location** | Samruddhi Heights, Flat No. B401, Bharati Vidyapeeth, Dattanagar Road, Katraj, Pune 411046 |
| **Established** | 2013 |
| **Contact** | Website: https://fpgatechsolution.com/ (also https://www.fpgatechsolution.in/) |

**Services:**
- PCB Layout design (high-speed, high-density, micro-BGA)
- PCB Design verification, netlist generation, BOM generation
- FPGA design and development (Xilinx, Altera, Lattice, Cypress, Actel, Quicklogic)
- Prototype to production support
- Multi-layer PCB layout (single-sided through multi-layer)
- High-frequency and mixed-signal design expertise

**Assessment for 3D Pen:**
FPGA Tech Solution is a design services company, not a fabrication/assembly house. Their strength is in PCB layout and FPGA development. Potentially useful for outsourcing our flex PCB layout if we need specialized high-speed design expertise (e.g., impedance-controlled traces for the 2.4 GHz antenna, high-speed MCU routing). Their micro-BGA experience is relevant if we use a BGA-packaged MCU. Not a fabrication vendor.

---

### 2. Flex PCB Manufacturing in India

Beyond Pune, the broader Indian ecosystem for flex PCB fabrication includes:

#### AS&R Circuits India Pvt. Ltd. (Gujarat)

A joint venture between American Standard Circuits (USA, est. 1988) and Ronak Circuits (Gujarat, est. 2012). This is the most capable flex PCB manufacturer identified in India.

**Capabilities:**
- Single, double, and multi-layer flex PCBs
- Rigid-flex PCBs (polyimide + FR4)
- Trace and space: down to 0.0015 inches (38 um) in production
- Micro via: down to 0.001 inches (25 um) diameter
- Surface finishes: ENIG, immersion silver, immersion tin, OSP, hard gold
- Adhesive-less construction for thinner circuits
- Selective polyimide removal for cantilevered/windowed leads
- Additive processing for higher density

**Assessment:** Most advanced flex PCB capability in India. Their adhesive-less construction and fine trace/space are relevant for our design. However, helical-wrap geometry with pre-placed component pads is still a custom DFM challenge that would require direct engineering consultation.

#### PCB Power (Gujarat)

- 2 and 4 layer flex PCB fabrication and assembly
- Established Indian manufacturer with online quoting
- Website: https://www.pcbpower.com/PCBFlexible

**Assessment:** Capable for standard flex circuits. Unlikely to handle the helical geometry without significant DFM consultation.

---

### 3. Helical Flex PCB: DFM Considerations

The 3D Pen's helical flex PCB is the most challenging manufacturing aspect. Key DFM constraints from industry guidelines:

**Bend radius rules:**
- Static (flex-to-install) bend: minimum radius >= 6x total flex thickness for 1-2 layers, >= 12x for 3+ layers
- Dynamic (repeated bending): minimum radius >= 100x total flex thickness, limited to 1-2 layers
- Our pen: inner cylinder diameter is 6 mm, so the bend radius is ~3 mm. For a single-layer flex with 50 um polyimide + 18 um copper + 25 um coverlay = ~93 um total, the 6x rule gives 0.56 mm minimum bend radius. Our 3 mm radius is well within this limit.

**Trace routing on bends:**
- Traces must run perpendicular to the bend axis
- For our helical wrap, traces should follow the helix direction (perpendicular to the circumferential bend)
- Use curved transitions instead of sharp corners at bend boundaries
- Avoid vias in bend zones

**Material selection for tight bends:**
- Thin polyimide (12.5-25 um) recommended for tight radii
- Thin copper (9-18 um, half-ounce or less) reduces stiffness
- Adhesive-less construction eliminates the ~25 um acrylic adhesive layer, reducing total thickness

**Component placement:**
- Components must be placed on flat (non-bent) regions or on stiffener-backed areas
- For helical wrap, components land on the outer surface after rolling; stiffeners can be added behind component pads to create local rigid zones
- Minimum bend-to-component clearance: typically 1-2 mm from bend line to nearest pad

**Helical-specific challenges:**
- No standard PCB fabrication house offers "helical flex PCB" as a catalog service
- The flex board is fabricated flat, then wrapped during assembly
- Registration of component pads to their intended positions after wrapping requires precise mechanical tooling
- The helix pitch and wrap angle must be designed so that traces maintain continuity without excessive strain
- Test points and connectors should be at the ends of the flex strip (before wrapping begins)

---

### 4. Cost Comparison: India vs. China

| Factor | JLCPCB (China) | PCBWay (China) | MRK Electronics (Pune) | AS&R Circuits (Gujarat) |
|---|---|---|---|---|
| **Rigid PCB (5 pcs, 2-layer)** | ~$2-7 + shipping | ~$5-10 + shipping | Quote-based (est. Rs 500-1500) | Quote-based |
| **Flex PCB (5 pcs, 1-layer)** | Starting ~$2 (promo) + shipping | ~$15-30 + shipping | Quote-based (limited flex capability) | Quote-based (most capable in India) |
| **Flex PCB materials** | Polyimide, 25/50 um dielectric, 1-4 layers | Polyimide, multiple options | Polyimide (details unconfirmed) | Polyimide, adhesive-less available |
| **SMT Assembly** | Yes (JLCPCB PCBA) | Yes | Yes (Alfa Electronics preferred for Pune) | Limited |
| **Turnaround (fab only)** | 1-3 days + 3-7 day shipping | 1-3 days + 3-7 day shipping | 3-7 days (local, no shipping delay) | 5-10 days + domestic shipping |
| **Turnaround (total to hand)** | 5-14 days | 5-14 days | 3-7 days | 7-14 days |
| **DFM support** | Online tools, automated checks | Online tools, human review available | In-person consultation possible | Engineering consultation (ASC USA expertise) |
| **Flex PCB cost (per sq.in)** | $0.50-5 (standard), higher for custom | $0.50-5 (standard) | Likely 2-3x China pricing | Likely 1.5-2x China pricing |
| **Shipping cost** | $15-40 (DHL/FedEx) | $15-40 | None (local pickup) | Rs 200-500 domestic |

**Key insight:** For flex PCBs specifically, Chinese manufacturers (JLCPCB, PCBWay) offer significantly lower pricing due to scale, but the total turnaround time including international shipping is 5-14 days. Pune vendors eliminate shipping delay but have limited flex PCB capability. The optimal strategy is a split approach: use Chinese fabricators for flex PCBs and use Pune vendors for rigid boards and assembly.

---

### 5. Recommended Vendor Strategy

**Phase 1: Early Prototyping (Rigid boards, sensor breakouts)**
- Fabrication: JLCPCB or Rapid Circuit (Pune) for quick-turn rigid PCBs
- Assembly: Alfa Electronics (Pune) for SMT/THT assembly
- Design review: FPGA Tech Solution (Pune) for layout consultation if needed

**Phase 2: Flex PCB Prototyping (Flat flex test coupons)**
- Fabrication: JLCPCB or PCBWay for standard flat flex PCBs
- Alternative: MRK Electronics (Pune) for simple single-layer flex
- Assembly: Alfa Electronics (Pune)

**Phase 3: Helical Flex PCB Prototyping**
- Fabrication: JLCPCB/PCBWay with custom DFM consultation, or AS&R Circuits (Gujarat) for India-based flex expertise
- Mechanical wrapping: in-house with custom jig
- Assembly: components populated on flat flex before wrapping; Alfa Electronics (Pune) for placement

**Phase 4: Production Transition**
- Evaluate AS&R Circuits (Gujarat) or MRK Electronics (Pune) for domestic production
- Cost-quality trade-off analysis vs. continuing with Chinese fabrication

---

## Relevance to Project

| Constraint | Local (Pune) Capability | India (National) | China (JLCPCB/PCBWay) |
|---|---|---|---|
| Rigid PCB prototyping | Strong (Rapid Circuit, MRK) | Strong | Excellent, cheapest |
| Flex PCB fabrication (standard) | Limited (MRK only) | Good (AS&R, PCB Power) | Excellent, cheapest |
| Flex PCB fabrication (helical) | None identified | Unlikely without DFM eng. | Possible with custom consultation |
| SMT assembly (0201, fine pitch) | Strong (Alfa Electronics) | Strong | Strong (JLCPCB PCBA) |
| Rapid turnaround (<7 days) | Yes (no shipping) | 7-14 days | 5-14 days (with shipping) |
| Face-to-face DFM consultation | Yes | Possible (Gujarat trip) | No (remote only) |
| Component sourcing | Available (MRK) | Available | Integrated (JLCPCB parts) |

## Open Questions

1. **MRK Electronics flex capability depth:** What polyimide thicknesses can they handle? Can they do adhesive-less construction? What is their minimum trace/space on flex? An in-person visit with our design files is needed.
2. **Alfa Electronics fine-pitch limits:** They claim 0201 and 12 mil pitch. Can they handle QFN packages with exposed ground pads? What reflow profiles do they support? Request a test assembly.
3. **AS&R Circuits helical feasibility:** Contact their engineering team (leveraging ASC USA expertise) to discuss whether they can fabricate a flex PCB designed for helical wrapping. Send them preliminary Gerber files and mechanical drawings.
4. **JLCPCB flex PCB with stiffeners:** Can JLCPCB add local polyimide stiffeners behind component pads on a flex PCB? This is critical for components that must survive the wrapping process.
5. **Customs and import duty:** What are the current duties on PCBs imported from China to India? Factor this into cost comparison.
6. **Component sourcing locally:** Can MRK or Alfa source the specific sensor ICs we need (LSM6DSL, nRF52-series, etc.), or do we need to order from Mouser/DigiKey and ship to the assembler?
7. **Pune vendor NDA willingness:** Will local vendors sign NDAs for our design files? Important for IP protection during prototyping.

## Recommendations

1. **Visit MRK Electronics and Alfa Electronics in person** with preliminary design files. Assess their facilities, equipment, and willingness to work on experimental flex PCB geometries. Prioritize Alfa for assembly partnership.
2. **Use JLCPCB for all flex PCB fabrication** in the prototype phase. Their pricing, quality, and online tooling are unmatched for small-batch flex orders. Accept the 5-14 day turnaround.
3. **Use Rapid Circuit or MRK for rigid PCB prototypes** to take advantage of local turnaround (no shipping delay). Reserve JLCPCB for flex boards only.
4. **Contact AS&R Circuits in Gujarat** for a DFM review of the helical flex PCB design. They have the most advanced flex capability in India and access to ASC USA's engineering expertise. This is the highest-priority manufacturing inquiry.
5. **Engage FPGA Tech Solution for PCB layout review** if the flex PCB requires high-speed routing (2.4 GHz antenna traces, impedance matching). Their local presence enables iterative design reviews.
6. **Budget for the helical flex PCB prototype at 5-10x standard flex pricing.** The non-standard geometry, DFM consultation, and likely multiple iterations will be significantly more expensive than catalog flex orders. Estimate $50-200 per prototype board (not including assembly).

## References

1. MRK Electronics (Pune): https://www.mrkelectronics.com/
2. MRK Electronics - PCB Fabrication services: https://www.mrkelectronics.com/pcb-fabrication-in-pune.php
3. Rapid Circuit (Pune): https://rapidcircuit.in/
4. Rapid Circuit - Contact: https://rapidcircuit.in/contact-us/
5. Alfa Electronics (Pune): https://www.alfaelectronicsindia.com/
6. Alfa Electronics - Services: https://www.alfaelectronicsindia.com/services.html
7. TSIE / Tecno Systems: https://tsie.in/pcb-assembly-in-pune/
8. Ask Electronics (Pune): https://www.indiamart.com/askelectronics/
9. FPGA Tech Solution (Pune): https://fpgatechsolution.com/pcb-design/
10. AS&R Circuits India (Gujarat) - Flex PCB: https://www.ascrpcb.com/products/flexible-pcb/
11. AS&R Circuits India - Rigid-Flex: https://www.ascrpcb.com/products/rf-rigid-flex/
12. PCB Power (Gujarat) - Flex PCB: https://www.pcbpower.com/PCBFlexible
13. JLCPCB Flex PCB: https://jlcpcb.com/pcb-fabrication/flexible-pcb
14. PCBWay Flex PCB: https://www.pcbway.com/flexible.aspx
15. PCBShopper price comparison: https://pcbshopper.com/
16. Flex PCB bend radius DFM guide: https://www.allpcb.com/blog/pcb-manufacturing/bending-without-breaking-optimizing-bend-radius-in-flex-pcb-dfm.html
17. Flex PCB DFM guidelines (RushPCB): https://rushpcb.com/dfm-guidelines-for-flex-and-rigid-flex-pcbs/
18. Flexible PCB cost guide 2025: https://gekunflex.com/low-cost-flexible-pcb-manufacturing-guide/
19. Top 10 PCB manufacturers in Pune: https://www.pcba-manufacturers.com/top-10-pcb-manufacturers-in-pune/
