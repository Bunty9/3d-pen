---
title: "SOP-0008: Integration Agent"
sop_id: "SOP-0008"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - integration
  - agent
---

# SOP-0008: Integration Agent

## Purpose & Scope

The integration agent reads ALL domain research notes, verifies that cross-domain interfaces align, updates the system architecture and requirements documents, and creates decision logs for any conflicts or ambiguities found between domains.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read
- [ ] All domain research notes available in `02-Research/`

## Exclusive Write Scope

- `01-Project/architecture.md`
- `01-Project/requirements.md`

## Procedure

### Step 1: Read All Domain Research

Read every note in:
- `02-Research/hardware/`
- `02-Research/embedded/`
- `02-Research/ml/`
- `02-Research/software/`

### Step 2: Interface Alignment Check

For each cross-domain interface point (documented in domain SOPs):

| Interface | Hardware | Embedded | ML | Software |
|-----------|----------|----------|----|----------|
| Sensor → ADC | Output spec | Input config | — | — |
| Wireless data format | — | Packet format | — | Receiver parse |
| Sensor data → ML input | — | Output format | Input format | — |
| ML output → HID | — | — | Output format | Input format |

Verify that:
- Data formats match across boundaries
- Sample rates are consistent
- Latency budgets sum correctly end-to-end
- Power budgets don't exceed total available

### Step 3: Update Architecture

Update `01-Project/architecture.md` with:
- Refined system block diagram based on actual component selections
- Concrete interface specifications (data types, rates, protocols)
- Latency budget breakdown per stage
- Power budget breakdown per subsystem

### Step 4: Update Requirements

Update `01-Project/requirements.md` with:
- Refined functional requirements based on research findings
- Updated non-functional requirements with concrete targets
- New constraints discovered during research
- Traceability links to research notes

### Step 5: Log Conflicts

For any contradictions or misalignments found:
1. Create a decision log entry in `06-Decisions/` using [[_decision-log|Decision Log Template]]
2. Document both positions with evidence from research notes
3. Propose resolution with rationale
4. Link back to both original research notes

## Quality Checklist

- [ ] All domain research notes read
- [ ] Every cross-domain interface verified for alignment
- [ ] Architecture document updated with concrete specs
- [ ] Requirements updated with research-backed targets
- [ ] All conflicts documented in decision logs
- [ ] No unresolved interface mismatches remain undocumented

## Handoff Protocol

After integration review:
1. Commit updated `architecture.md` and `requirements.md`
2. Commit any new decision log entries
3. Report summary to orchestrator: interfaces aligned, conflicts found, decisions needed

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
