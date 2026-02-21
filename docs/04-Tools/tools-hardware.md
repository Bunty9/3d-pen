---
title: "Hardware Tools Evaluation"
domain: "hardware"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "hardware-agent"
tags:
  - tool-evaluation
  - hardware
---

## Summary

This document evaluates the key hardware design tools for the 3D Pen project, covering PCB/schematic design (KiCad 8, Altium Designer), circuit simulation (LTspice, ngspice), mechanical CAD (Fusion 360, FreeCAD, OpenSCAD), and PCB manufacturing DFM tools (JLCPCB, PCBWay). Each tool is assessed for capabilities relevant to our specific needs: flex PCB design, tight-tolerance cylindrical enclosure modeling, analog circuit simulation for sensor interfaces, and manufacturability checking for prototype and production runs.

---

## 1. KiCad 8+ (Flex PCB Design)

### Overview

| Attribute | Details |
|---|---|
| Category | EDA / PCB Design |
| License | Open source (GPLv3) |
| Platform | Windows, macOS, Linux |
| Current Version | KiCad 8.x (2024-2025) |
| Cost | Free |
| Website | https://www.kicad.org/ |

### Key Features for 3D Pen Project

- **Flex PCB stack-up definition:** KiCad 8 includes predefined flex stack-ups and supports fully custom user-defined layer configurations. Material properties (dielectric constant, loss tangent) for polyimide substrates can be configured.
- **Bend radius DRC:** The design rule checker can enforce minimum bend radius constraints based on stack-up materials and copper weight, ensuring the design will survive the helical wrap without trace cracking.
- **Flex/rigid zone delineation:** Keepout layers distinguish rigid (stiffened) areas from flex areas, preventing component placement in bend zones.
- **3D visualization:** The 3D viewer supports STEP model import for components, enabling visual verification of clearances and mechanical fit before ordering.
- **Gerber/drill output:** Standard fabrication file generation compatible with all major flex PCB manufacturers.
- **Schematic capture:** Full hierarchical schematic editor with good symbol libraries covering most of our target components (ICM-42688-P, BQ51003, nRF series MCUs).

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI tools | YES | `kicad-cli` for BOM export, DRC, Gerber generation, 3D export |
| Python scripting | YES | `pcbnew` Python API for programmatic layout manipulation |
| Plugin system | YES | Action plugins for custom DRC rules, automated layout tasks |
| CI/CD integration | YES | KiBot for automated Gerber generation, BOM, and documentation |
| MCP server | NO | No official MCP server; could be built on top of Python API |

### Pros

- Free and open source -- no licensing cost barrier for the project
- Active development community with major improvements in each release
- Good flex PCB support for our complexity level (2-layer flex, single bend zone)
- Python scripting enables automation of repetitive layout tasks
- KiBot CI/CD tool can automate documentation and manufacturing file generation
- STEP export allows mechanical verification in Fusion 360
- Native support for component libraries from major distributors (DigiKey, LCSC)

### Cons

- Flex PCB support is functional but not as mature as Altium's -- no dynamic bend simulation or animated fold visualization
- Limited MCAD integration compared to Altium (no bidirectional sync with SolidWorks/Fusion 360)
- Rigid-flex designs with multiple flex regions require more manual effort
- No integrated signal integrity / impedance analysis (requires external tools)
- The 3D viewer cannot simulate the bent/folded state of the flex PCB -- must verify manually or in MCAD
- Some advanced flex PCB features (teardrops at pad transitions, flex-specific via tenting) require plugins or manual work

### Verdict: **ADOPT**

KiCad 8 is the recommended primary EDA tool for the 3D Pen project. Its flex PCB capabilities are sufficient for our 2-layer flex design, the cost is zero, and the Python API enables automation. The lack of dynamic bend simulation is a gap, but can be mitigated by validating the bent geometry in Fusion 360 using the STEP export. For a small team or solo developer, KiCad's capabilities-to-cost ratio is unbeatable.

---

## 2. Altium Designer

### Overview

| Attribute | Details |
|---|---|
| Category | EDA / PCB Design (Professional) |
| License | Commercial (subscription) |
| Platform | Windows only |
| Current Version | Altium Designer 24+ |
| Cost | ~$7,500/year (standard), ~$350/year (student) |
| Website | https://www.altium.com/altium-designer |

