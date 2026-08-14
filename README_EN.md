# Second Brain

> **Vendor-Independent Personal AI Substrate & Obsidian Knowledge Vault**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.9-blue.svg)](vault/90-System/scripts/compile_vault.py)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.29.0-orange.svg)](https://modelcontextprotocol.io)

[English Documentation](README_EN.md) | [简体中文文档](README.md)

---

## 🌟 Core Philosophy & Design Principles

In the era of Multi-Agent collaboration, developers and knowledge workers use multiple AI models and hosts (such as Claude Code, Cursor, Codex, AntiGravity, Hermes, ChatGPT). However, existing AI tools suffer from two major pain points:
1. **Data & Memory Silos**: Each vendor maintains proprietary, fragmented memory silos. When switching platforms, your hard-won context, workflow patterns, and historical lessons are lost.
2. **Limitations of Ad-hoc RAG**: Relying solely on vector chunks for on-the-fly retrieval fails to synthesize a structured conceptual graph and long-term causal network.

**Second Brain** adopts the **Karpathy LLM-Wiki** philosophy, creating a local-first, vendor-independent, Markdown-driven Personal AI Substrate that users fully own and control:

* **One User Substrate, Distinct Agent Roles**: All agents share a single authoritative user profile, long-term strategic directions (Mountain Climbing Model), and global operating constraints (`COMMON-RULES.md`), while preserving each agent's native strengths in IDE exploration, CLI execution, long-form synthesis, or multi-tool orchestration.
* **Separation of Immutable Evidence & Compiled Graph**: Raw literature, technical manuals, transcripts, and code snapshots reside in `04-Sources`; agents distill and maintain high-cohesion atomic canonical cards (`01-Knowledge`, `02-Insights`, `03-Personal`).
* **Strict Graph Compiler & Static Linter**: Through `compile_vault.py`, the system automatically audits orphan nodes, broken links, ambiguous references, and weak component partitions to prevent knowledge decay.
* **ACID Transactional Writes with Rollback**: The MCP server features an 8-step ACID write pipeline with baseline pre-checks, reciprocal link maintenance, and comprehensive filesystem rollback guards.
* **8 Standard Multi-Agent Skills**: A turnkey suite of cross-host skills ready out-of-the-box.

---

## 🏗️ Architecture Overview

```
                     ┌─────────────────────────────────────────────────────────┐
                     │               Human User / Developer                    │
                     └────────────┬───────────────────────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
                     ┌────────────────────────┐      ┌─────────────────────────┐
                     │   Obsidian GUI / App   │      │   AI Agents & Hosts     │
                     │  (Visual Graph View)   │      │ Claude / Codex / Cursor │
                     └────────────┬───────────┘      │ AntiGravity / Hermes    │
                                  │                  └────────────┬────────────┘
                                  │                               │ MCP / Skills
                                  │                               ▼
                                  │                  ┌─────────────────────────┐
                                  │                  │    Second Brain MCP     │
                                  │                  │  (Node.js stdio Server) │
                                  │                  └────────────┬────────────┘
                                  │                               │
                                  ▼                               ▼
    ┌──────────────────────────────────────────────────────────────────────────────────────────┐
    │                                Second Brain Knowledge Vault                              │
    ├─────────────────────────────┬──────────────────────────────┬─────────────────────────────┤
    │  00-Inbox / 05-Queries      │  01-Knowledge / 02-Insights  │  04-Sources (Evidence Layer)│
    │  (Raw capture & staging)    │  03-Personal (Atomic Graph)  │  (Papers, manuals, chats)   │
    ├─────────────────────────────┴──────────────────────────────┴─────────────────────────────┤
    │  90-System (Governance, SCHEMA, ONTOLOGY, Compiler compile_vault.py, LOG.md, Rules)      │
    └──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```text
second-brain-release/
├── vault/                      # Obsidian Knowledge Vault & Graph Governance
│   ├── 00-Inbox/               # Raw capture buffer for unorganized ideas
│   ├── 01-Knowledge/           # Objective technical, architectural, and methodological notes
│   ├── 02-Insights/            # Value judgments, engineering philosophies, and heuristics
│   ├── 03-Personal/            # User profiles, collaboration setups, and Mountain trackers
│   ├── 04-Sources/             # Immutable evidence layer (raw manuals, papers, conversation traces)
│   ├── 05-Queries/             # Structured Q&A and distillation staging
│   ├── 90-System/              # Schema definitions, Ontologies, logs, and compiler scripts
│   │   ├── Personal-AI/        # Cross-Agent Common Rules and Agent role profiles
│   │   └── scripts/            # Graph compiler (compile_vault.py) and linter suites
│   └── 90-Templates/           # 11 standard note templates
├── mcp/                        # Node.js Model Context Protocol Server
│   ├── index.js                # 9 core MCP tools with adaptive path discovery
│   ├── lib/vault-writer.js     # 8-step ACID transactional writer with rollback guards
│   ├── scripts/                # Isolated full-vault stdio smoke test
│   └── test/                   # 24 automated unit tests
├── skills/                     # 8 Authoritative Multi-Agent Skills
│   ├── capture-knowledge/      # Extract and capture atomic knowledge cards
│   ├── second-brain-attach/    # Bootstrap and attach a new AI agent
│   ├── second-brain-climb/     # 15-item Mountain Climbing model maintenance
│   ├── second-brain-distill/   # Batch conversation extraction and raw data pruning
│   ├── second-brain-doctor/    # Read-only system health and connectivity audit
│   ├── second-brain-help/      # Skill catalog and intelligent intent routing
│   ├── second-brain-learn/     # Extract lessons from conversation with low-risk auto-merge
│   └── second-brain-sync/      # Bidirectional rule sync via Git PRs
├── package.json                # Monorepo unified build and test scripts
└── LICENSE                     # MIT License
```

---

## ⚡ Agent-First Single-Prompt Bootstrap

Send this prompt to any compatible AI Agent (Claude Code, Cursor, AntiGravity, Codex, Hermes, etc.). The Agent may automate safe local steps, but it must pause for authorization before creating a private repository, changing remotes, or expanding permissions.

Important boundary: this public repository is a distribution template, not a writable personal-authority remote. Before personalization, choose `local-only` or `private-remote`; never push personal profiles, history, rules, or mountains back to the public Release repository.

```markdown
You are responsible for initializing and attaching the current environment to Second Brain (the vendor-independent Personal AI Substrate & Obsidian Knowledge Base).
The repository root is the current working directory. Complete this six-step bootstrap workflow:

1. [Language & Platform Detection]: Detect interaction language (English/Chinese) and communicate in the detected language. Identify the host platform (Claude Code / Claude Desktop / AntiGravity / Codex / Cursor / Hermes).
2. [Personal Authority Boundary]: Before writing personal data, ask the user to choose `local-only` or `private-remote`. Local-only forbids remote pushes. Private-remote may use only a user-authorized `origin` verified live as private; the public Release remote is read-only upstream. Confirm before creating a repository or changing remotes.
3. [Skills Registration]: Install or symlink all 8 skills from `skills/`: the standalone `capture-knowledge` skill plus the 7 `second-brain-*` skills.
4. [MCP Configuration]: Generate or update the host's MCP configuration pointing to `mcp/index.js`, setting `SECOND_BRAIN_VAULT_PATH` to the absolute path of `vault/`; do not broaden access to arbitrary files outside the Vault.
5. [Collaborative Identity Setup]: Read the questionnaire at `vault/03-Personal/Profile/user-profile.template.md.example`, but do not copy it into the canonical graph. Update only the existing owners `个人AI协作体系.md` and `Mountains/个人AI基底.md`, synchronize atomicity hashes, and preserve user-confirmation boundaries.
6. [System Doctor & Verification]: Run the compiler and linter inside `vault/`; run `npm test` and `npm audit --audit-level=low` inside `mcp/`; execute `second-brain-doctor`. Report healthy only when every requirement for the selected authority mode passes.

Report completion status with a structured checklist and give the real host-native invocation syntax for capturing the first note or maintaining the first mountain.
```

---

## 🚀 Human Quickstart Guide

### 1. Prerequisites
- **Node.js**: `>= 18.0.0` (Node.js 20+ LTS recommended)
- **Python**: `>= 3.9` (requires PyYAML: `pip install pyyaml`)
- **Obsidian**: Optional, for visual interactive graph exploration.

### 2. Clone and Install

Copy the public clone URL from the hosting page's **Code** button, then run:

```bash
git clone <PUBLIC_REPOSITORY_URL> second-brain
cd second-brain

# Install MCP dependencies
cd mcp && npm install && cd ..
```

The public remote is distribution-only. Before personalization, choose:

- `local-only`: never push; use local Git commits plus a recoverable backup outside the Vault.
- `private-remote`: after explicit authorization, retain the public repository as read-only `upstream` and configure a user-controlled repository verified as private as the only writable `origin`. Do not store personal data in a public fork.

### 3. One-Click Monorepo Verification

Run the unified test suite from the repository root:

```bash
# Run full tests (Vault graph compiler, static linter, and MCP unit tests)
npm test

# Run isolated full-vault stdio smoke test
npm run smoke

# Check Vault compiler status
npm run compile

# Rebuild derived indices (INDEX.md & SOURCE-COVERAGE.md)
npm run compile:write
```

### 4. Open in Obsidian

1. Open Obsidian and select **"Open folder as vault"**.
2. Select the `vault/` directory from this repository.
3. Open **Graph View** from the left ribbon to view the pre-populated 7-card seed graph!

### 5. Manual MCP Configuration

#### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/second-brain/mcp/index.js"],
      "env": {
        "SECOND_BRAIN_VAULT_PATH": "/ABSOLUTE/PATH/TO/second-brain/vault"
      }
    }
  }
}
```

#### Cursor
Add to `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/second-brain/mcp/index.js"],
      "env": {
        "SECOND_BRAIN_VAULT_PATH": "/ABSOLUTE/PATH/TO/second-brain/vault"
      }
    }
  }
}
```

---

## 🛠️ 8 Core Multi-Agent Skills

Invocation syntax is host-specific. Codex uses `$skill-name` or the `/skills` picker and must not be told that a literal `/skill-name` is native; other compatible hosts may use their own slash-command or skill-selection interface. The table shows common forms, while `second-brain-help` must return the actual syntax for the attached host.

| Skill Name | Host Invocations | Description | Inputs | Outputs |
|---|---|---|---|---|
| `capture-knowledge` | `/capture-knowledge`<br>`$capture-knowledge` | Extracts atomic knowledge cards from conversations/docs, maintaining reciprocal links and source provenance. | Title, content, category, `card_form` (`atomic`/`entity`), `atomic_scope`, relations | Transactionally updated canonical card, `ATOMICITY-REVIEW.json`, and derived index rebuild |
| `second-brain-attach` | `/second-brain-attach`<br>`$second-brain-attach` | Connects a new/reinstalled AI agent to Second Brain, configures MCP, and injects managed identity blocks. | Host platform, Vault path | Injected host config blocks, registered skills, attachment receipt |
| `second-brain-climb` | `/second-brain-climb`<br>`$second-brain-climb` | Maintains 15-item strategic Mountain Climbing models (Summit, Gaps, Active Bets, Next Info Action). | Mountain name, new work evidence | Updated `03-Personal/Mountains/<name>.md`, high-risk summit drift confirmation |
| `second-brain-distill` | `/second-brain-distill`<br>`$second-brain-distill` | Distills conversation batches into durable knowledge/rules, cleaning raw data after integrity checks. | Conversation allowlist, export batches | Distilled canonical notes, promoted attachments, deletion receipt |
| `second-brain-doctor` | `/second-brain-doctor`<br>`$second-brain-doctor` | Read-only diagnostic tool auditing the 7 Second Brain skills, standalone capture skill, MCP, authority mode, and configuration drift. | None (read-only audit) | Structured diagnostic table (PASS/DRIFT/BLOCKED/UNKNOWN) |
| `second-brain-help` | `/second-brain-help`<br>`$second-brain-help` | Interactive catalog listing all skills and host-specific syntaxes, routing user intent to the minimal skill. | User intent description | Recommended skill, exact invocation syntax, side-effects warning |
| `second-brain-learn` | `/second-brain-learn`<br>`$second-brain-learn` | Extracts reusable preferences and lessons from current chat; auto-merges low-risk items, prompts on high-risk items. | Conversation transcript, user feedback | Updated COMMON-RULES, Agent profile, or canonical cards |
| `second-brain-sync` | `/second-brain-sync`<br>`$second-brain-sync` | Synchronizes common rules and agent profiles; local-only keeps local history, while private-remote uses private PRs. | Host config, Vault rules | Synchronized managed blocks, drift resolution report |

---

## 🔌 MCP Tool Matrix (9 Tools)

| Tool Name | Type | Access Target / Authority | Description |
|---|---|---|---|
| `get_common_rules` | Read-only | `90-System/Personal-AI/COMMON-RULES.md` | Retrieves the single common-rule authority shared by all agents. |
| `get_agent_profile` | Read-only | `90-System/Personal-AI/AGENTS/{agent_id}.md` | Retrieves the role definition for a specific agent instance. |
| `get_mountain_context` | Read-only | `03-Personal/Profile/` or `03-Personal/Mountains/` | Reads mountain overview or a specific 15-item strategic mountain model. |
| `list_second_brain_skills` | Read-only | `90-System/Personal-AI/SKILLS/` | Lists all valid Vault-owned skills with descriptions and SHA-256 hashes. |
| `read_second_brain_skill` | Read-only | `90-System/Personal-AI/SKILLS/{id}/SKILL.md` | Reads the complete workflow definition of a specific skill. |
| `search_knowledge` | Read-only | `01-Knowledge/**/*.md` | Performs multi-keyword weighted search across knowledge entries. |
| `get_entry` | Read-only | `01-Knowledge/{path}` | Retrieves complete markdown, metadata, and wikilinks of a note. |
| `list_entries` | Read-only | `01-Knowledge/` subdirectories | Filters, sorts, and paginates knowledge entries by category and tags. |
| `capture_from_conversation` | Transactional Write | `01-Knowledge/` + `90-System/` | 8-step ACID write engine: schema validation, reciprocal updates, compiler baseline/check, rollback guard. |

---

## 🛡️ Knowledge Governance & Compiler Invariants

To ensure the knowledge vault remains pristine and corrosion-free across years of autonomous agent writes:

1. **Atomic Card Constraint**: Every note must declare `card_form: atomic|entity` and a one-line `atomic_scope` ($\le 200$ chars). Prose must never contain multi-topic document structures.
2. **Closed-Loop Relation Network**: New cards must specify at least 2 distinct relation targets, with reciprocal symmetry strictly maintained (`上位概念` $\leftrightarrow$ `组成部分`).
3. **Single Weakly Connected Component**: The compiler guarantees zero orphan notes and exactly 1 connected component across the canonical graph.
4. **Deterministic Derived Layer**: `INDEX.md` and `SOURCE-COVERAGE.md` are deterministically generated by the compiler; manual editing is forbidden.
5. **Hash Registry**: `ATOMICITY-REVIEW.json` tracks SHA-256 hashes of all canonical cards, ensuring full tamper-evidence.

---

## 🤝 Contributing & License

Contributions of new Multi-Agent Skills, domain seed knowledge graphs, or client adapters are warmly welcomed!

This project is licensed under the [MIT License](LICENSE).
