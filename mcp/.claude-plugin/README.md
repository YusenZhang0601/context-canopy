# Second Brain Plugin

Local MCP integration for the canonical knowledge graph plus a thin, allowlisted personal-AI authority bridge.

## Tools

- `search_knowledge`: recursively search canonical Knowledge pages.
- `get_entry`: read one Knowledge page and parsed frontmatter.
- `list_entries`: list one legacy category or every `01-Knowledge` subdirectory with `category: all`.
- `capture_from_conversation`: transactionally create or update one atomic topic or concise entity page.
- `get_common_rules`: read the single common-rule authority.
- `get_agent_profile`: read one independent Agent profile by safe instance ID.
- `get_mountain_context`: read the long-term overview or one named mountain.
- `list_second_brain_skills`: list Vault-owned `second-brain-*` Skills and hashes.
- `read_second_brain_skill`: read one exact Vault-owned `SKILL.md`.

Capture requires a durable-source decision, `card_form`, one-line `atomic_scope`, controlled tags, and typed relations. Full README files, reports, logs, and conversation transcripts belong in `04-Sources`; the Skill extracts atomic candidates from them and submits candidates serially.

After the capture lock is acquired, a compiler baseline runs before any write. Inherited errors return `vault_baseline_failed` without touching the Vault. A healthy transaction updates the canonical page, reciprocal relations, atomicity review registry, derived INDEX/source ledger, and append-only LOG; a later failure restores both bytes and file modes.

## Requirements

- Node.js (>= 18.0.0)
- Second Brain Knowledge Vault directory (`vault/`)
- Read access to all three canonical domains, `04-Sources`, `90-System`, and the external authority roots already registered in canonical `sources:`
- Write access to `04-Sources` for source-first capture and to `01-Knowledge` plus `90-System` for transactional canonical updates

Writes still expose only `01-Knowledge`. Five additional read tools expose only fixed common-rule, Agent-profile, mountain, and Skill roots; they reject traversal and escaping symlinks and never read `04-Sources`. Read access to the rest of `02-Insights` and `03-Personal` remains necessary because every capture runs a full canonical compiler baseline and final gate; registered external authorities are read only to verify existence and SHA. New raw material should enter `04-Sources`; adding a new external authority root requires a manifest permission review, and the full-Vault smoke statically checks that every absolute canonical authority is covered. All file access and search run locally. There is no generic personal-AI write tool, DB, daemon, inference API, or packaged copy of the private Skills.
