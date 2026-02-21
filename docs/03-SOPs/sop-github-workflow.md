---
title: "SOP-0011: GitHub Workflow"
domain: "meta"
status: "final"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - github
  - workflow
  - branching
  - ci
related:
  - "[[sop-vault-contribution]]"
  - "[[sop-multi-agent-orchestration]]"
---

# SOP-0011: GitHub Workflow

Standard operating procedure for GitHub repository management, branching strategy, pull requests, issues, and CI/CD.

## 1. Purpose and Scope

This SOP defines the GitHub workflow for the 3D Pen project. It covers:

- Repository structure and branch management
- Issue tracking and labeling
- Pull request process and review
- CI/CD pipeline (future)
- Release management (future)

All contributors (human and AI agents) MUST follow this workflow.

## 2. Repository Structure

```
3d-pen/                          # Repository root
├── README.md                    # Project overview with renders
├── CONTRIBUTING.md              # Contribution guidelines
├── CLAUDE.md                    # AI agent context and instructions
├── .gitignore                   # Ignored files
└── docs/                        # Obsidian vault (all project content)
    ├── Home.md
    ├── DEVELOPER.md             # Developer documentation
    ├── 00-Inbox/ through 09-Assets/
    └── .obsidian/               # Vault config (partially gitignored)
```

## 3. Branch Strategy

### Branch Types

| Branch | Pattern | Purpose | Merges Into |
|---|---|---|---|
| `main` | `main` | Stable, reviewed content | — |
| Research | `research/{domain}/{topic}` | New research notes | `main` |
| Design | `design/{domain}/{topic}` | Schematic, CAD, architecture work | `main` |
| Feature | `feat/{domain}/{topic}` | New code or functionality | `main` |
| Fix | `fix/{domain}/{topic}` | Bug fixes or corrections | `main` |
| Docs | `docs/{topic}` | Documentation improvements | `main` |
| Hotfix | `hotfix/{description}` | Urgent fixes to main | `main` |

### Branch Rules

1. **`main` is the default branch.** All reviewed, merged content lives here.
2. **No direct commits to `main`** except by the project owner for initial setup or urgent fixes.
3. **One branch per topic.** Don't mix unrelated changes.
4. **Delete branches after merge.** Keep the branch list clean.
5. **Rebase or squash-merge preferred** to keep `main` history linear.

### Naming Examples

```
research/hardware/antenna-simulation
research/ml/augmentation-strategies
design/embedded/adc-dma-schematic
feat/firmware/sensor-streaming
fix/ml/normalization-bug
docs/update-readme-renders
```

## 4. Issue Tracking

### Issue Labels

| Label | Color | Description |
|---|---|---|
| `domain:hardware` | `#d73a4a` (red) | Hardware domain |
| `domain:embedded` | `#0075ca` (blue) | Embedded domain |
| `domain:ml` | `#7057ff` (purple) | ML domain |
| `domain:software` | `#008672` (teal) | Software domain |
| `domain:meta` | `#e4e669` (yellow) | Meta / documentation |
| `type:research` | `#c5def5` (light blue) | Research task |
| `type:design` | `#bfdadc` (light teal) | Design task |
| `type:bug` | `#d73a4a` (red) | Bug report |
| `type:feature` | `#a2eeef` (cyan) | Feature request |
| `type:question` | `#d876e3` (pink) | Question or discussion |
| `priority:high` | `#b60205` (dark red) | High priority |
| `priority:medium` | `#fbca04` (yellow) | Medium priority |
| `priority:low` | `#0e8a16` (green) | Low priority |
| `phase:1-research` | `#f9d0c4` (peach) | Phase 1 work |
| `phase:2-design` | `#fef2c0` (light yellow) | Phase 2 work |
| `phase:3-prototype` | `#c2e0c6` (light green) | Phase 3 work |
| `good-first-issue` | `#7057ff` (purple) | Good for newcomers |

### Issue Templates

#### Research Gap

```markdown
**Domain:** [hardware/embedded/ml/software]
**Topic:** [Brief topic description]

**Current State:**
What do we know? Link to existing notes.

**Gap:**
What's missing from the current research?

**Desired Output:**
What should the research note cover?

**References:**
Any starting points (papers, repos, datasheets).
```

#### Design Task

```markdown
**Domain:** [hardware/embedded/ml/software]
**Component:** [What's being designed]

**Requirements:**
- Link to relevant requirements from docs/01-Project/requirements.md

**Constraints:**
- Key constraints from existing research

**Deliverables:**
- [ ] Deliverable 1
- [ ] Deliverable 2

**Dependencies:**
Other tasks or notes this depends on.
```

## 5. Pull Request Process

### Creating a PR

