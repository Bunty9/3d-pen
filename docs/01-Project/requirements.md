---
title: "3D Pen — Requirements"
domain: "integration"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - requirements
  - integration
  - specifications
related:
  - "[[01-Project/vision]]"
  - "[[01-Project/architecture]]"
---

# 3D Pen — Requirements

## Functional Requirements

| ID | Requirement | Priority | Domain | Notes |
|----|------------|----------|--------|-------|
| FR-001 | Pen MUST stream all sensor data at ~8kHz polling rate | Critical | Embedded | 6 sensor channels × 8kHz × 16-bit = ~768kbps minimum |
| FR-002 | Pen MUST accept standard gel pen refills (110mm x 6mm) | Critical | Hardware | Common refill compatibility |
| FR-003 | Host software MUST register pen as OS-level input device | Critical | Software | HID digitizer, not mouse |
| FR-004 | ML model MUST translate sensor stream to 2D stroke coordinates | Critical | ML | Real-time inference |
| FR-005 | Pen MUST include piezo pressure sensor behind nib | High | Hardware | ~40mm sensing zone |
| FR-006 | Pen MUST include 2x 3D IMUs (one at each end) | High | Hardware | Position + orientation |
| FR-007 | Pen MUST include capacitive touch strip for multifunction buttons | High | Hardware | Along pen body |
| FR-008 | Pen MUST support wireless charging | High | Hardware | Qi-style, coils on flex PCB |
| FR-009 | Pen MUST provide haptic feedback | Medium | Hardware | Low-energy haptics |
| FR-010 | Host MUST support Windows, macOS, and Linux | Medium | Software | Cross-platform |
| FR-011 | System MUST support training from sensor session + paper scan pairs | Medium | ML | Ground truth labeling |
| FR-012 | Pen nib end MUST unscrew for refill insertion | Medium | Hardware | User-serviceable |
| FR-013 | System SHOULD support OTA firmware updates | Low | Embedded | Over wireless |
| FR-014 | System SHOULD support handwriting/character recognition | Low | ML | Future phase |

## Non-Functional Requirements

| ID | Requirement | Target | Domain | Notes |
|----|------------|--------|--------|-------|
| NFR-001 | All electronics MUST fit within 2.5mm annular gap | 2.5mm radial | Hardware | Between refill and outer shell |
| NFR-002 | End-to-end latency MUST be imperceptible | <20ms target | All | Sensor → digital canvas |
| NFR-003 | Battery MUST last a full day of active use | ≥8 hours | Hardware/Embedded | Active writing sessions |
| NFR-004 | Pen weight MUST feel natural | <30g target | Hardware | Including battery |
| NFR-005 | Stroke reconstruction accuracy | <1mm error | ML | Sub-millimeter goal |
| NFR-006 | Wireless range | ≥1m reliable | Embedded | Desktop use case |
| NFR-007 | ML inference latency | <10ms | ML | Per inference step |
| NFR-008 | Pen length | ~150mm | Hardware | Standard pen feel |
| NFR-009 | Pen outer diameter | ~11mm | Hardware | Comfortable grip |

## Constraints

| ID | Constraint | Impact |
|----|-----------|--------|
| C-001 | Flex PCB must wrap helically around inner shell | Limits component height, dictates layout geometry |
| C-002 | No computation on pen — pure sensor streaming | All intelligence on host, simplifies firmware |
| C-003 | Wireless protocol must match sensor resolution | ~768kbps sustained throughput at minimum |
| C-004 | Standard gel pen refill compatibility | Fixed inner dimensions (110mm x 6mm) |
| C-005 | Wireless charging coils on flex PCB | Copper trace coils, geometry must align when wrapped |

## Traceability

> This section will be updated by the integration-agent after domain research is complete,
> linking each requirement to the research notes that inform its feasibility and specification.

| Requirement | Research Notes |
|------------|----------------|
| FR-001 | [[02-Research/embedded/wireless-protocols]], [[02-Research/embedded/mcu-selection]] |
| FR-002 | [[02-Research/hardware/mechanical-design]] |
| FR-003 | [[02-Research/software/hid-protocol]], [[02-Research/software/os-input-registration]] |
| FR-004 | [[02-Research/ml/sensor-fusion-models]], [[02-Research/ml/realtime-inference]] |
| NFR-001 | [[02-Research/hardware/flex-pcb-design]], [[02-Research/hardware/sensor-selection]] |
| NFR-002 | [[02-Research/embedded/wireless-protocols]], [[02-Research/ml/realtime-inference]] |
