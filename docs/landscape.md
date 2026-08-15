# ContextCanopy project landscape

Last reviewed: 2026-08-15

This is a positioning map, not a claim that ContextCanopy invented agent memory or portability. The projects below solve overlapping problems at different layers. Links point to primary project sources; volatile star counts are intentionally omitted.

## Closest comparisons

| Project | Center of gravity | Meaningful overlap | ContextCanopy's different emphasis |
|---|---|---|---|
| [Basic Memory](https://github.com/basicmachines-co/basic-memory) | Local Markdown knowledge graph exposed through MCP | Human-readable files, knowledge relations, multiple AI clients | Migration of a whole governed personal-AI context: common user rules, distinct agent roles, long-term directions, Skills, evidence, and freshness |
| [AgentCairn](https://github.com/ccf/agentcairn) | Git-backed memory shared by coding agents | Cross-agent recall, local ownership, host integration, migration concerns | Broader personal continuity beyond coding memory, with compiled canonical ownership and a separate immutable evidence layer |
| [Memorix](https://github.com/AVIDS2/memorix) | Shared memory for coding agents through MCP | Cross-tool project memory and agent handoff | User identity and personal context remain first-class, while agents keep independent role contracts |
| [Dory](https://github.com/deeflect/dory) | Persistent memory for AI coding workflows | Durable recall across coding sessions and tools | Evidence-governed personal substrate rather than a coding-memory service alone |
| [EIDARA](https://github.com/jrotllant/eidara) | Markdown-oriented agent memory | Plaintext ownership and structured memory | Transactional capture, compiled graph governance, host projections, and explicit privacy/authority boundaries |
| [Agent Memory Protocol](https://github.com/agentmemoryprotocol/agentmemoryprotocol) | A proposed interchange protocol for agent memory | Portability as an ecosystem concern | A working local personal context system today; a future protocol adapter could complement rather than replace it |

AgentCairn is the closest current comparison on the narrow question “can memory move between coding agents?” ContextCanopy makes a wider bet: what must move is not only recalled project facts, but the person's governed context, evidence, long-term directions, shared rules, and the boundaries that keep agents distinct.

## Adjacent memory infrastructure

| Project | What it is useful to study | Why it is not the same product center |
|---|---|---|
| [Mem0](https://github.com/mem0ai/mem0) | Application memory APIs and extraction/retrieval pipelines | Optimizes memory infrastructure for applications; ContextCanopy's authority is a user-readable personal repository |
| [Graphiti](https://github.com/getzep/graphiti) | Temporal knowledge graphs and changing facts | Focuses on graph retrieval infrastructure; ContextCanopy also governs sources, roles, Skills, and personal continuity |
| [Letta](https://github.com/letta-ai/letta) | Stateful, long-running agents with managed memory | Maintains an agent's state; ContextCanopy is designed to survive replacement of the agent itself |

These systems may become optional retrieval or runtime neighbors. ContextCanopy's Markdown authority should remain canonical and any generated index should remain disposable.

## Adjacent personal knowledge systems

- [LifeOS](https://github.com/danielmiessler/LifeOS) demonstrates the ambition of an AI-operable life system. ContextCanopy borrows the breadth of personal context but centers migration, evidence, and independent agent roles rather than a life-planning interface.
- [Andrej Karpathy's LLM Wiki note](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) is a strong reference for maintaining compact, model-readable knowledge. ContextCanopy adds sources, unique ownership, freshness, graph checks, transactional writes, and host projections.
- Stanford's [Portable Memory for AI Agents](https://digitaleconomy.stanford.edu/project/portable-memory/) frames portable memory as a user-choice and competition problem. ContextCanopy is an open-source implementation experiment at the personal context layer, not a claim to implement a universal standard.

## Positioning in one sentence

**ContextCanopy is the local-first, user-owned context passport that lets independent AI agents recognize the same person without becoming the same agent.**

## What would change this map

This comparison should be revised when:

- a neighboring project adopts governed personal identity, provenance, and independent agent roles;
- ContextCanopy ships real provider-native import adapters;
- an interchange protocol becomes stable enough to implement;
- fresh-host compatibility evidence materially changes the supported-agent surface.

Until then, do not claim universal import, automatic migration from closed provider memory, or uniqueness across the whole field.
