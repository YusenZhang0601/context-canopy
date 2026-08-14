# Second Brain MCP

MCP server for searching and managing the Second Brain knowledge base and personal AI substrate.

## Features

- **Search**: Search across all knowledge base documents with multi-keyword ranking
- **Capture**: Save durable sources first, then transactionally create or update atomic canonical cards
- **Browse**: List and filter entries by category, tags, or date
- **Read**: Get complete content of any knowledge entry
- **Personal AI Context**: Read fixed common rules, Agent profiles, mountain state, and Vault-owned `second-brain-*` Skills
- **Smart Skill**: host-native `capture-knowledge` skill for intelligent extraction from conversations and working directory (`$capture-knowledge` or `/skills` in Codex; slash form only where the host supports it)

## Quick Start

### Use the Skill (Recommended)

The easiest way to capture knowledge:

```
You: "保存这次调试经验到知识库"
AI: [triggers the host-native capture-knowledge skill]
AI: [stores the durable source, extracts atomic candidates, presents them]
AI: [confirms one stable scope per candidate]
AI: [saves candidates serially to Second Brain]
```

**Skill triggers:**
- "保存知识" / "capture knowledge"
- "提取经验" / "记录到知识库"
- "导入文档" / "save to second brain"

### Use Tools Directly

Or call MCP tools directly for programmatic access.

## Tools

### 1. `get_common_rules`

Read `90-System/Personal-AI/COMMON-RULES.md`, the single common-rule authority shared by every attached Agent.

### 2. `get_agent_profile`

Read one independent Agent role from `90-System/Personal-AI/AGENTS/<agent_id>.md`.

**Parameters:**
- `agent_id` (string): Lowercase instance identifier such as `codex`, `claude`, `antigravity`, or `hermes`

### 3. `get_mountain_context`

Read the long-term direction overview, or one named mountain under `03-Personal/Mountains`.

**Parameters:**
- `mountain` (string, optional): Exact mountain filename or title; omit it for overview.

### 4. `list_second_brain_skills`

List valid `second-brain-*` Skill directories under the Vault authority. Results include identity, description, source path, and SHA-256.

### 5. `read_second_brain_skill`

Read one exact `second-brain-*` `SKILL.md` from the Vault authority.

**Parameters:**
- `skill_id` (string): Exact ID such as `second-brain-help`

### 6. `search_knowledge`

Search the knowledge base for relevant information.

**Parameters:**
- `query` (string): Search keywords or phrases

### 7. `capture_from_conversation`

Capture knowledge from conversation/documents and transactionally save to Second Brain.

**Parameters:**
- `title` (string): Entry title
- `content` (string): Main content
- `category` (enum): `Experience` | `Projects` | `Technical`
- `summary` (string): One-line summary
- `card_form` (enum): `atomic` or `entity`
- `atomic_scope` (string): One-line declaration of the page's single stable subject
- `tags` (array): Controlled tags registered in `90-System/ONTOLOGY.md`
- `confidence` (enum): `low` | `medium` | `high`
- `source_refs` (array): Vault-relative paths, absolute local paths, or URLs
- `aliases` (array): Previous titles or aliases
- `freshness` (enum): `timeless` | `current` | `stale` | `blocked`
- `review_after` (date): Required only for `current`
- `relations` (array): `{ target, label, reciprocal_label? }`
- `target_path` (string, optional): Update an existing page instead of creating a new one

### 8. `get_entry`

Read complete content of a knowledge entry.

The resolved file must remain inside `01-Knowledge` after both lexical normalization and real-path resolution; symlinks that leave the root are rejected.

**Parameters:**
- `path` (string): Relative path within `01-Knowledge`

### 9. `list_entries`

List knowledge entries with filtering and sorting.

**Parameters:**
- `category` (enum): `Experience` | `Projects` | `Technical` | `all`
- `tag_filter` (string, optional): Filter by tag substring
- `sort_by` (enum): `updated` | `created` | `title`
- `limit` (number): Max results (default: 20)

Only the four declared category values are accepted. Direct calls cannot use `..` to leave `01-Knowledge`, and a category directory that resolves through a symlink outside the root is rejected.

## Configuration

In client configuration (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["<path-to-repo>/mcp/index.js"],
      "env": {
        "SECOND_BRAIN_VAULT_PATH": "<path-to-repo>/vault"
      }
    }
  }
}
```

## Validation

```bash
cd mcp
npm test
SECOND_BRAIN_FULL_VAULT_PATH=../vault npm run test:stdio-full-vault
npm audit --audit-level=low
```

## License

MIT