```bash
# Create branch
git checkout -b research/hardware/antenna-design

# Make changes, commit
git add docs/02-Research/hardware/antenna-design.md
git commit -m "docs(hardware): add antenna design research note"

# Push and create PR
git push -u origin research/hardware/antenna-design
gh pr create --title "docs(hardware): antenna design research" --body "$(cat <<'EOF'
## Summary
- Added antenna design research note covering IFA and PIFA options for cylindrical enclosure

## Domain
- [x] Hardware

## Checklist
- [x] Valid YAML frontmatter
- [x] Wikilinks resolve
- [x] >= 3 references
- [x] MOC updated
- [x] Commit messages follow convention
EOF
)"
```

### PR Review Checklist

Reviewers SHOULD verify:

- [ ] **Frontmatter**: Valid YAML with all required fields (title, domain, status, created, author, tags)
- [ ] **Content quality**: Substantive content, not a stub
- [ ] **References**: At least 3 external references with working URLs
- [ ] **Wikilinks**: All `[[wikilinks]]` resolve to existing notes
- [ ] **MOC updated**: New notes are linked from `3d-pen-MOC.md`
- [ ] **No scope violation**: Agent writes only to its assigned folders
- [ ] **Commit messages**: Follow `docs({domain}): {description}` format
- [ ] **No sensitive data**: No API keys, credentials, or personal information

### Merge Strategy

- **Squash merge** for research branches (clean single commit)
- **Rebase merge** for multi-commit feature branches (preserve useful history)
- **Merge commit** only for large multi-file PRs where commit history matters

## 6. Commit Message Convention

### Format

```
{type}({domain}): {description}

[optional body]

[optional footer]
Co-Authored-By: {name} <{email}>
```

### Types

| Type | Usage |
|---|---|
| `docs` | Research notes, documentation, vault content |
| `feat` | New functionality or code |
| `fix` | Bug fixes |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or modifying tests |
| `ci` | CI/CD pipeline changes |
| `chore` | Maintenance (gitignore, configs) |

### Domains

`hardware`, `embedded`, `ml`, `software`, `project`, `meta`, `tools`

### Examples

```
docs(hardware): add flex PCB thermal analysis
feat(embedded): implement DMA ring buffer for ADC
fix(ml): correct OnHW dataset channel mapping
test(software): add HID report descriptor validation
ci: add frontmatter validation workflow
chore: update gitignore for KiCad backup files
```

## 7. CI/CD Pipeline (Future)

### Planned Checks

| Check | Trigger | Purpose |
|---|---|---|
| Frontmatter validation | PR to `main` | Verify YAML schema on all `.md` files |
| Wikilink checker | PR to `main` | Detect broken `[[wikilinks]]` |
| Spelling/grammar | PR to `main` | Catch typos in research notes |
| KiCad DRC | PR touching `*.kicad_pcb` | Design rule check on PCB files |
| Firmware build | PR touching `firmware/` | Verify firmware compiles |
| ML tests | PR touching `ml/` | Run model unit tests |
| Image size check | PR with images | Warn on images > 5MB |

### Implementation Plan

1. Start with frontmatter validation (bash script, Phase 1)
2. Add wikilink checker (bash script, Phase 1)
3. Add firmware build CI when code exists (Phase 3)
4. Add ML test CI when training pipeline exists (Phase 3)

See `docs/05-Plans/automation-strategy.md` for the validation scripts.

## 8. Release Management (Future)

### Version Scheme

```
v{phase}.{milestone}.{patch}
```

- `v1.0.0` — Research phase complete (current)
- `v2.0.0` — Design phase complete
- `v2.1.0` — Schematic review milestone
- `v3.0.0` — First prototype assembled
- `v3.1.0` — Firmware MVP running

### Release Artifacts

| Phase | Artifacts |
|---|---|
| Phase 1 (Research) | Vault export, reference library |
| Phase 2 (Design) | KiCad project, Fusion 360 model, firmware architecture |
| Phase 3 (Prototype) | Gerber files, BOM, firmware binary, training scripts |

## 9. Security

- **Never commit** API keys, tokens, or credentials
- **Never commit** `.env` files (already in `.gitignore`)
- **Large binaries** (PCB Gerbers, CAD exports) should use Git LFS if > 10MB
- **AI render images** are acceptable to commit directly (typically < 5MB each)

## 10. Quick Reference

```bash
# Create research branch
git checkout -b research/{domain}/{topic}

# Commit research note
git add docs/02-Research/{domain}/{note}.md
git commit -m "docs({domain}): {description}"

# Push and create PR
git push -u origin research/{domain}/{topic}
gh pr create --title "docs({domain}): {title}" --body "Summary of changes"

# Check PR status
gh pr status

# Merge PR (after review)
gh pr merge --squash

# Clean up
git checkout main && git pull && git branch -d research/{domain}/{topic}
```