### Key Features for 3D Pen Project

- **Advanced rigid-flex design:** Dynamic stack-up management for flex and rigid sections, 3D bend simulation showing the PCB in its folded/bent state, and customized design rules for flex regions.
- **3D bend simulation:** Altium can animate the flex PCB bending, showing how it looks when wrapped -- directly relevant to our helical design. This is a feature KiCad lacks.
- **MCAD integration:** Bidirectional sync with SolidWorks, PTC Creo, Autodesk Inventor, Fusion 360, and Siemens NX. Changes in the mechanical model reflect in the PCB layout and vice versa.
- **Signal integrity analysis:** Built-in impedance calculation and signal integrity tools for high-speed traces (useful for the 8kHz SPI bus to IMUs).
- **Component management:** Altium 365 cloud-based component library with real-time supply chain data (pricing, stock, lifecycle status).

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI tools | Limited | Some command-line export capabilities |
| Scripting | YES | Delphi/JavaScript scripting engine for automation |
| REST API | YES (Altium 365) | Cloud-based API for project management and data access |
| CI/CD | YES (Altium 365) | Automated manufacturing output generation |
| MCP server | NO | No MCP server available |

### Pros

- Industry gold standard for rigid-flex PCB design
- 3D bend simulation is uniquely valuable for our helical flex PCB geometry
- Deep MCAD integration enables coordinated mechanical-electrical design
- Comprehensive signal integrity and impedance tools
- Large community, extensive documentation, manufacturer support
- Component supply chain intelligence built in

### Cons

- Very expensive ($7,500/year) -- a significant cost for an early-stage project
- Windows-only -- limits team members on macOS/Linux
- Overkill for a 2-layer flex PCB with moderate routing complexity
- Steep learning curve for a team not already using Altium
- Subscription model means ongoing cost even during low-activity phases

### Verdict: **ASSESS**

Altium Designer is the technically superior choice for flex PCB design, especially for the 3D bend simulation that would directly validate our helical wrap geometry. However, the cost ($7,500/year) is difficult to justify for an early-stage project with a single flex PCB. Recommended action: assess Altium if the project reaches a stage where rigid-flex or multi-flex-zone designs are needed, or if the team grows to include engineers already proficient in Altium. For now, KiCad + Fusion 360 for mechanical validation provides 90% of the capability at zero EDA cost.

---

## 3. LTspice

### Overview

| Attribute | Details |
|---|---|
| Category | Circuit Simulation (SPICE) |
| License | Freeware (proprietary, Analog Devices) |
| Platform | Windows, macOS, Linux (via Wine) |
| Current Version | LTspice XVII / 24.x |
| Cost | Free |
| Website | https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html |

### Key Features for 3D Pen Project

- **Analog sensor interface simulation:** Simulate the FSR voltage divider circuit, piezo film signal conditioning, and capacitive touch electrode behavior before PCB layout.
- **Power supply design:** Simulate the BQ51003 wireless charging receiver output, BQ25100 charger behavior, and LDO/buck regulator for MCU power rail.
- **No node/component limits:** Unlike some free SPICE tools, LTspice has no artificial restrictions on circuit size or simulation features.
- **SMPS optimization:** Enhanced models for switched-mode power supplies, useful if a buck converter is used for power regulation.
- **Waveform viewer:** Integrated plotting tool for time-domain, frequency-domain, and noise analysis.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI / batch mode | YES | Can run simulations from command line with `.asc` files |
| Scripting | Limited | No built-in scripting; can parse output `.raw` files with Python |
| Python integration | YES (community) | PyLTSpice library for programmatic simulation control |
| MCP server | NO | No MCP server |

### Pros

- Free with no restrictions -- best-in-class for zero cost
- Extensive built-in component library, especially for Analog Devices and (legacy) Linear Technology parts
- Fastest SPICE engine for large circuit simulation
- Excellent for power electronics and switch-mode supply simulation
- Wide community support; many reference circuits available
- Batch simulation via command line enables automated parameter sweeps

### Cons

