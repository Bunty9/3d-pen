---
title: "SOP-0003: Research Agent Methodology"
sop_id: "SOP-0003"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - research
  - methodology
---

# SOP-0003: Research Agent Methodology

## Purpose & Scope

Defines the standard research methodology for all domain agents conducting research for the 3D Pen project. Covers search strategy, source evaluation, note structure, and citation practices.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read and understood
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read and understood
- [ ] Domain-specific SOP read (SOP-0004 through SOP-0007)
- [ ] Access to web search tools

## Definitions

| Term | Definition |
|------|-----------|
| Primary Source | Original research papers, official documentation, datasheets |
| Secondary Source | Review articles, tutorials, blog posts from credible authors |
| Tertiary Source | Forum posts, social media, unverified claims |

## Procedure

### Step 1: Search Methodology

Research MUST follow this priority order:

1. **Academic papers** — IEEE, arXiv, ACM, Springer, Elsevier, ResearchGate
   - Search for peer-reviewed work directly relevant to the constraint
   - Prioritize papers from the last 5 years
   - Look for survey/review papers for broad landscape understanding

2. **Open-source repositories** — GitHub, GitLab
   - Search for existing implementations of the technique/component
   - Evaluate maturity (stars, recent commits, documentation quality)
   - Check license compatibility

3. **Manufacturer documentation** — Datasheets, application notes, reference designs
   - Official specs for components under consideration
   - Application notes showing real-world integration
   - Reference designs from evaluation kits

4. **Community knowledge** — Stack Overflow, Reddit, specialized forums
   - Real-world experience reports
   - Known pitfalls and workarounds
   - MAY use as supporting evidence but MUST NOT be sole source

### Step 2: Source Evaluation Criteria

Every source MUST be evaluated on:

| Criterion | Weight | Evaluation |
|-----------|--------|-----------|
| Recency | High | Published within last 5 years preferred; older if foundational |
| Relevance | Critical | Directly addresses a 3D Pen constraint or design question |
| Credibility | High | Peer-reviewed, official manufacturer, established expert |
| Practicality | Medium | Provides actionable information (not purely theoretical) |
| Specificity | Medium | Addresses our specific constraints (size, power, bandwidth) |

### Step 3: Note Structure

Every research note MUST follow the [[_research-note|Research Note Template]] exactly:

1. **Frontmatter** — all MUST fields populated
2. **Summary** — one paragraph, executive level
3. **Context** — why this research matters for the project
4. **Key Findings** — minimum 3, each with evidence
5. **Relevance to Project** — explicit mapping to constraints table
6. **Open Questions** — what remains unknown
7. **Recommendations** — actionable next steps
8. **References** — minimum 3 references

### Step 4: Citation Format

References MUST use this format:

```markdown
1. [Author(s), "Title," Publication/Source, Year](URL)
```

For datasheets:
```markdown
1. [Manufacturer, "Part Number Datasheet," Rev X, Year](URL)
```

For GitHub repos:
```markdown
1. [Author/Org, "Repository Name," GitHub, Accessed YYYY-MM-DD](URL)
```

### Step 5: Linking Protocol

Within a research note:
- MUST link to related research notes using `[[wikilinks]]`
- MUST link to relevant project docs (`[[vision]]`, `[[requirements]]`, `[[architecture]]`)
- SHOULD link to tool evaluations if tools are discussed
- SHOULD link to decision logs if decisions are referenced

## Input / Output Contract

### Inputs

| Input | Source | Format |
|-------|--------|--------|
| Research task | Orchestrator via Context Template | JSON |
| Project constraints | `01-Project/requirements.md` | Markdown |
| Template | `08-Templates/_research-note.md` | Markdown |

### Outputs

| Output | Destination | Format |
|--------|-------------|--------|
| Research note | `02-Research/{domain}/` | Template-compliant markdown |
| MOC update | `01-Project/3d-pen-MOC.md` | Appended wikilink |

## Quality Checklist

- [ ] Followed search priority order (academic → open-source → manufacturer → community)
- [ ] All sources evaluated for recency, relevance, credibility
- [ ] Note follows template structure exactly
- [ ] Minimum 3 key findings with evidence
- [ ] Minimum 3 references with proper citation format
- [ ] Relevance table maps findings to project constraints
- [ ] Open questions identified for follow-up
- [ ] Actionable recommendations provided
- [ ] All internal links use wikilink syntax
- [ ] MOC updated

## Handoff Protocol

After completing research:
1. Self-review against quality checklist
2. Commit with `docs({domain}): add {topic} research`
3. Report completion per [[sop-multi-agent-orchestration|SOP-0002]] handoff protocol

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
