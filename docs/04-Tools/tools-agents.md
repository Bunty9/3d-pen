---
title: "Agent & Workflow Tools Evaluation"
domain: "meta"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - tool-evaluation
  - meta
  - agents
related:
  - "[[03-SOPs/sop-multi-agent-orchestration|SOP-0002: Multi-Agent Orchestration]]"
  - "[[01-Project/architecture|Architecture]]"
  - "[[05-Plans/automation-strategy|Automation Strategy]]"
---

# Agent & Workflow Tools Evaluation

This document evaluates tools for AI agent workflows, multi-agent orchestration, and vault management in the context of the 3D Pen project. The project uses a multi-agent architecture (see [[03-SOPs/sop-multi-agent-orchestration|SOP-0002]]) with domain-specialized agents (hardware, embedded, ML, software) coordinated by an orchestrator agent. Tools are evaluated for their ability to support this architecture.

## Verdict Legend

| Verdict | Meaning |
|---------|---------|
| **ADOPT** | Proven, recommended for production use in this project |
| **TRIAL** | Worth investing time to explore, low risk to adopt |
| **ASSESS** | Interesting, needs more investigation before committing |
| **HOLD** | Not recommended at this time |

---

## 1. Claude Code

### Overview

| Property | Value |
|----------|-------|
| **Name** | Claude Code |
| **Version** | v2.1.x (latest: ~2.1.49 as of Feb 2026) |
| **License** | Proprietary (Anthropic) — requires Anthropic API subscription |
| **Website** | [claude.com/product/claude-code](https://claude.com/product/claude-code) |
| **Repository** | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) |

### Purpose

Claude Code is the primary agent runtime for all domain agents in the 3D Pen project. Each agent in the roster (hardware-agent, embedded-agent, ml-agent, software-agent, integration-agent, review-agent, orchestrator) runs as a Claude Code session with task-specific context passed via the orchestrator's context passing template.

### Key Features

- **Agentic coding**: reads the full codebase/vault, edits files, runs shell commands, and manages git workflows via natural language
- **Agent teams / subagents**: a lead agent can spawn multiple subagents that work in parallel on different parts of a task, then merges results
- **Worktree isolation**: agent definitions support `isolation: worktree` so subagents operate in isolated git worktrees without conflicting writes
- **Skills system**: hot-reloadable skill definitions in `.claude/skills/` allow domain-specific capabilities without restarting sessions
- **MCP integration**: native support for Model Context Protocol servers, enabling tool use (web search, file operations, browser automation)
- **Multi-model support**: defaults to Claude Sonnet 4 for routine tasks, Claude Opus 4 for deep reasoning; model selection can be configured per agent

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | Primary interface: `claude` command with flags for non-interactive and piped usage |
| API | Yes | Claude Code SDK (`@anthropic-ai/claude-code`) for programmatic agent orchestration |
| MCP Server | Yes | Consumes MCP servers; can be extended with custom MCP tools |
| Python SDK | Indirect | Underlying Anthropic API has Python SDK; Claude Code itself is Node.js-based |
| Headless / CI | Yes | Supports `--print` mode for non-interactive scripting and CI pipelines |

### Pros and Cons

| Pros | Cons |
|------|------|
| Direct file system access — can read/write vault files natively | Requires Anthropic API credits; cost scales with token usage |
| Native MCP support for extensible tool use | Session state does not persist across invocations (must re-read context) |
| Subagent spawning enables our multi-agent SOP pattern | No built-in persistent memory or vector store across sessions |
| Understands Markdown/YAML frontmatter well — ideal for Obsidian vault work | Context window limits require careful prompt engineering for large vaults |
| Skill hot-reload allows domain-specific customization | Relatively new agent teams feature; patterns still maturing |

### Verdict

**ADOPT**

> Claude Code is the foundational agent runtime for this project. It directly implements the multi-agent orchestration model defined in SOP-0002. Its file system access, MCP integration, subagent spawning, and skill system align precisely with our architecture. The orchestrator dispatches tasks to Claude Code sessions, each scoped to a domain agent's write scope. No alternative offers the same combination of agentic file editing, web research, and tool integration in a single CLI.

### Getting Started