- User interface is dated and non-intuitive for beginners
- macOS and Linux support is limited (native on macOS but historically buggy; Linux via Wine)
- Component models from other vendors may need manual import
- Newer LTspice `.sub` model files are encrypted binary -- not compatible with other SPICE tools
- No integrated schematic-to-PCB flow (must export netlist to KiCad separately)
- No formal API; automation requires workarounds

### Verdict: **ADOPT**

LTspice is the recommended circuit simulation tool. It is free, unrestricted, and the industry standard for analog and power circuit simulation. For the 3D Pen project, it will be used to simulate sensor signal conditioning circuits, power supply design, and validate component selections before committing to PCB layout. The dated UI is a minor inconvenience outweighed by simulation capability.

---

## 4. ngspice

### Overview

| Attribute | Details |
|---|---|
| Category | Circuit Simulation (SPICE) |
| License | Open source (BSD) |
| Platform | Windows, macOS, Linux |
| Current Version | ngspice 43+ (2024-2025) |
| Cost | Free |
| Website | https://ngspice.sourceforge.io/ |

### Key Features for 3D Pen Project

- **KiCad integration:** ngspice is the built-in SPICE simulator in KiCad's schematic editor. Schematics designed in KiCad can be simulated directly without exporting to a separate tool.
- **Mixed-signal simulation:** Supports both analog and digital simulation; digital event-driven simulation is claimed to be 50x faster than analog.
- **Model compatibility:** Generally compatible with PSPICE, HSPICE, and many LTspice models (except encrypted `.sub` files).
- **Open source:** Full source code access; can be modified or extended for custom simulation needs.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI | YES | Full command-line operation; reads SPICE netlists directly |
| Scripting | YES | Tcl scripting for simulation control; Python bindings available |
| KiCad integration | YES | Built into KiCad's simulation workflow |
| MCP server | NO | No MCP server |

### Pros

- Open source and fully cross-platform
- Integrated into KiCad -- simulate directly from schematic without export
- Scriptable via Tcl and Python for automated testing
- Good model compatibility with industry-standard SPICE formats
- Active development with regular releases

### Cons

- No graphical schematic capture (command-line / file-based input when used standalone)
- Waveform viewer is basic compared to LTspice
- Fewer built-in component models than LTspice
- Cannot read encrypted LTspice model files
- Smaller community and fewer reference circuits available online
- Simulation performance can be slower than LTspice for complex analog circuits

### Verdict: **TRIAL**

ngspice is recommended as a secondary simulation tool, used primarily through its KiCad integration for quick "in-editor" simulations during PCB design. For complex analog simulations (power supply, sensor signal chain), LTspice remains the primary tool. The trial period should determine whether the KiCad-ngspice workflow is efficient enough to replace LTspice for routine simulations.

---

## 5. Fusion 360

### Overview

| Attribute | Details |
|---|---|
| Category | Mechanical CAD / CAM / CAE |
| License | Commercial (subscription); free for personal/startup use |
| Platform | Windows, macOS (cloud-based) |
| Current Version | Fusion 360 (2025) |
| Cost | $680/year (commercial); free (personal hobbyist) |
| Website | https://www.autodesk.com/products/fusion-360 |

### Key Features for 3D Pen Project

- **Parametric 3D modeling:** Design the pen shell, inner structure, nib mechanism, and all mechanical components with full parametric history. Change the outer diameter from 11mm to 12mm and all dependent features update automatically.
- **Assembly modeling:** Model the complete pen assembly with all components to verify fit, clearances, and assembly sequence. Critical for validating the 2.5mm radial gap allocation.
- **Simulation:** Built-in thermal simulation (for charging heat analysis), structural simulation (for drop/shock analysis), and modal analysis. Adequate for preliminary validation before physical testing.
- **Integrated electronics:** Fusion 360 includes basic schematic and PCB layout capabilities (EAGLE heritage). While not recommended as the primary EDA tool, the ECAD-MCAD integration allows importing KiCad board outlines and component positions.
- **3D printing export:** Direct export to STL/3MF for prototype shell printing. Includes slicing and print preparation tools.
- **Manufacturing preparation:** CAM workspace for generating CNC tool paths if machining aluminum shells.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI | Limited | Fusion 360 is primarily GUI-based |
| API | YES | Extensive Python/C++ API for automation within Fusion 360 |
| Scripting | YES | Python scripts (add-ins) for custom features, export automation |
| Cloud API | YES | Forge/APS API for cloud-based access to designs |
| MCP server | NO | No MCP server; API access is through Autodesk Platform Services |

