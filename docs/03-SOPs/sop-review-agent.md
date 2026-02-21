---
title: "SOP-0009: Review Agent"
sop_id: "SOP-0009"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - review
  - quality
  - agent
---

# SOP-0009: Review Agent

## Purpose & Scope

The review agent validates the quality of all vault contributions. It checks frontmatter schema compliance, broken wikilinks, content depth (no stubs), citation quality, and cross-reference consistency.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read — this defines what "compliant" means
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read — understand quality gates

## Exclusive Write Scope

- `06-Decisions/` (for quality-related decision log entries only)

## Procedure

### Step 1: Frontmatter Schema Validation

For every `.md` file in the vault (except templates), verify:

- [ ] Frontmatter block exists (starts with `---`, ends with `---`)
- [ ] `title` field present and non-empty
- [ ] `domain` field present and matches enum: `hardware|embedded|ml|software|integration|meta`
- [ ] `status` field present and matches enum: `draft|review|final`
- [ ] `created` field present in ISO date format
- [ ] `updated` field present in ISO date format
- [ ] `author` field present and non-empty
- [ ] `tags` field present with minimum 2 entries

### Step 2: Wikilink Validation

For every `[[wikilink]]` in the vault:

- [ ] Target note exists or is documented as "planned" in the MOC
- [ ] No orphaned links (links to deleted/renamed notes)
- [ ] Display text is used where the filename alone would be unclear

### Step 3: Content Depth Check

For research notes (`02-Research/`):

- [ ] Summary section is non-empty
- [ ] Key Findings section has ≥3 findings
- [ ] Each finding has evidence or source reference
- [ ] Relevance to Project section maps to constraints
- [ ] References section has ≥3 entries
- [ ] Not a stub (total content >500 words excluding frontmatter)

### Step 4: Citation Quality

- [ ] References use the standard citation format from [[sop-research-agent|SOP-0003]]
- [ ] URLs in references are provided (not just text citations)
- [ ] Sources are from credible origins (see SOP-0003 source evaluation)
- [ ] No circular self-references

### Step 5: Cross-Reference Consistency

- [ ] If Note A references a claim from Note B, Note B actually contains that claim
- [ ] Version/date references are current (not referencing outdated info)
- [ ] Domain-specific terminology is used consistently across notes

## Reporting

The review agent produces a report listing:

```markdown
## Review Report — {date}

### Pass
- [list of compliant notes]

### Warnings
- [list of minor issues — frontmatter warnings, missing optional fields]

### Failures
- [list of non-compliant notes with specific violations]

### Recommendations
- [suggested improvements]
```

## Quality Checklist

- [ ] All vault notes reviewed (not just new ones)
- [ ] Frontmatter validation complete
- [ ] Wikilink validation complete
- [ ] Depth check complete for all research notes
- [ ] Citation quality checked
- [ ] Cross-reference consistency verified
- [ ] Report generated and delivered to orchestrator

## Handoff Protocol

After review:
1. Deliver review report to orchestrator
2. Log any quality-related decisions in `06-Decisions/`
3. Flag notes that need revision — orchestrator reassigns to original agent

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
