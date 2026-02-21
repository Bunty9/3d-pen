---
title: "SOP-0001: Vault Contribution Standards"
sop_id: "SOP-0001"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - vault
  - standards
---

# SOP-0001: Vault Contribution Standards

## Purpose & Scope

This SOP defines the mandatory standards for all contributions to the 3D Pen Obsidian vault. Every agent (human or AI) MUST follow these rules when creating, editing, or organizing notes. This is the foundational SOP — all other SOPs depend on it.

## Prerequisites

- [ ] Access to the `docs/` vault directory
- [ ] Familiarity with Obsidian markdown and YAML frontmatter
- [ ] Read [[_research-note|Research Note Template]] and other templates in `08-Templates/`

## Definitions

| Term | Definition |
|------|-----------|
| MUST | Required — non-compliance will fail quality review (RFC 2119) |
| SHOULD | Recommended — deviation requires documented rationale (RFC 2119) |
| MAY | Optional — at agent's discretion (RFC 2119) |
| MOC | Map of Content — an index note linking to related notes |
| Frontmatter | YAML metadata block at the top of every markdown file |
| Wikilink | Obsidian internal link format: `[[note-name]]` or `[[note-name|Display Text]]` |

## Procedure

### Step 1: Frontmatter Schema

Every vault note MUST begin with a YAML frontmatter block containing these fields:

```yaml
---
title: "Human-readable title"          # MUST — string
domain: "hardware|embedded|ml|software|integration|meta"  # MUST — enum
status: "draft|review|final"           # MUST — enum
created: "YYYY-MM-DD"                  # MUST — ISO date
updated: "YYYY-MM-DD"                  # MUST — ISO date, update on every edit
author: "agent-id or human name"       # MUST — string
tags:                                  # MUST — list, minimum 2 tags
  - "primary-category"
  - "domain"
related:                               # SHOULD — list of wikilinks
  - "[[related-note]]"
---
```

Additional fields MAY be added depending on note type (e.g., `sop_id`, `decision_id`, `verdict`).

### Step 2: File Naming Convention

- MUST use lowercase
- MUST use hyphens (`-`) as word separators
- MUST NOT use spaces, underscores, or special characters
- MUST use `.md` extension
- SHOULD be descriptive but concise (3-5 words)
- Template files MUST be prefixed with `_` (e.g., `_research-note.md`)

**Examples:**
- `flex-pcb-design.md` ✅
- `Flex PCB Design.md` ❌
- `flex_pcb_design.md` ❌
- `flexpcb.md` ❌ (too terse)

### Step 3: File Placement Rules

| Note Type | Location | Example |
|-----------|----------|---------|
| Research notes | `02-Research/{domain}/` | `02-Research/hardware/flex-pcb-design.md` |
| SOPs | `03-SOPs/` | `03-SOPs/sop-vault-contribution.md` |
| Tool evaluations | `04-Tools/` | `04-Tools/tools-hardware.md` |
| Plans | `05-Plans/` | `05-Plans/phase-2-design.md` |
| Decision logs | `06-Decisions/` | `06-Decisions/dec-0001-mcu-selection.md` |
| Reference materials | `07-References/{type}/` | `07-References/datasheets/nrf52840.md` |
| Templates | `08-Templates/` | `08-Templates/_research-note.md` |
| Images/assets | `09-Assets/images/` | `09-Assets/images/pen-sketch-v0.jpg` |
| Unsorted / WIP | `00-Inbox/` | `00-Inbox/quick-idea.md` |
| Project docs | `01-Project/` | `01-Project/vision.md` |

### Step 4: Linking Conventions

- MUST use `[[wikilinks]]` for all internal vault links
- MUST use display text for clarity when needed: `[[flex-pcb-design|Flex PCB Design Research]]`
- For cross-domain references, SHOULD use full relative path: `[[02-Research/hardware/flex-pcb-design]]`
- External URLs MUST use standard markdown: `[Display Text](https://example.com)`
- Image embeds MUST use: `![[09-Assets/images/filename.jpg]]`

### Step 5: MOC Update Protocol

When creating a new note that belongs to a tracked domain:

1. Agent MUST add a link to the note in `[[01-Project/3d-pen-MOC]]` under the appropriate section
2. During parallel agent work, MOC updates MUST be append-only (add lines, never remove or reorder existing lines)
3. If two agents need to update the MOC simultaneously, they MUST append to different sections (one per domain)
4. The orchestrator will consolidate MOC formatting after parallel phases complete

### Step 6: Conflict Avoidance Rules

| Rule | Detail |
|------|--------|
| Exclusive write scopes | Each agent MUST only write to files within its assigned scope (see [[sop-multi-agent-orchestration]]) |
| No cross-scope writes | An agent MUST NOT create or edit files outside its assigned directories |
| Shared file serialization | Files like `Home.md`, `3d-pen-MOC.md`, `architecture.md`, `requirements.md` MUST only be edited by the orchestrator or integration-agent |
| Append-only shared sections | When multiple agents contribute to a shared note, each MUST only append to their designated section |

### Step 7: Commit Conventions

All git commits MUST follow this format:

```
docs({domain}): {short description}

{optional longer description}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Where `{domain}` is one of: `hardware`, `embedded`, `ml`, `software`, `project`, `sops`, `tools`, `plans`, `templates`, `meta`.

## Input / Output Contract

### Inputs

| Input | Source | Format |
|-------|--------|--------|
| Raw research / findings | Agent work | Unstructured text |
| Template | `08-Templates/` | Markdown with frontmatter |

### Outputs

| Output | Destination | Format |
|--------|-------------|--------|
| Vault-compliant note | Appropriate `docs/` folder | Markdown with valid frontmatter |
| MOC update | `01-Project/3d-pen-MOC.md` | Appended wikilink |

## Quality Checklist

- [ ] Frontmatter present with all MUST fields
- [ ] Frontmatter values match enum constraints
- [ ] File name follows naming convention
- [ ] File placed in correct directory
- [ ] All internal links use `[[wikilinks]]` syntax
- [ ] All external links use `[text](url)` syntax
- [ ] MOC updated with link to new note
- [ ] No writes outside assigned scope
- [ ] Commit message follows convention

## Handoff Protocol

After creating/editing a vault note:
1. Verify all quality checklist items
2. Stage and commit with proper message
3. Note is now available for other agents to reference via wikilinks

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