### Pros

- All-in-one CAD/CAM/CAE platform -- design, simulate, and manufacture from one tool
- Parametric modeling is essential for iterative pen shell design
- Free for personal / hobbyist / startup use (revenue < $100K/year)
- Excellent 3D printing workflow for rapid prototyping
- STEP file import from KiCad for ECAD-MCAD coordination
- Cloud-based collaboration; design files accessible from any machine
- Extensive tutorials and community for mechanical enclosure design

### Cons

- Cloud-dependency: requires internet connection; design files stored on Autodesk servers
- Free tier has feature limitations (reduced export formats, simulation limits)
- Learning curve is moderate; more complex than Tinkercad or OpenSCAD for simple parts
- Commercial license at $680/year adds cost for a small project
- Performance can be slow for complex assemblies on older hardware

### Verdict: **ADOPT**

Fusion 360 is the recommended mechanical CAD tool for the 3D Pen project. Its parametric modeling, assembly verification, simulation capabilities, and 3D printing workflow are all directly relevant to our needs. The free personal-use license eliminates cost barriers during the prototype phase. The STEP import from KiCad enables the critical ECAD-MCAD coordination needed to verify that the flex PCB and components fit within the pen shell.

---

## 6. FreeCAD

### Overview

| Attribute | Details |
|---|---|
| Category | Mechanical CAD (Parametric) |
| License | Open source (LGPL) |
| Platform | Windows, macOS, Linux |
| Current Version | FreeCAD 0.22+ / 1.0 (2025) |
| Cost | Free |
| Website | https://www.freecad.org/ |

### Key Features for 3D Pen Project

- **Parametric modeling:** Full parametric constraint-based modeling similar to Fusion 360 and SolidWorks. Suitable for pen shell and mechanism design.
- **Assembly workbench:** Assembly3 or A2plus workbenches provide assembly modeling (though less polished than Fusion 360).
- **FEM workbench:** Finite element analysis for structural and thermal simulation using CalculiX solver.
- **Open source and offline:** No cloud dependency; all files stored locally. Full source code access for customization.
- **KiCad integration:** The KicadStepUp workbench imports KiCad PCB layouts as 3D models into FreeCAD for mechanical verification.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI | YES | `freecadcmd` for headless operation and batch processing |
| Python API | YES | Extensive Python scripting; FreeCAD is essentially a Python application |
| Macro system | YES | Record and replay GUI actions as Python scripts |
| MCP server | NO | No MCP server; Python API could be wrapped |

### Pros

- Completely free and open source -- no licensing concerns of any kind
- Fully offline -- no cloud dependency or internet requirement
- Native Linux support (unlike Fusion 360 which requires Windows/macOS)
- Strong Python scripting and automation capabilities
- KicadStepUp workbench provides good KiCad integration
- Modular architecture allows adding custom workbenches

### Cons

- User interface is less polished and less intuitive than Fusion 360
- Steeper learning curve, especially for assembly modeling
- FEM simulation capabilities are less mature than Fusion 360
- Topological naming problem (historically) can cause feature tree instability, though FreeCAD 1.0 addresses this
- Smaller community and fewer tutorials specifically for electronics enclosure design
- No integrated CAM workspace (requires separate tool for CNC path generation)

### Verdict: **TRIAL**

FreeCAD is a viable alternative to Fusion 360, especially valuable for team members on Linux or those who prefer fully offline, open-source tools. The KicadStepUp integration is a strong point. However, Fusion 360's superior UI, simulation, and CAM capabilities make it the primary choice. FreeCAD should be trialed as a secondary MCAD tool -- if FreeCAD 1.0's improvements resolve historical usability issues, it could replace Fusion 360 for team members who prefer open-source tooling.

---

## 7. OpenSCAD

### Overview

