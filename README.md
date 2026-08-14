<div align="center">

<img src="docs/assets/tony-system-builder-banner.png" alt="TonyRainforest — System Builder" width="100%" />

<h1>ContextCanopy</h1>

<p><strong>One human. Many agents. Shared continuity.</strong></p>

<p>
  A local-first, compiled personal AI substrate that gives every agent you use<br />
  shared memory, identity, goals, rules, and evidence—without a black-box cloud memory.
</p>

<p>
  <a href="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ea44f.svg" /></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-6f42c1.svg" /></a>
  <a href="https://obsidian.md"><img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-ready-7c3aed.svg" /></a>
  <img alt="Local-first" src="https://img.shields.io/badge/local--first-Markdown-111827.svg" />
</p>

<p>
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a>
</p>

</div>

---

Your AI tools change. Your context should not.

Claude, Codex, Cursor, ChatGPT, AntiGravity, and future agents should not each learn a different, disposable version of you. ContextCanopy gives them one inspectable continuity layer while preserving each agent's own role and strengths.

It is an open-source personal AI memory and knowledge system built from plain Markdown, an Obsidian-compatible vault, host-native Agent Skills, a thin Model Context Protocol (MCP) server, and deterministic integrity checks.

## Why ContextCanopy exists

Most AI memory products optimize retrieval. ContextCanopy optimizes **continuity you can inspect and govern**:

- **One person, distinct agents.** Agents share the same user context, long-term directions, and common rules without becoming interchangeable clones.
- **Sources before summaries.** Raw evidence stays separate from the canonical graph, so a conclusion can be traced back instead of merely remembered.
- **Compilation before retrieval.** Agents maintain atomic, linked Markdown knowledge rather than treating every old document as an undifferentiated vector chunk.
- **Learning with boundaries.** Reusable lessons may be adopted; identity, privacy, permission, and high-impact changes still require an owner decision.
- **Files are the authority.** No required hosted service, proprietary memory store, model provider, or background daemon.

## What makes it different

| Compared with | ContextCanopy's position |
|---|---|
| Closed AI memory | Human-readable Markdown is the authority; models and hosts are replaceable. |
| Vector memory / ad-hoc RAG | Retrieval is useful, but durable conclusions are compiled into a sourced, canonical graph. |
| An Obsidian template | The vault is paired with Agent Skills, MCP tools, transactional writes, and a compiler. |
| A LifeOS or task dashboard | ContextCanopy is a continuity and knowledge substrate, not a life-planning UI or autonomous task orchestrator. |
| A basic LLM Wiki | It adds shared user identity, distinct Agent roles, long-term "mountains," cross-host sync, and write-time integrity gates. |
| Unbounded self-evolving agents | Learning is evidence-gated, owner-scoped, reversible, and does not silently retrain a model or rewrite its core identity. |

