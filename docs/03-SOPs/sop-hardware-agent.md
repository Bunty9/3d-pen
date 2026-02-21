---
title: "SOP-0004: Hardware Agent"
sop_id: "SOP-0004"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - hardware
  - agent
---

# SOP-0004: Hardware Agent

## Purpose & Scope

Defines the role, responsibilities, and procedures for the hardware domain agent. This agent covers all physical design aspects of the 3D Pen: flex PCB, sensors, wireless charging, mechanical design, antenna, and debug connectors.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read
- [ ] [[sop-research-agent|SOP-0003]] read
- [ ] [[vision|Project Vision]] read
- [ ] [[requirements|Requirements]] read

## Domain Scope

### In Scope

| Area | Details |
|------|---------|
| Flex PCB design | Helical geometry, rigid-flex vs pure flex, bend radius, polyimide, stackup |
| Sensor selection | Piezo pressure, MEMS IMU, capacitive touch — physical specs, package sizes |
| MCU physical specs | Package size, pin count, footprint (NOT firmware — see SOP-0005) |
| Wireless IC | Radio IC package, antenna design, RF layout |
| Power subsystem | Battery cell selection, wireless charging coils, charging IC |
| Mechanical design | Pen shell, screw-thread nib, refill compatibility, thermal, drop/shock |
| Debug connector | Flex PCB connector, debug board interface |

### Explicit Boundaries — NOT In Scope

| Area | Owned By |
|------|----------|
| Firmware / RTOS / sensor acquisition code | `embedded-agent` (SOP-0005) |
| ML models / training pipeline | `ml-agent` (SOP-0006) |
| Host software / drivers / canvas | `software-agent` (SOP-0007) |

## Research Priorities

In order of importance:

1. **Flex PCB geometry** — Can a helically-wrapped flex PCB work in an 11mm diameter pen? What are the manufacturing constraints? Minimum bend radius for component-populated flex?
2. **Sensor selection for 2.5mm gap** — Which piezo/FSR sensors, IMUs, and capacitive touch ICs fit in 2.5mm radial clearance? Specific part numbers with dimensions.
3. **MCU physical specs** — Which MCUs with integrated wireless fit in the cylindrical form factor? Package dimensions, thermal characteristics.
4. **Wireless IC & antenna** — PCB trace antenna on flex, helical antenna geometry, 2.4GHz design rules for flex.
5. **Power subsystem** — Cylindrical Li-ion cells ≤8mm diameter, wireless charging coil on flex PCB, charging IC selection.
6. **Mechanical design** — Shell material, nib thread design, refill insertion mechanism, IP rating considerations.

## Cross-Domain Interface Points

| Interface | With Agent | Key Questions |
|-----------|-----------|---------------|
| MCU ↔ Firmware | embedded-agent | Pin assignments, ADC channels, SPI/I2C bus allocation |
| Sensor ↔ ADC | embedded-agent | Sensor output type (analog/digital), sample rates, voltage levels |
| Antenna ↔ Protocol | embedded-agent | Antenna impedance matching, frequency band, required bandwidth |
| Charging ↔ Power firmware | embedded-agent | Charging state pins, battery monitoring interface |
| Physical layout ↔ Thermal | embedded-agent | MCU power dissipation, thermal path to shell |

## Required Tool Evaluations

The hardware agent MUST evaluate and document these tools in `04-Tools/tools-hardware.md`:
- KiCad 8+ (flex PCB design capabilities)
- Altium Designer (flex PCB — comparison)
- LTspice / ngspice (circuit simulation)
- Fusion 360 / FreeCAD / OpenSCAD (mechanical CAD)
- JLCPCB / PCBWay DFM tools (flex PCB manufacturing)

## Procedure

1. Read all prerequisite docs
2. For each research priority, follow [[sop-research-agent|SOP-0003]] methodology
3. Create research notes in `02-Research/hardware/` using [[_research-note|Research Note Template]]
4. Document tool evaluations in `04-Tools/tools-hardware.md`
5. Update [[01-Project/3d-pen-MOC|MOC]] with links to new notes
6. Complete handoff per [[sop-multi-agent-orchestration|SOP-0002]]

## Quality Checklist

- [ ] All research notes have specific part numbers with dimensions
- [ ] Flex PCB research includes manufacturing feasibility assessment
- [ ] Every component recommendation fits within 2.5mm annular gap
- [ ] Power budget estimated for hardware subsystems
- [ ] Cross-domain interfaces documented
- [ ] Tool evaluations completed

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