| Attribute | Details |
|---|---|
| Category | Programmatic 3D CAD |
| License | Open source (GPLv2) |
| Platform | Windows, macOS, Linux |
| Current Version | OpenSCAD 2024.12+ |
| Cost | Free |
| Website | https://openscad.org/ |

### Key Features for 3D Pen Project

- **Code-driven modeling:** Define geometry using a scripting language rather than interactive GUI. Ideal for parametric designs that need programmatic variation (e.g., generating shell variants at 11, 11.5, and 12mm diameters from a single script).
- **Parametric by nature:** Every dimension is a variable; changing one value regenerates the entire model. Excellent for design exploration and generating families of parts.
- **Lightweight:** Minimal resource requirements; runs on any machine.
- **Reproducible designs:** Scripts are plain text files that can be version-controlled in git, diffed, and reviewed like code.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| CLI | YES | `openscad -o output.stl input.scad` for headless rendering |
| Scripting | YES | The modeling language IS the scripting interface |
| Parameterization | YES | Variables defined in scripts; easily automated |
| CI/CD | YES | Can generate STL files in CI pipelines for automated prototyping |
| MCP server | NO | No MCP server; CLI interface is sufficient for automation |

### Pros

- Scripts are version-controllable in git -- perfect for design iteration tracking
- CLI-first workflow is ideal for agent-driven automation
- Parametric variants can be generated automatically (batch export of multiple sizes)
- Zero learning curve for software developers (code-based, not GUI-based)
- Extremely lightweight; runs anywhere
- Perfect for jigs, fixtures, and simple mechanical parts

### Cons

- Not suitable for complex organic shapes or ergonomic surfaces
- No assembly modeling
- No simulation (FEA, thermal, etc.)
- No STEP export (only STL/AMF/3MF) -- limits interoperability with professional MCAD tools
- Visualization is basic; no rendering or realistic preview
- No ECAD integration
- Manual boolean operations for complex assemblies are tedious

### Verdict: **TRIAL**

OpenSCAD fills a niche role: generating parametric test fixtures, jigs, and simple enclosure variants programmatically. It is NOT suitable as the primary MCAD tool for the pen enclosure design (too limited for the required assembly modeling and simulation). However, its CLI-driven, code-based workflow makes it uniquely useful for automating the generation of 3D-printed test parts (e.g., a script that generates cylindrical shells at 11, 11.5, and 12mm diameters for ergonomic testing). Trial it for this specific use case.

---

## 8. JLCPCB DFM Tool (JLCDFM)

### Overview

| Attribute | Details |
|---|---|
| Category | PCB DFM (Design for Manufacturing) Check |
| License | Free (web-based) |
| Platform | Browser-based (any OS) |
| Website | https://jlcdfm.com/ |
| Integration with | JLCPCB manufacturing |

### Key Features for 3D Pen Project

- **One-click Gerber analysis:** Upload Gerber files and get automated manufacturability analysis across 5 modules: traces, solder mask, drilling, silkscreen, and component assembly.
- **BOM matching:** Automatically matches BOM and CPL files against JLCPCB's assembly parts library, identifying component availability and alternatives.
- **Real-time feedback:** Results returned immediately without waiting for manual review by fab engineers.
- **Flex PCB rules:** Checks trace width/spacing against JLCPCB's flex PCB capabilities (2/2mil minimum with LDI).
- **Free to use:** No cost; accessible from any browser.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| Web interface | YES | Browser-based; can be automated with browser automation tools |
| API | NO | No public API for automated DFM checks |
| CLI | NO | No command-line interface |
| CI/CD integration | NO | Would require browser automation to integrate |

### Pros

- Free and instant -- no waiting for manual DFM review
- Catches common manufacturing issues before ordering, saving time and money
- BOM matching against JLCPCB's parts library is valuable for assembly orders
- Specific to JLCPCB's actual capabilities -- results accurately predict manufacturability
- Web-based; accessible from any platform

### Cons

- Specific to JLCPCB -- results may not apply to other manufacturers
- No public API for automation; requires manual browser interaction
- Limited to JLCPCB's manufacturing rules; may not catch issues specific to other fabs
- Cannot simulate flex PCB bending or mechanical stress
- No integration with KiCad or other EDA tools (must export Gerber first)

