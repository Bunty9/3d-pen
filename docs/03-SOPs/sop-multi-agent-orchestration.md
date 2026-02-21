---
title: "SOP-0002: Multi-Agent Orchestration"
sop_id: "SOP-0002"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - orchestration
  - agents
---

# SOP-0002: Multi-Agent Orchestration

## Purpose & Scope

Defines how multiple AI agents collaborate on the 3D Pen project without conflicts. Covers agent roles, exclusive write scopes, task decomposition, handoff protocols, context passing, and quality gates.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read and understood
- [ ] Agent assigned an ID and scope by orchestrator

## Definitions

| Term | Definition |
|------|-----------|
| Agent | An AI agent instance with a specific domain assignment |
| Orchestrator | The coordinating agent that assigns tasks and resolves conflicts |
| Write Scope | The set of files/directories an agent has exclusive write access to |
| Handoff | The formal completion of a task with verified outputs |
| Quality Gate | A set of checks that MUST pass before work is accepted |

## Agent Roster

| Agent ID | Domain | Exclusive Write Scope | Primary Tools |
|----------|--------|----------------------|---------------|
| `hardware-agent` | Hardware / PCB / Sensors | `02-Research/hardware/`, `04-Tools/tools-hardware.md` | WebSearch, datasheets |
| `embedded-agent` | MCU / Firmware / Wireless | `02-Research/embedded/`, `04-Tools/tools-embedded.md` | WebSearch, SDK docs |
| `ml-agent` | ML Models / Training / Inference | `02-Research/ml/`, `04-Tools/tools-ml.md` | WebSearch, papers |
| `software-agent` | HID / Drivers / Canvas / OS Integration | `02-Research/software/`, `04-Tools/tools-software.md` | WebSearch, API docs |
| `integration-agent` | Cross-domain architecture | `01-Project/architecture.md`, `01-Project/requirements.md` | Read all domains |
| `review-agent` | Quality assurance | `06-Decisions/` | Read all files |
| `orchestrator` | Coordination / planning | `Home.md`, `01-Project/3d-pen-MOC.md`, `03-SOPs/`, `05-Plans/` | All tools |

### Scope Rules

- Each agent MUST only write to files listed in its Exclusive Write Scope
- Agents MAY read any file in the vault
- The orchestrator MAY write to any file but SHOULD delegate to domain agents
- If an agent needs to create a file outside its scope, it MUST request the orchestrator to do so

## Task Decomposition Methodology

### Step 1: Gap Identification

The orchestrator reviews the current vault state and identifies:
- Missing research areas
- Incomplete notes (stubs)
- Unanswered open questions from existing notes
- Cross-domain interface gaps

### Step 2: Task Creation

For each gap, the orchestrator creates a task with:
- **Task ID**: Sequential identifier
- **Agent**: Assigned agent ID
- **Target files**: Files to create or update
- **Read-first list**: Files the agent MUST read before starting
- **Constraints**: Word count, depth requirements, specific questions to answer
- **Dependencies**: Other tasks that must complete first

### Step 3: Parallel Execution

- Tasks with no dependencies MAY execute in parallel
- Each parallel agent receives its task via the Context Passing Template (below)
- Agents MUST NOT coordinate with each other directly — all coordination goes through the orchestrator

## Context Passing Template

When launching an agent, the orchestrator MUST provide context in this structure:

```json
{
  "agent_id": "hardware-agent",
  "task": "Research flex PCB design for helical wrapping in cylindrical pen bodies",
  "target_files": [
    "docs/02-Research/hardware/flex-pcb-design.md"
  ],
  "read_first": [
    "docs/03-SOPs/sop-vault-contribution.md",
    "docs/03-SOPs/sop-hardware-agent.md",
    "docs/08-Templates/_research-note.md",
    "docs/01-Project/vision.md",
    "docs/01-Project/requirements.md"
  ],
  "constraints": {
    "min_references": 3,
    "use_template": "_research-note.md",
    "focus_areas": ["bend radius", "polyimide options", "manufacturing"],
    "project_constraints": ["2.5mm annular gap", "helical wrap", "150mm length"]
  }
}
```

## Handoff Protocol

When an agent completes a task, it MUST:

1. **Verify frontmatter** — all MUST fields present and valid per [[sop-vault-contribution|SOP-0001]]
2. **Verify links** — all `[[wikilinks]]` point to existing or planned notes
3. **Update MOC** — append link to `[[01-Project/3d-pen-MOC|3D Pen MOC]]` in the correct domain section
4. **List follow-ups** — document any open questions, discovered gaps, or cross-domain issues
5. **Report completion** — return structured summary:

```
## Task Complete: {task_id}
- Files created: [list]
- Files updated: [list]
- Follow-ups: [list of open items]
- Cross-domain issues: [any interface conflicts or questions]
```

## Quality Gates

Every deliverable MUST pass these gates before being accepted:

| Gate | Check | Enforced By |
|------|-------|-------------|
| QG-1: Frontmatter | Valid YAML, all MUST fields, enum values correct | review-agent |
| QG-2: Links | No broken `[[wikilinks]]`, external URLs reachable | review-agent |
| QG-3: Depth | Research notes have ≥3 references, substantive content (not stubs) | review-agent |
| QG-4: Integration | Interface points align across domains | integration-agent |
| QG-5: Consistency | No contradictions between domain research notes | integration-agent |

## Conflict Resolution

When contradictions are found between domain agents' outputs:

1. The integration-agent documents the conflict in `06-Decisions/` using [[_decision-log|Decision Log Template]]
2. Both conflicting positions are recorded with evidence
3. The orchestrator makes the final decision based on project constraints
4. The resolution is linked back to both original research notes

## Input / Output Contract

### Inputs

| Input | Source | Format |
|-------|--------|--------|
| Task assignment | Orchestrator | Context Passing Template (JSON) |
| SOPs | `03-SOPs/` | Markdown |
| Templates | `08-Templates/` | Markdown |

### Outputs

| Output | Destination | Format |
|--------|-------------|--------|
| Research notes | Domain `02-Research/` folder | Template-compliant markdown |
| Completion report | Orchestrator | Structured summary |
| Follow-up items | Orchestrator | List |

## Quality Checklist

- [ ] Agent assigned correct ID and scope
- [ ] Context template fully populated before launch
- [ ] Agent only writes within assigned scope
- [ ] Handoff protocol followed on completion
- [ ] All quality gates pass
- [ ] Conflicts documented in decision log

## Handoff Protocol

After orchestration round completes:
1. Integration-agent reviews all new notes
2. Review-agent validates quality gates
3. Orchestrator updates `Home.md` and `3d-pen-MOC.md`
4. Orchestrator identifies next round of tasks

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
