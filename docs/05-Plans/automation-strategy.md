---
title: "Automation Strategy"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - plan
  - meta
  - automation
related:
  - "[[03-SOPs/sop-vault-contribution]]"
  - "[[03-SOPs/sop-review-agent]]"
---

# Automation Strategy

## Overview

Automation for vault maintenance, quality assurance, and agent workflows. Keeps the knowledge base healthy as it grows.

## 1. Vault Validation Scripts

### 1.1 Frontmatter Schema Check

Validates that every `.md` file in the vault has correct frontmatter:

```bash
#!/bin/bash
# scripts/validate-frontmatter.sh
# Checks: title, domain (enum), status (enum), created, updated, author, tags (min 2)

ERRORS=0
for file in $(find docs -name "*.md" -not -path "docs/08-Templates/*" -not -name ".gitkeep"); do
  # Extract frontmatter between --- markers
  FM=$(sed -n '/^---$/,/^---$/p' "$file")

  # Check required fields
  for field in title domain status created updated author; do
    if ! echo "$FM" | grep -q "^${field}:"; then
      echo "MISSING $field in $file"
      ERRORS=$((ERRORS + 1))
    fi
  done

  # Check domain enum
  DOMAIN=$(echo "$FM" | grep "^domain:" | sed 's/domain: *"\?\([^"]*\)"\?/\1/')
  if [[ ! "$DOMAIN" =~ ^(hardware|embedded|ml|software|integration|meta)$ ]]; then
    echo "INVALID domain '$DOMAIN' in $file"
    ERRORS=$((ERRORS + 1))
  fi

  # Check status enum
  STATUS=$(echo "$FM" | grep "^status:" | sed 's/status: *"\?\([^"]*\)"\?/\1/')
  if [[ ! "$STATUS" =~ ^(draft|review|final|active|proposed|accepted)$ ]]; then
    echo "INVALID status '$STATUS' in $file"
    ERRORS=$((ERRORS + 1))
  fi
done

echo "Validation complete: $ERRORS errors"
exit $ERRORS
```

### 1.2 Broken Wikilink Check

```bash
#!/bin/bash
# scripts/validate-wikilinks.sh
# Finds all [[wikilinks]] and checks if target files exist

ERRORS=0
for file in $(find docs -name "*.md"); do
  # Extract wikilinks: [[target]] or [[target|display]]
  LINKS=$(grep -oP '\[\[([^|\]]+)' "$file" | sed 's/\[\[//')

  for link in $LINKS; do
    # Skip image embeds and external refs
    [[ "$link" == 09-Assets/* ]] && continue
    [[ "$link" == http* ]] && continue

    # Check if target exists (try with and without .md)
    TARGET="docs/${link}.md"
    TARGET_DIR="docs/${link}"
    if [[ ! -f "$TARGET" ]] && [[ ! -d "$TARGET_DIR" ]] && [[ ! -f "docs/${link}" ]]; then
      echo "BROKEN LINK: [[$link]] in $file"
      ERRORS=$((ERRORS + 1))
    fi
  done
done

echo "Link check complete: $ERRORS broken links"
exit $ERRORS
```

### 1.3 Completeness Report

```bash
#!/bin/bash
# scripts/vault-report.sh
# Generates a summary of vault state

echo "=== 3D Pen Vault Report ==="
echo "Date: $(date -I)"
echo ""

echo "## File Counts"
for dir in 00-Inbox 01-Project 02-Research 03-SOPs 04-Tools 05-Plans 06-Decisions 07-References 08-Templates; do
  COUNT=$(find "docs/$dir" -name "*.md" -not -name ".gitkeep" | wc -l)
  echo "  $dir: $COUNT files"
done

echo ""
echo "## Research Notes by Domain"
for domain in hardware embedded ml software; do
  COUNT=$(find "docs/02-Research/$domain" -name "*.md" | wc -l)
  echo "  $domain: $COUNT notes"
done

echo ""
echo "## Status Distribution"
for status in draft review final active; do
  COUNT=$(grep -rl "status: \"$status\"" docs/ 2>/dev/null | wc -l)
  echo "  $status: $COUNT files"
done

echo ""
echo "## Word Count (research notes)"
TOTAL=0
for file in $(find docs/02-Research -name "*.md"); do
  WC=$(wc -w < "$file")
  TOTAL=$((TOTAL + WC))
done
echo "  Total: $TOTAL words across research notes"
```

## 2. Git Pre-Commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit (or via pre-commit framework)
# Runs frontmatter validation on staged .md files

STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.md$' | grep '^docs/')

if [ -z "$STAGED" ]; then
  exit 0
fi

ERRORS=0
for file in $STAGED; do
  # Skip templates
  [[ "$file" == docs/08-Templates/* ]] && continue

  FM=$(sed -n '/^---$/,/^---$/p' "$file")
  if [ -z "$FM" ]; then
    echo "PRE-COMMIT: No frontmatter in $file"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "Pre-commit: $ERRORS file(s) missing frontmatter. Commit blocked."
  exit 1
fi
```

## 3. Research Agent Launch Templates

Reusable prompts for launching domain research agents:

```json
{
  "template": "research-deep-dive",
  "variables": {
    "agent_id": "",
    "topic": "",
    "target_file": "",
    "focus_questions": [],
    "project_constraints": [
      "2.5mm annular gap",
      "8kHz sensor streaming",
      "Low power (battery operated)",
      "Flex PCB helical wrap"
    ]
  },
  "read_first": [
    "docs/03-SOPs/sop-vault-contribution.md",
    "docs/03-SOPs/sop-research-agent.md",
    "docs/08-Templates/_research-note.md",
    "docs/01-Project/vision.md",
    "docs/01-Project/requirements.md"
  ]
}
```

## 4. Weekly Review Cycle

| Day | Activity | Agent |
|-----|----------|-------|
| Monday | Review-agent: validate all new/modified notes | review-agent |
| Monday | Integration-agent: check cross-domain alignment | integration-agent |
| Wednesday | Orchestrator: identify gaps, create new research tasks | orchestrator |
| Wednesday | Launch domain agents for gap-filling research | domain agents |
| Friday | Orchestrator: update MOC, Home.md status dashboard | orchestrator |
| Friday | Commit and summarize week's progress | orchestrator |

## 5. Dataview Queries (for Obsidian UI)

### Research Notes by Status

```dataview
TABLE status, domain, updated, author
FROM "02-Research"
SORT updated DESC
```

### Open Questions Across All Notes

```dataview
LIST
FROM "02-Research"
WHERE contains(file.content, "- [ ]")
FLATTEN file.lists AS item
WHERE contains(item.text, "[ ]")
```

### Tool Verdicts

```dataview
TABLE verdict, domain
FROM "04-Tools"
WHERE verdict
SORT verdict ASC
```

## 6. Future Automation

- [ ] MCP server for vault operations (create note from template, validate, update MOC)
- [ ] GitHub Actions for CI validation on push
- [ ] Automated Dataview dashboard refresh
- [ ] Slack/Discord notifications for new decision logs