ContextCanopy is inspired by the durable-artifact direction of [Andrej Karpathy's LLM Wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and by the broader personal-AI ambition visible in projects such as [LifeOS](https://github.com/danielmiessler/LifeOS). It is an independent implementation with a different center of gravity: multi-Agent continuity, evidence governance, and a compiled personal knowledge graph.

## How it works

```text
        Claude · Codex · Cursor · ChatGPT · AntiGravity · other hosts
                              │
                    host-native Skills + MCP
                              │
                  ┌───────────▼───────────┐
                  │     ContextCanopy      │
                  │ rules · roles · goals │
                  └───────────┬───────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
 immutable sources     canonical Markdown      deterministic checks
 papers · chats        knowledge · insights    links · freshness
 manuals · evidence    personal context        provenance · rollback
```

The public repository is a clean distribution template. Your personalized vault becomes your own authority and must remain local or live in a separate private repository.

## Quick start

### Requirements

- Node.js 18 or newer
- Python 3.9 or newer with PyYAML (`python3 -m pip install pyyaml`)
- Obsidian is optional; any Markdown editor works

### Install and verify

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy

cd mcp
npm ci
cd ..

npm test
npm run smoke
```

Then open `vault/` as an Obsidian vault, or open the repository in an Agent-capable workspace.

### Let an Agent attach itself

Give a compatible Agent this prompt from the repository root:

```text
Read the repository instructions and attach this host to ContextCanopy.
Before writing personal information, ask me to choose local-only or private-remote authority.
Install the bundled Skills, configure the local MCP server, run the documented checks,
and report only what was actually verified.
```

The Agent should discover the exact host-native invocation syntax. For example, Codex uses `$skill-name` or the `/skills` picker; a literal slash command is only valid when that host actually supports it.

## Protect your private context

This public repository is **distribution, not personal authority**.

Before adding your profile, history, rules, or long-term goals, choose one mode:

1. **Local-only** — keep personal commits and backups on your own devices; do not push them.
2. **Private-remote** — keep this public repository as read-only upstream and use a separate, user-controlled repository that has been verified private as the only writable origin.

Do not use a public fork as your personal vault. ContextCanopy's tooling rejects path traversal and escaping symlinks, but repository privacy and remote configuration remain the user's responsibility.

## Included capabilities

### Eight Agent Skills

| Skill | Purpose |
|---|---|
| `capture-knowledge` | Preserve a source, then create or update one atomic canonical topic. |
| `second-brain-attach` | Attach a new or reinstalled Agent host. |
| `second-brain-sync` | Reconcile shared rules and an Agent's distinct role. |
| `second-brain-learn` | Distill reusable lessons from the current work trace. |
| `second-brain-distill` | Extract durable value from selected conversation archives. |
| `second-brain-climb` | Maintain evidence-backed long-term direction models. |
| `second-brain-doctor` | Diagnose installation, authority, and configuration drift read-only. |
| `second-brain-help` | Explain the system and route a request to the smallest correct Skill. |

### Nine MCP tools

- **Knowledge:** `search_knowledge`, `get_entry`, `list_entries`, `capture_from_conversation`
- **Personal AI authority:** `get_common_rules`, `get_agent_profile`, `get_mountain_context`
- **Skill discovery:** `list_second_brain_skills`, `read_second_brain_skill`

The MCP server exposes fixed roots rather than arbitrary filesystem access. Canonical knowledge writes are transactional: preflight, source preservation, typed relations, reciprocal updates, derived-view rebuild, final compiler check, and rollback share one failure boundary.

### Compiled vault governance

The bundled compiler checks, among other invariants:

- required frontmatter and honest freshness state;
- unique canonical ownership and atomic scope;
- unresolved, ambiguous, self, inbound, and outbound links;
- graph connectivity and orphan nodes;
- source coverage, backlinks, and content hashes;
- deterministic `INDEX.md` and `SOURCE-COVERAGE.md` views;
- atomicity review records for changed canonical pages.

## Repository map

```text
context-canopy/
├── vault/          # Obsidian-compatible evidence and canonical knowledge graph
├── mcp/            # local stdio MCP server and transactional writer
├── skills/         # eight cross-host Agent Skills
├── docs/assets/    # TonyRainforest brand assets
└── .github/        # CI and contribution templates
```

## Validation

```bash
# Vault compiler + linter + MCP tests
npm test

# Isolated full-vault stdio smoke test
npm run smoke

# Module and package checks
cd mcp
node --check index.js
node --check lib/vault-writer.js
npm pack --dry-run
npm audit --audit-level=low
```

Tests operate on temporary copies; they must not mutate a live personalized vault.

## Project name and compatibility

**ContextCanopy** is the public project and product name. The v1 release keeps the existing `second-brain-*` Skill IDs, MCP configuration key, and `SECOND_BRAIN_*` environment variables as compatibility namespaces. They are interfaces, not the public brand, and will not be renamed casually without a migration path.

## Contributing

Useful contributions include host adapters, adversarial filesystem tests, clearer onboarding, realistic seed graphs, and portability fixes.

Read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report vulnerabilities through [SECURITY.md](SECURITY.md). Feature requests and design discussions are welcome in [GitHub Issues](https://github.com/YusenZhang0601/context-canopy/issues).

## License

[MIT](LICENSE) © 2026 [TonyRainforest](https://github.com/YusenZhang0601).

<div align="center">

Built by **TonyRainforest · System Builder**<br />
Connect complexity. Create order. Evolve continuously.

</div>