### Verdict: **ADOPT**

JLCDFM should be used as a mandatory pre-order check before every JLCPCB fabrication order. It catches manufacturing issues that the KiCad DRC may miss (JLCPCB-specific rules). The zero cost and instant feedback make it a no-brainer addition to the design-to-manufacture workflow.

---

## 9. PCBWay DFM Tools

### Overview

| Attribute | Details |
|---|---|
| Category | PCB DFM (Design for Manufacturing) Check |
| License | Free (integrated into order flow) |
| Platform | Browser-based |
| Website | https://www.pcbway.com/ |
| Integration with | PCBWay manufacturing |

### Key Features for 3D Pen Project

- **Order-integrated DFM:** DFM checking is performed automatically when Gerber files are uploaded during the ordering process. Issues are flagged before payment.
- **Advanced flex capabilities:** PCBWay supports up to 16-layer rigid-flex with 2/2mil trace/space and 4mil minimum via, providing a growth path beyond JLCPCB's 4-layer flex limit.
- **Engineering review:** For complex orders (like flex PCBs), PCBWay assigns a dedicated engineer to review the design and communicate potential issues.
- **Design rule documentation:** Comprehensive published manufacturing tolerances and capabilities for reference during layout.

### Agent Integration (CLI / API / MCP)

| Integration | Availability | Notes |
|---|---|---|
| Web interface | YES | Integrated into order flow |
| API | NO | No public DFM API |
| CLI | NO | No command-line tools |

### Pros

- Human engineering review for complex flex PCB orders -- provides expert feedback
- Broader flex PCB capabilities than JLCPCB (more layers, rigid-flex)
- Published manufacturing tolerances are detailed and useful for DRC rule setup in KiCad
- Good track record with FPC products for medical and consumer electronics

### Cons

- DFM check is less automated than JLCDFM -- more manual process
- No standalone DFM tool; must initiate an order to get full review
- Slightly higher pricing than JLCPCB for simple flex PCBs
- Longer lead times (5-7 days vs 4-5 for JLCPCB)

### Verdict: **TRIAL**

PCBWay should be trialed as an alternative flex PCB manufacturer, especially when designs move to rigid-flex or require more than 4 layers. For initial 2-layer flex prototypes, JLCPCB is the recommended primary manufacturer due to lower cost and faster turnaround. PCBWay becomes the recommended choice if the design evolves to rigid-flex in later iterations.

---

## Summary Matrix

| Tool | Category | Cost | Flex PCB | CLI/API | Verdict |
|---|---|---|---|---|---|
| **KiCad 8+** | EDA / PCB Design | Free | Good | YES | **ADOPT** |
| **Altium Designer** | EDA / PCB Design | $7,500/yr | Excellent | Limited | **ASSESS** |
| **LTspice** | Circuit Simulation | Free | N/A | YES | **ADOPT** |
| **ngspice** | Circuit Simulation | Free | N/A | YES | **TRIAL** |
| **Fusion 360** | Mechanical CAD | Free / $680/yr | N/A | YES | **ADOPT** |
| **FreeCAD** | Mechanical CAD | Free | N/A | YES | **TRIAL** |
| **OpenSCAD** | Programmatic CAD | Free | N/A | YES | **TRIAL** |
| **JLCPCB DFM** | Manufacturing Check | Free | YES | NO | **ADOPT** |
| **PCBWay DFM** | Manufacturing Check | Free | YES | NO | **TRIAL** |

### Recommended Primary Toolchain

```
Schematic & PCB Layout:  KiCad 8+
Circuit Simulation:      LTspice (primary) + ngspice (via KiCad)
Mechanical CAD:          Fusion 360
Parametric Fixtures:     OpenSCAD (for jigs and test parts)
DFM Check:               JLCDFM (before every order)
PCB Fabrication:         JLCPCB (primary) / PCBWay (for rigid-flex)
```

This toolchain provides comprehensive hardware design capability at near-zero cost (all primary tools are free), with a clear upgrade path to Altium Designer if the project's PCB complexity outgrows KiCad's capabilities.