```bash
# Install
npm install -g @anthropic-ai/claude-code

# Launch with project context
cd /path/to/3d-pen
claude

# Non-interactive task execution
claude --print "Read docs/01-Project/vision.md and summarize the sensor requirements"

# Launch with custom skills
# Place skill files in .claude/skills/ — they hot-reload automatically
```

### References

1. [Claude Code Documentation](https://code.claude.com/docs/en/overview)
2. [Claude Code GitHub](https://github.com/anthropics/claude-code)
3. [Agent Teams Guide](https://www.sitepoint.com/anthropic-claude-code-agent-teams/)

---

## 2. MCP Servers (Model Context Protocol)

### Overview

| Property | Value |
|----------|-------|
| **Name** | Model Context Protocol (MCP) |
| **Version** | Spec v2025-11-25 (latest stable) |
| **License** | Open standard; Apache 2.0 (reference implementations) |
| **Website** | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| **Registry** | [MCP Registry](https://modelcontextprotocol.io) (~2,000+ registered servers) |

### Purpose

MCP provides the standardized tool interface layer between Claude Code agents and external capabilities. Rather than building custom integrations for each domain (datasheets, web search, vault queries), each capability is exposed as an MCP server that any agent can consume. This is the "plugin system" for our agent architecture.

### Key Features

- **Open standard**: vendor-neutral protocol adopted by Anthropic, OpenAI, and the wider ecosystem; governed by the Agentic AI Foundation under the Linux Foundation as of Dec 2025
- **Structured tool outputs**: latest spec supports typed, structured responses (not just text), enabling reliable programmatic consumption
- **OAuth authorization**: built-in auth model for servers that access user data or external APIs
- **Elicitation**: server-initiated user interactions for dynamic input gathering
- **Async execution**: November 2025 spec adds support for long-running tasks, essential for hardware simulation or ML training runs
- **Massive ecosystem**: 5,800+ servers, 300+ clients; covers file systems, databases, web search, GitHub, Notion, and domain-specific tools

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | MCP servers run as local processes; Claude Code auto-discovers configured servers |
| API | Yes | JSON-RPC 2.0 over stdio or HTTP+SSE transport |
| MCP Server | N/A | MCP is the server framework itself |
| Python SDK | Yes | `mcp` Python package for building custom servers |
| TypeScript SDK | Yes | `@modelcontextprotocol/sdk` for Node.js servers |

### Relevant MCP Servers for This Project

| Server | Domain | Use Case |
|--------|--------|----------|
| `filesystem` | All | Read/write vault files with scoped permissions |
| `web-search` | All | Research datasheets, papers, documentation |
| `github` | All | Manage issues, PRs, code reviews |
| `obsidian` | Meta | Direct Obsidian vault queries and note creation |
| Custom: `datasheet-search` | Hardware/Embedded | Search component databases (DigiKey, Mouser APIs) |
| Custom: `kicad` | Hardware | Query KiCad schematics and footprints |
| Custom: `wandb` | ML | Query experiment tracking data from W&B |

### Pros and Cons

| Pros | Cons |
|------|------|
| Standardized interface — write once, use from any MCP client | Still a young standard; some servers are immature or poorly maintained |
| Open governance under Linux Foundation — long-term viability | Custom server development required for domain-specific needs (KiCad, W&B) |
| Growing registry with discoverability and versioning | OAuth/auth flows add complexity for enterprise or private API servers |
| Both stdio (local) and HTTP (remote) transports available | Debugging MCP server interactions can be opaque without proper logging |
| Claude Code has first-class MCP support | Ecosystem quality varies widely; vetting individual servers is necessary |

### Verdict

**ADOPT**

> MCP is the integration backbone for the project's agent architecture. Claude Code agents already consume MCP servers natively, and the protocol's open standard status ensures longevity. For Phase 1 (research), off-the-shelf servers (filesystem, web-search, github) cover immediate needs. For Phase 2 and beyond, custom MCP servers can expose domain-specific tools (KiCad queries, component databases, experiment tracking) to any agent without modifying the agent itself.

### Getting Started

```bash
# Install a community MCP server (example: filesystem)
npx @anthropic-ai/create-mcp-server

# Configure in Claude Code's MCP settings
# Edit ~/.claude/mcp_servers.json:
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/3d-pen/docs"]
  }
}

# Build a custom MCP server in Python
pip install mcp
# See: https://modelcontextprotocol.io/quickstart
```

### References

1. [MCP Specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25)
2. [MCP First Anniversary Blog](http://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)
3. [Enterprise Adoption Guide](https://guptadeepak.com/the-complete-guide-to-model-context-protocol-mcp-enterprise-adoption-market-trends-and-implementation-strategies/)

---

## 3. LangGraph

### Overview

| Property | Value |
|----------|-------|
| **Name** | LangGraph |
| **Version** | v1.0.7 (Jan 2026, PyPI) |
| **License** | MIT |
| **Website** | [langchain.com/langgraph](https://www.langchain.com/langgraph) |
| **Repository** | [github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) |

### Purpose

LangGraph would serve as a programmatic orchestration layer for complex multi-agent workflows that go beyond what a single Claude Code session can coordinate — for example, a pipeline that runs hardware-agent research, feeds results to integration-agent for review, then dispatches follow-up tasks based on the review, all with persistent state across steps.

### Key Features

- **Graph-based orchestration**: define agent workflows as directed graphs with nodes (agents, functions) and edges (conditional routing, parallel branches)
- **State management**: built-in `StateGraph` maintains conversation history and context across steps; checkpointing supports resumable workflows
- **Human-in-the-loop**: native support for human approval gates — agents can pause execution and wait for user input before proceeding
- **Streaming**: token-by-token streaming of agent reasoning and intermediate steps for real-time visibility into multi-step workflows
- **Pre-built patterns**: Swarm, Supervisor, and tool-calling agent architectures available as templates via `langgraph-prebuilt`
- **LangGraph Studio v2**: visual debugging and trace inspection for agent interactions; runs locally without a desktop app
- **Open Agent Platform**: no-code agent builder with MCP tool selection, custom prompts, and model configuration

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `langgraph-cli` for local development and deployment |
| API | Yes | LangGraph Cloud API for remote agent execution; also self-hostable |
| MCP Server | Partial | Can integrate MCP tools via LangChain tool wrappers; no native MCP server role |
| Python SDK | Yes | Primary interface; `pip install langgraph` |
| LangSmith | Yes | Tracing, evaluation, and monitoring platform (separate product) |

### Pros and Cons

| Pros | Cons |
|------|------|
| Mature graph-based orchestration — ideal for complex, branching workflows | Adds a Python dependency and runtime separate from Claude Code |
| Checkpointing enables long-running, resumable research workflows | LangChain ecosystem complexity; steep learning curve for custom flows |
| Human-in-the-loop gates align with our quality gate pattern (SOP-0002) | Overlaps with Claude Code's native subagent orchestration |
| Strong observability via LangSmith traces | Cloud offering adds cost; self-hosting requires infrastructure |
| Pre-built multi-agent patterns reduce boilerplate | Tight coupling to LangChain abstractions may limit flexibility |

### Verdict

**ASSESS**

> LangGraph offers sophisticated orchestration capabilities that could complement Claude Code for complex multi-step workflows (e.g., automated research-review-revision cycles). However, Claude Code's native subagent spawning already covers the immediate orchestration needs defined in SOP-0002. LangGraph becomes valuable if the project evolves to require persistent state machines, conditional branching based on intermediate results, or automated quality gate enforcement across multiple agents. Worth investigating once Phase 1 research is complete and workflow patterns are better understood.

### Getting Started

```bash
pip install langgraph langgraph-prebuilt

# Basic supervisor pattern
from langgraph.prebuilt import create_supervisor
# Define agents, tools, and graph edges
# See: https://docs.langchain.com/oss/python/langgraph/overview
```

### References

1. [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview)
2. [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
3. [Multi-Agent Orchestration Guide](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)

---

## 4. CrewAI

### Overview

| Property | Value |
|----------|-------|
| **Name** | CrewAI |
| **Version** | ~0.102.x (Feb 2026, PyPI) |
| **License** | MIT |
| **Website** | [crewai.com](https://www.crewai.com/) |
| **Repository** | [github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) |

### Purpose

CrewAI offers a role-based multi-agent framework that maps naturally to the 3D Pen project's agent roster. Each agent (hardware, embedded, ML, software) would be defined as a CrewAI Agent with a role, goal, and backstory, collaborating within a Crew to execute research tasks.

### Key Features

- **Role-based agents**: define agents with specific roles, goals, and backstories — maps directly to domain agents
- **Crews and Flows**: Crews for autonomous multi-agent collaboration; Flows for deterministic, event-driven production workflows
- **Task execution models**: sequential, parallel, and conditional processing with dependency management
- **Hierarchical coordination**: senior agents can override junior agents and redistribute resources
- **Memory systems**: shared short-term, long-term, entity, and contextual memory across agents
- **Built-in tool ecosystem**: 100+ open-source tools for web search, website interaction, vector databases, and more
- **Tracing and training**: real-time trace inspection plus automated and human-in-the-loop agent training for reproducibility
- **Performance**: benchmarks show 2-3x faster execution compared to comparable frameworks

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `crewai` CLI for project scaffolding, running crews, and deployment |
| API | Yes | CrewAI Enterprise API; also usable as a Python library |
| MCP Server | Partial | Tool integrations possible via custom tools; no native MCP server/client |
| Python SDK | Yes | Primary interface; `pip install crewai` |
| CrewAI Studio | Yes | No-code builder for crews with pre-built integrations (Slack, Gmail, etc.) |

### Pros and Cons

| Pros | Cons |
|------|------|
| Role-based model maps cleanly to our agent roster (SOP-0002) | Framework-specific abstractions — agents are CrewAI objects, not generic |
| Built-in memory enables context sharing across agent sessions | No native MCP support; tool ecosystem is CrewAI-proprietary |
| Parallel and hierarchical execution patterns built in | Adds a separate orchestration layer on top of Claude Code |
| Active development with large community (450M+ processed workflows) | Enterprise features (Studio, hosted deployment) are commercial |
| Lean, independent codebase — no LangChain dependency | Less flexible than LangGraph for custom graph-based control flow |

### Verdict

**ASSESS**

> CrewAI's role-based agent model is an appealing fit for the 3D Pen agent roster, and its built-in memory system could address the cross-session context-sharing gap in Claude Code. However, adopting CrewAI means wrapping Claude Code sessions inside CrewAI agents, which adds complexity and a framework-specific abstraction layer. The lack of native MCP support is a drawback given our MCP-centric tool strategy. Worth evaluating as the project's multi-agent workflows become more complex, particularly if persistent shared memory becomes a bottleneck.

### Getting Started

```bash
pip install crewai

# Scaffold a new crew project
crewai create crew 3d-pen-research

# Define agents in agents.yaml, tasks in tasks.yaml
# See: https://docs.crewai.com/en/concepts/agents
```

### References

1. [CrewAI Documentation](https://docs.crewai.com/)
2. [CrewAI GitHub](https://github.com/crewAIInc/crewAI)
3. [CrewAI Open Source](https://www.crewai.com/open-source)

---

## 5. AutoGen / Microsoft Agent Framework

### Overview

| Property | Value |
|----------|-------|
| **Name** | AutoGen (now Microsoft Agent Framework) / AG2 (community fork) |
| **Version** | Agent Framework: public preview (Oct 2025), GA targeting Q1 2026; AG2: v0.11.0 (Feb 2026) |
| **License** | MIT (Microsoft Agent Framework); Apache 2.0 (AG2) |
| **Website** | [learn.microsoft.com/agent-framework](https://learn.microsoft.com/en-us/agent-framework/) / [ag2.ai](https://docs.ag2.ai/latest/) |
| **Repository** | [github.com/microsoft/agent-framework](https://github.com/microsoft/agent-framework) / [github.com/ag2ai/ag2](https://github.com/ag2ai/ag2) |

### Purpose

AutoGen pioneered the conversational multi-agent pattern where agents communicate by exchanging messages in a group chat. For the 3D Pen project, this would model cross-domain discussions — e.g., hardware-agent and embedded-agent negotiating the sensor-MCU interface spec, with integration-agent moderating.

### Key Features

**Microsoft Agent Framework (successor):**
- **Unified runtime**: merges AutoGen's multi-agent patterns with Semantic Kernel's enterprise features (state management, telemetry, type safety)
- **Python and .NET support**: dual-language SDK for cross-platform deployment
- **Workflow orchestration**: explicit multi-agent execution paths with deterministic business workflow support (Process Framework, GA Q2 2026)
- **Human-in-the-loop**: robust state management for long-running, interruptible workflows

**AG2 (community fork):**
- **Open governance**: Apache 2.0 licensed, community-maintained under AG2AI organization
- **Conversational agents**: agents interact via message passing in group chats with configurable termination conditions
- **RealtimeAgent**: experimental real-time voice and event-driven agent interactions
- **Modular architecture**: v0.4+ redesign with pluggable memory, custom agents, and monitoring

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | No | No dedicated CLI; used as a Python library |
| API | Yes | Python API for agent definition and orchestration |
| MCP Server | Partial | AG2 has community MCP tool integrations; Agent Framework integrating via Semantic Kernel |
| Python SDK | Yes | Primary interface for both Agent Framework and AG2 |
| .NET SDK | Yes | Microsoft Agent Framework only |

### Pros and Cons

| Pros | Cons |
|------|------|
| Conversational pattern is natural for cross-domain agent negotiation | Ecosystem is fragmented: Agent Framework vs AG2 vs legacy AutoGen |
| Microsoft backing ensures enterprise-grade support (Agent Framework) | Agent Framework not yet GA — breaking API changes still possible |
| AG2 community fork is fully open-source with active development | No dedicated CLI; heavier setup than Claude Code for simple tasks |
| Strong .NET support for teams with C# infrastructure | Conversational pattern can be verbose for simple task-delegation workflows |
| Process Framework (Q2 2026) could enable deterministic quality gate enforcement | Neither fork has native MCP client support yet |

### Verdict

**HOLD**

> The AutoGen ecosystem is in a fragmented state. Microsoft is merging AutoGen into the Agent Framework (GA targeting Q1 2026), while the community maintains AG2 as a separate fork. For a project starting now, committing to either path carries risk of API instability or ecosystem divergence. The conversational multi-agent pattern is interesting for cross-domain interface negotiations, but our current orchestration model (SOP-0002) uses a simpler task-delegation pattern that Claude Code handles natively. Revisit once Microsoft Agent Framework reaches GA and the ecosystem stabilizes.

### Getting Started

```bash
# AG2 (community fork)
pip install ag2

# Microsoft Agent Framework (preview)
pip install microsoft-agent-framework
# Note: preview release — API may change before GA

# See migration guide: https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/
```

### References

1. [Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)
2. [AG2 Documentation](https://docs.ag2.ai/latest/)
3. [AutoGen to Agent Framework Migration Guide](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)
4. [Agent Framework Announcement](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/)

---

## 6a. Obsidian Templater Plugin

### Overview

| Property | Value |
|----------|-------|
| **Name** | Templater |
| **Version** | v2.9.x (actively maintained) |
| **License** | AGPL-3.0 |
| **Website** | [Obsidian Plugin Directory](https://obsidian.md/plugins?search=templater) |
| **Repository** | [github.com/SilentVoid13/Templater](https://github.com/SilentVoid13/Templater) |

### Purpose

Templater automates the creation of vault notes from the project's templates (see `08-Templates/`). When an agent or the orchestrator needs to create a new research note, tool evaluation, or decision log, Templater ensures consistent frontmatter, structure, and metadata population.

### Key Features

- **Dynamic templates**: variables and functions that resolve at insertion time (date, title, file path, cursor position)
- **JavaScript execution**: arbitrary JS code in templates for complex logic (conditional sections, computed frontmatter values)
- **Date manipulation**: built-in date math for scheduling and time-stamped entries
- **Folder templates**: auto-apply specific templates when creating notes in designated folders (e.g., new file in `02-Research/hardware/` auto-applies `_research-note.md`)
- **User functions**: define reusable JS functions callable from any template
- **Template prompts**: interactive prompts for user input during template insertion (domain selection, status, agent ID)

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | No | Obsidian plugin — runs inside the Obsidian app only |
| API | No | No external API; operates within Obsidian's plugin sandbox |
| MCP Server | Indirect | An Obsidian MCP server could trigger Templater actions, but this is not built-in |
| Python SDK | No | |
| Obsidian URI | Partial | Obsidian URI scheme can open notes, but Templater-specific actions are limited |

### Pros and Cons

| Pros | Cons |
|------|------|
| Enforces template consistency across vault — critical for multi-agent contributions | Only works inside Obsidian app; agents writing files directly bypass Templater |
| Folder templates auto-apply the correct template per domain | No external API — cannot be called from Claude Code or CI pipelines |
| JS execution enables complex template logic | Agent-created files must manually conform to template structure |
| Mature, widely adopted plugin with large community | AGPL license may have implications for derived automation |
| Pairs well with QuickAdd for macro-style workflows | |

### Verdict

**TRIAL**

> Templater is valuable for human-authored notes and for defining the canonical template structure that agents must follow. However, since domain agents operate via Claude Code (writing files directly to the vault), Templater's runtime template expansion is bypassed. The primary value is as the "source of truth" for template definitions: agents read the templates in `08-Templates/` and replicate the structure. Adopt for human use; the agent workflow relies on template files directly rather than Templater's runtime expansion.

### Getting Started

```
# Install via Obsidian Community Plugins:
# Settings → Community Plugins → Browse → Search "Templater" → Install

# Configure folder templates:
# Templater Settings → Folder Templates → Add:
#   02-Research/ → 08-Templates/_research-note.md
#   04-Tools/   → 08-Templates/_tool-evaluation.md
#   06-Decisions/ → 08-Templates/_decision-log.md
```

### References

1. [Templater GitHub](https://github.com/SilentVoid13/Templater)
2. [Templater Documentation](https://silentvoid13.github.io/Templater/)
3. [Automation with Templater](https://www.thoughtasylum.com/2021/07/10/automation-with-templater-for-obsidian/)

---

## 6b. Obsidian Dataview Plugin

### Overview

| Property | Value |
|----------|-------|
| **Name** | Dataview |
| **Version** | v0.5.x (actively maintained) |
| **License** | MIT |
| **Website** | [Obsidian Plugin Directory](https://obsidian.md/plugins?search=dataview) |
| **Repository** | [github.com/blacksmithgu/obsidian-dataview](https://github.com/blacksmithgu/obsidian-dataview) |

### Purpose

Dataview transforms the Obsidian vault into a queryable database. For the 3D Pen project, this enables dynamic dashboards that show research progress, tool verdicts, open questions, cross-domain dependencies, and quality gate status — all computed live from frontmatter metadata.

### Key Features

- **Dataview Query Language (DQL)**: SQL-like syntax to list, table, and group notes by frontmatter fields (domain, status, verdict, author, tags)
- **Inline queries**: embed single computed values anywhere in a note (e.g., count of draft research notes)
- **DataviewJS**: full JavaScript API for complex queries, aggregation, and custom rendering
- **Live indexing**: queries update automatically as vault content changes — no manual refresh needed
- **Metadata sources**: reads YAML frontmatter, inline fields, file metadata (creation date, modification date, path)
- **Recent additions**: `hash()` function for deterministic random views, `slice()` for array manipulation, improved inline field rendering in live preview

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | No | Obsidian plugin — runs inside the Obsidian app only |
| API | No | No external API; queries execute within Obsidian |
| MCP Server | Indirect | An Obsidian MCP server could expose Dataview query results; community implementations exist |
| Python SDK | No | |
| Vault as Database | Yes | Agents can write well-structured frontmatter that Dataview consumes for dashboard generation |

### Example Queries for 3D Pen Vault

**Research progress dashboard:**
````
```dataview
TABLE status, domain, author, updated
FROM "02-Research"
SORT domain ASC, updated DESC
```
````

**Tool verdicts summary:**
````
```dataview
TABLE verdict, domain
FROM "04-Tools"
WHERE contains(tags, "tool-evaluation")
SORT verdict ASC
```
````

**Open questions across domains:**
````
```dataview
LIST open_questions
FROM "02-Research"
WHERE open_questions
FLATTEN open_questions
```
````

**Agent activity tracker:**
````
```dataview
TABLE author AS "Agent", count(rows) AS "Notes"
FROM "02-Research" OR "04-Tools"
GROUP BY author
```
````

### Pros and Cons

| Pros | Cons |
|------|------|
| Turns vault frontmatter into a live project dashboard | Only renders inside Obsidian; no CLI or external access to query results |
| DQL is approachable for basic queries; DataviewJS for advanced needs | Agents cannot run Dataview queries — they must read raw files instead |
| Encourages disciplined frontmatter conventions (enforced by SOP-0001) | Performance can degrade with very large vaults (thousands of notes) |
| Supports our quality gate tracking (QG-1 through QG-5) | DataviewJS queries can become complex and hard to maintain |
| MIT license; mature, heavily adopted plugin | Successor project (Datacore) has been in development for a long time |

### Verdict

**ADOPT**

> Dataview is essential for the human side of vault management. While agents cannot execute Dataview queries directly, the dashboards it produces from agent-written frontmatter provide project-level visibility into research progress, tool verdicts, decision status, and cross-domain gaps. Dataview is the "read layer" that makes the vault's structured metadata useful. Combined with the strict frontmatter conventions in SOP-0001, Dataview queries become the project's reporting system. Adopt for all vault dashboards and status pages.

### Getting Started

```
# Install via Obsidian Community Plugins:
# Settings → Community Plugins → Browse → Search "Dataview" → Install

# Enable in Settings:
# Dataview Settings → Enable JavaScript Queries (for DataviewJS)
# Dataview Settings → Enable Inline Queries

# Add a dashboard to Home.md:
# See example queries above
```

### References

1. [Dataview Documentation](https://blacksmithgu.github.io/obsidian-dataview/)
2. [Dataview GitHub](https://github.com/blacksmithgu/obsidian-dataview)
3. [Dataview Beginner's Guide](https://obsidian.rocks/dataview-in-obsidian-a-beginners-guide/)

---

## Summary Matrix

| Tool | Verdict | Role in Project | Integration Method | Priority |
|------|---------|----------------|-------------------|----------|
| **Claude Code** | **ADOPT** | Agent runtime for all domain agents | CLI, SDK, MCP | Immediate |
| **MCP Servers** | **ADOPT** | Tool integration backbone | JSON-RPC, stdio/HTTP | Immediate |
| **LangGraph** | **ASSESS** | Complex workflow orchestration | Python SDK | Phase 2+ |
| **CrewAI** | **ASSESS** | Role-based multi-agent with shared memory | Python SDK | Phase 2+ |
| **AutoGen / MS Agent Framework** | **HOLD** | Conversational multi-agent | Python SDK | Revisit Q2 2026 |
| **Templater** | **TRIAL** | Template enforcement for human-authored notes | Obsidian plugin | Immediate |
| **Dataview** | **ADOPT** | Vault dashboards and project reporting | Obsidian plugin | Immediate |

## Architecture Fit

The following diagram shows how these tools relate within the project's agent architecture:

```
┌────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                               │
│                   (Claude Code session)                         │
│                                                                 │
│  Dispatches tasks via Context Passing Template (SOP-0002)      │
└──────┬──────────┬──────────┬──────────┬────────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
  │hardware │ │embedded │ │  ml    │ │ software │  ← Domain Agents
  │ -agent  │ │ -agent  │ │-agent  │ │  -agent  │    (Claude Code)
  └────┬────┘ └────┬────┘ └───┬────┘ └────┬─────┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   MCP Servers   │  ← Tool Layer
              │  (web-search,   │
              │   filesystem,   │
              │   github, ...)  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Obsidian Vault │  ← Knowledge Base
              │  (Markdown +    │
              │   Frontmatter)  │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        ┌──────────┐    ┌───────────┐
        │Templater │    │ Dataview  │  ← Human Dashboard Layer
        │(templates)│    │(queries)  │
        └──────────┘    └───────────┘
```

**Immediate stack (Phase 1):** Claude Code + MCP Servers + Dataview + Templater
**Future evaluation (Phase 2+):** LangGraph or CrewAI for complex orchestration if Claude Code's native subagent model proves insufficient

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial evaluation of 7 tools across 6 categories |
