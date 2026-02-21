---
title: "SOP-0010: Documentation Agent"
sop_id: "SOP-0010"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - documentation
  - agent
---

# SOP-0010: Documentation Agent

## Purpose & Scope

The documentation agent transforms raw ideation notes, conversation transcripts, and unstructured inputs into properly structured vault documents. It identifies topics, applies the correct templates, links to MOCs, and ensures new content integrates into the vault knowledge graph.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read
- [ ] All templates in `08-Templates/` reviewed
- [ ] `00-Inbox/` contents scanned for unprocessed material

## Procedure

### Step 1: Inbox Triage

Scan `00-Inbox/` for unprocessed files:

1. Read each file completely
2. Identify the primary topic(s) and domain(s)
3. Determine the appropriate note type (research, decision, tool eval, project doc)
4. Determine the target location in the vault

### Step 2: Content Extraction

For each unprocessed file:

1. Extract structured information from unstructured text
2. Identify key claims, decisions, requirements, and open questions
3. Separate factual content from opinions/speculation
4. Note any references or sources mentioned

### Step 3: Template Application

1. Select the correct template from `08-Templates/`
2. Create a new file in the correct vault location
3. Populate frontmatter with extracted metadata
4. Fill template sections with extracted content
5. Add `[[wikilinks]]` to related existing notes

### Step 4: Integration

1. Update [[01-Project/3d-pen-MOC|MOC]] with link to new note
2. Add backlinks from related notes if appropriate
3. Tag for domain agent review if the content needs expert validation

### Step 5: Inbox Cleanup

After processing:
1. Move original inbox file to a `_processed` subfolder or annotate it as processed
2. Do NOT delete original — preserve for audit trail

## Input / Output Contract

### Inputs

| Input | Source | Format |
|-------|--------|--------|
| Raw notes | `00-Inbox/` | Unstructured markdown |
| Conversation transcripts | `00-Inbox/` | Markdown |
| Templates | `08-Templates/` | Structured markdown |

### Outputs

| Output | Destination | Format |
|--------|-------------|--------|
| Structured notes | Various vault locations | Template-compliant markdown |
| MOC updates | `01-Project/3d-pen-MOC.md` | Appended wikilinks |

## Quality Checklist

- [ ] All inbox items triaged
- [ ] Correct template applied for each note type
- [ ] Frontmatter complete per SOP-0001
- [ ] Content accurately reflects source material
- [ ] Wikilinks added to related notes
- [ ] MOC updated
- [ ] Original source preserved

## Handoff Protocol

After documentation pass:
1. Report processed files and their destinations
2. Flag any content needing domain expert review
3. List any topics that warrant dedicated research by domain agents

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
