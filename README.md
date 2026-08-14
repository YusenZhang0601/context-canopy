<div align="center">

<img src="docs/assets/tony-system-builder-banner.png" alt="TonyRainforest — System Builder" width="100%" />

<h1>ContextCanopy</h1>

<p><strong>Switch agents. Keep your context.</strong></p>

<p>
  The portable, local-first context layer for your personal AI:<br />
  one human, many agents, no memory lock-in.
</p>

<p>
  <a href="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/YusenZhang0601/context-canopy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ea44f.svg" /></a>
  <a href="https://modelcontextprotocol.io"><img alt="MCP" src="https://img.shields.io/badge/MCP-compatible-6f42c1.svg" /></a>
  <a href="https://obsidian.md"><img alt="Obsidian" src="https://img.shields.io/badge/Obsidian-ready-7c3aed.svg" /></a>
  <img alt="Portable context" src="https://img.shields.io/badge/context-portable-0ea5e9.svg" />
  <img alt="Local-first" src="https://img.shields.io/badge/authority-local--first-111827.svg" />
</p>

<p>
  <a href="#the-switching-tax">Why portability?</a> ·
  <a href="#how-portability-works">How it works</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#what-ships-today">What ships</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

</div>

---

## The switching tax

The better an AI agent remembers you, the harder it becomes to leave.

You teach one tool your preferences, projects, vocabulary, decisions, working style, and long-term goals. Then a stronger agent appears—but moving means starting over. So your accumulated context becomes accidental vendor lock-in.

ContextCanopy changes who owns that context.

| Without a portable layer | With ContextCanopy |
|---|---|
| Every agent builds a separate, disposable version of you. | Agents read from one user-owned continuity layer. |
| Switching tools means repeating months of context. | Attach a new host to the same durable authority. |
| Important memory is hidden in chats, caches, or provider state. | Durable context lives in inspectable Markdown and Git-friendly artifacts. |
| Sharing memory risks turning agents into identical clones. | Common user context and agent-specific roles remain separate. |
| “Learning” can silently accumulate contradictions. | Sources, ownership, freshness, checks, and rollback bound each change. |

> **ContextCanopy does not move a model's hidden mind. It moves the durable context that should belong to you.**

Persistent memory, bounded learning, and agent evolution still matter. Portability is the organizing promise: your AI tools can change without taking your accumulated self-knowledge with them.

## How portability works

```text
  Claude memory · Chat exports · project rules · notes · research · decisions
                                  │
                         Capture / Learn / Distill
                                  │
                 ┌────────────────▼────────────────┐
                 │      CONTEXTCANOPY CORE         │
                 │ identity · preferences · rules │
                 │ knowledge · goals · evidence   │
                 │ skills · provenance · history  │
                 └───────┬─────────┬─────────┬─────┘
                         │         │         │
                  Attach + Sync    │    Attach + Sync
                         │         │         │
                      Claude     Codex    future agent
                    own role    own role     own role
```

The portable core is not a giant prompt. It is a small governed system with three layers:

1. **Evidence** — immutable source material such as conversations, papers, manuals, and exports.
2. **Canonical context** — atomic Markdown knowledge, insights, personal context, and long-term “mountains,” each with one owner and traceable sources.
3. **Host projections** — common user rules plus a distinct role for each agent, installed through host-native Skills and a thin MCP bridge.

### A concrete handoff

Suppose Claude has learned how you review scientific evidence, but you now want Codex to implement the next experiment.

1. Preserve the selected conversation or rule as evidence.
2. Distill the durable method into the canonical ContextCanopy core.
3. Attach Codex and sync the common rules plus Codex's own execution role.
4. Run Doctor in a fresh session to prove Codex loaded the authority rather than guessing from old chat context.

Claude keeps its own role. Codex keeps its own role. Both recognize the same person and the same evidence-backed method.

### What moves—and what does not

| Portable by design | Deliberately not claimed as portable |
|---|---|
| Preferences, terminology, collaboration rules | Model weights or hidden provider internals |
| Canonical knowledge, decisions, and provenance | Credentials, permissions, or secret values |
| Long-term goals and evidence-backed progress | An active chat's transient runtime state |
| Selected conversation learning and project experience | Memory a provider does not expose or export |
| Reusable Skills and host-specific role definitions | Host UI settings unless an adapter explicitly supports them |

## More than “longer memory”

| Capability | What it means here |
|---|---|
| 🔄 **Portable continuity** | Replace or add agents without rebuilding durable user context from zero. |
| 🌱 **Bounded learning** | Agents can adopt evidence-backed lessons without silently rewriting identity, permission, or privacy boundaries. |
| 🧭 **One human, distinct agents** | Shared context is common; each agent's responsibilities and strengths remain independent. |
| 🔎 **Evidence before confidence** | Raw sources stay separate from conclusions, and every durable claim can point back to evidence. |
| 🕸️ **Compiled knowledge graph** | Atomic Markdown owners, typed relations, freshness, backlinks, and deterministic derived views replace a pile of chat chunks. |
| 🛡️ **Local authority** | No required hosted memory service, proprietary database, background daemon, or external inference API. |
| ↩️ **Reversible writes** | Canonical writes share one transaction boundary with relation updates, compilation, final checks, and rollback. |
| 🧰 **Host-native operation** | Skills define judgment and workflows; MCP exposes a narrow, allowlisted data plane. |

## Where it fits

ContextCanopy is adjacent to several valuable project categories, but its center of gravity is different.

| Category | Typical strength | ContextCanopy's focus |
|---|---|---|
| Built-in provider memory | Frictionless inside one product | User-owned context that can outlive that product |
| Vector-memory services | Fast semantic recall for applications | Human-readable authority, provenance, and governance |
| Cross-agent Markdown memory | Shared facts and project recall | A whole personal AI substrate: identity, rules, goals, evidence, roles, and Skills |
| Stateful agent platforms | Long-running agents with internal state | Continuity across independent agents and vendors |
| Obsidian / LifeOS templates | Personal organization and dashboards | An Agent-operable, compiled context layer rather than a life-planning UI |

### Related projects worth studying

- [Basic Memory](https://github.com/basicmachines-co/basic-memory) pairs local Markdown with a knowledge graph and broad MCP access.
- [AgentCairn](https://github.com/ccf/agentcairn), [Dory](https://github.com/deeflect/dory), and [Memorix](https://github.com/AVIDS2/memorix) tackle shared memory across coding agents with different storage and retrieval contracts.
- [EIDARA](https://github.com/jrotllant/eidara) explores compiled Markdown memory, while the draft [Agent Memory Protocol](https://github.com/agentmemoryprotocol/agentmemoryprotocol) explores a portable interchange standard.
- [Mem0](https://github.com/mem0ai/mem0), [Graphiti](https://github.com/getzep/graphiti), and [Letta](https://github.com/letta-ai/letta) are strong references for application memory, temporal graphs, and stateful agents.

ContextCanopy does not claim that nobody else works on portability. Its specific bet is that migration must carry **the human's governed context**, not only retrieved facts, while preserving the differences between agents.

The project also draws inspiration from [Andrej Karpathy's LLM Wiki idea](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) and the broader personal-AI ambition in projects such as [LifeOS](https://github.com/danielmiessler/LifeOS).

## Quick start

### Requirements

- Node.js 18 or newer
- Python 3.9 or newer with PyYAML (`python3 -m pip install pyyaml`)
- Obsidian is optional; any Markdown editor works

### 1. Clone and verify

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy

npm ci --prefix mcp
npm test
npm run smoke
```

### 2. Choose where personal authority lives

Before adding real personal context, choose one mode:

- **Local-only** — personal commits and backups stay on your devices; nothing personal is pushed.
- **Private-remote** — the public repository is a read-only `upstream`; a separate repository, verified private, is the only writable `origin`.

Never use a public fork as your personal vault.

### 3. Let an agent attach the host

Open the repository root in a compatible agent and give it this prompt:

```text
Read AGENTS.md and skills/second-brain-attach/SKILL.md, then attach this host to ContextCanopy.
Before writing personal information, ask me to choose local-only or private-remote authority.
Install the bundled Skills, configure the local MCP server, run the documented checks,
and report only what was actually verified. Finish with a fresh-session Doctor check.
```

The root contract routes the Agent to the correct Vault or MCP instructions. The Agent must discover the host's real Skill syntax—for example, Codex uses `$skill-name` or the `/skills` picker rather than pretending every host supports literal slash commands.

## What ships today

### Portability status

| Surface | Status |
|---|---|
| User-owned Markdown authority shared across hosts | ✅ Included |
| Attach, Sync, Learn, Distill, Doctor, and long-term direction workflows | ✅ Included as Agent Skills |
| Selected conversation/archive migration | ✅ Agent-guided; requires an accessible export or source |
| Codex, Claude, AntiGravity, and Hermes role contracts | ✅ Included; each real host still requires fresh-session verification |
| Read/capture access from a generic MCP client | ✅ Protocol surface included; lifecycle integration is host-dependent |
| One-click import from every provider's native memory | 🧭 Roadmap; not currently claimed |

This distinction matters: ContextCanopy already prevents new durable context from becoming vendor-owned and supports evidence-preserving guided migration. Automated adapters for closed provider memory formats are the next portability frontier.

### Eight Agent Skills

| Skill | Purpose |
|---|---|
| `capture-knowledge` | Preserve a source, then create or update one atomic canonical topic. |
| `second-brain-attach` | Attach a new, reinstalled, or reset Agent host. |
| `second-brain-sync` | Reconcile common rules while preserving an Agent's distinct role. |
| `second-brain-learn` | Adopt reusable lessons from the current work trace. |
| `second-brain-distill` | Extract durable value from selected conversation archives. |
| `second-brain-climb` | Maintain evidence-backed long-term direction models. |
| `second-brain-doctor` | Diagnose installation, authority, and drift read-only. |
| `second-brain-help` | Explain the system and route a request to the smallest correct Skill. |

### Nine MCP tools

- **Knowledge:** `search_knowledge`, `get_entry`, `list_entries`, `capture_from_conversation`
- **Personal AI authority:** `get_common_rules`, `get_agent_profile`, `get_mountain_context`
- **Skill discovery:** `list_second_brain_skills`, `read_second_brain_skill`

The MCP server exposes fixed roots rather than arbitrary filesystem access. It rejects traversal and escaping symlinks. Semantic judgment remains in Skills and the current Agent; the server does not call an external model or become a second authority.

### Compiled vault governance

The bundled compiler verifies:

- required metadata and honest freshness;
- unique canonical ownership and atomic scope;
- unresolved, ambiguous, self, inbound, and outbound links;
- graph connectivity and orphan nodes;
- source coverage, backlinks, and content hashes;
- deterministic `INDEX.md` and `SOURCE-COVERAGE.md` views;
- atomicity review records for changed canonical pages.

## Repository map

```text
context-canopy/
├── AGENTS.md       # public root entry and privacy boundary
├── vault/          # Obsidian-compatible evidence + canonical context graph
├── mcp/            # local stdio MCP server + transactional writer
├── skills/         # eight portable Agent Skills
├── docs/assets/    # TonyRainforest brand assets
└── .github/        # CI, security, and contribution surfaces
```

The public repository is a clean distribution template. Your personalized Vault becomes its own authority and should remain local or use a separate private remote.

## Validation you can run

```bash
# Vault compiler + linter + MCP test suite
npm test

# Copy the full seed Vault, exercise MCP over stdio, prove the original stayed byte-identical
npm run smoke

# Package and dependency checks
cd mcp
node --check index.js
node --check lib/vault-writer.js
npm pack --dry-run
npm audit --audit-level=low
```

Tests operate on temporary copies and must not mutate a live personalized Vault. CI runs the same core suite on every push and pull request.

## Honest limits and roadmap

- **Import adapters:** add preview-first importers for provider exports and native memory files, preserving source identity and supersession history.
- **Host evidence:** publish a versioned compatibility matrix based on real fresh-host installation evidence, not configuration-file presence.
- **Migration fixtures:** add reproducible Agent A → ContextCanopy → Agent B acceptance scenarios.
- **Retrieval scale:** keep the Markdown graph canonical while allowing optional, disposable indexes for larger Vaults.

ContextCanopy is plaintext by design, not encrypted storage. Local-first reduces exposure; it does not replace filesystem permissions, encrypted backups, secret hygiene, or careful remote configuration.

## FAQ

<details>
<summary><strong>Is this another vector database?</strong></summary>

No. Retrieval can be added, but the durable authority is compiled Markdown with sources, ownership, relations, and freshness. A future index must remain disposable.
</details>

<details>
<summary><strong>Does every Agent become the same Agent?</strong></summary>

No. Common user context and Agent-specific roles have separate owners. Sharing who you are should not erase what each Agent is good at.
</details>

<details>
<summary><strong>Can it automatically import all of my ChatGPT or Claude memory today?</strong></summary>

Not as a universal one-click importer. Today, accessible conversations, exports, rules, and notes can be preserved and distilled through the guided workflow. Native provider adapters are roadmap work.
</details>

<details>
<summary><strong>Why not just keep one long system prompt?</strong></summary>

Because a prompt does not provide provenance, unique ownership, atomic updates, freshness, graph integrity, rollback, or a safe separation between common context and Agent roles.
</details>

## Project name and compatibility

**ContextCanopy** is the public brand. The v1 release keeps the existing `second-brain-*` Skill IDs, MCP configuration key, and `SECOND_BRAIN_*` environment variables as compatibility namespaces. They will not be renamed casually without a migration path.

## Contributing

The most valuable contributions now are import adapters, host recipes backed by fresh-session evidence, migration fixtures, adversarial filesystem tests, and clearer onboarding.

If memory lock-in has ever stopped you from trying a better Agent, [tell us which context source you need to move first](https://github.com/YusenZhang0601/context-canopy/issues/new?template=feature_request.yml). If this direction resonates, a ⭐ helps other people discover a user-owned alternative.

Read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report vulnerabilities through [SECURITY.md](SECURITY.md). Feature requests and design discussions are welcome in [GitHub Issues](https://github.com/YusenZhang0601/context-canopy/issues).

## License

[MIT](LICENSE) © 2026 [TonyRainforest](https://github.com/YusenZhang0601).

<div align="center">

**Your agents are replaceable. Your context is yours.**

Built by **TonyRainforest · System Builder**<br />
Connect complexity. Create order. Evolve continuously.

</div>
