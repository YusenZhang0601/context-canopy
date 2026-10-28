# Changelog

All notable changes to ContextCanopy are documented here.

## [1.1.0] - 2026-10-27

### Highlights

ContextCanopy v1.1.0 upgrades local retrieval from single-folder substring matching to a **zero-dependency, three-layer BM25F graph search engine** with native Chinese/English word segmentation and **1-hop bidirectional relation expansion**, while keeping canonical Markdown as the single source of truth and adding zero external database or embedding dependencies.

### Added

- **Zero-Dependency CJK/English Word Segmenter & 6-Zone BM25F Search Engine (`mcp/lib/search-engine.js`)**:
  - Uses Node's built-in `Intl.Segmenter('zh-CN', { granularity: 'word' })` paired with CJK bigram fallback and lightweight English stemming so multi-term Chinese and mixed Chinese/English queries tokenize cleanly without native addons or external NLP packages.
  - Implements 6-zone BM25F scoring across `title` (weight `8.0`), `aliases` (`6.0`), `summary` (`4.0`), `headings` (`3.0`), `tags` (`2.5`), and `body` (`1.0`), plus exact title/alias bonuses, ordered phrase bonuses, and query-term coverage scaling so target canonical cards rank `#1` ahead of longer pages that merely repeat shared domain terms.
- **Three-Layer Canonical Graph Search & Read (`01-Knowledge`, `02-Insights`, `03-Personal`)**:
  - `search_knowledge` (`scope: 'all' | 'knowledge' | 'insights' | 'personal'`, default `'all'`), `get_entry`, and `list_entries` now span all three canonical graph layers (`01-Knowledge`, `02-Insights`, `03-Personal`) while enforcing lexical and `realpathSync` containment per layer root so symlinks cannot escape outside the canonical graph.
  - Public MCP writes (`capture_from_conversation`) remain strictly scoped to `01-Knowledge`.
- **1-Hop Bidirectional Graph Context & Clean Density Excerpts**:
  - `get_entry` now returns `canonical_path`, `layer`, `freshness`, `review_after`, and resolved 1-hop `outbound_relations` and `inbound_relations` (`label`, `target`/`source_path`, `title`, `layer`, `freshness`) so agents can traverse the semantic neighborhood of any card in a single read.
  - `search_knowledge` strips raw YAML frontmatter before generating excerpts and selects the highest query-density body window (`240` chars), returning structured metadata (`layer`, `freshness`, `review_after`, `confidence`, `card_form`, `summary`, `matched_fields`).
- **In-Memory `mtimeMs` Graph Cache**:
  - Added an automatically invalidated in-memory canonical graph cache keyed by file count and maximum `mtimeMs` across the three canonical roots, keeping repeated searches sub-millisecond and automatically invalidating after `capture_from_conversation`.

### Changed

- Updated `vault/90-System/Personal-AI/COMMON-RULES.md` to document the 3-layer MCP retrieval routing (`get_mountain_context` for named mountains, `search_knowledge` across `01-Knowledge`/`02-Insights`/`03-Personal`, and `get_entry` with 1-hop relation expansion).
- Refined `second-brain-learn` (both `skills/second-brain-learn/SKILL.md` and its `vault/90-System/Personal-AI/SKILLS/second-brain-learn/SKILL.md` mirror) so natural-language Second Brain learning requests route to `/second-brain-learn` while host-native `/learn` remains reserved for workspace-local rule learning.

## [1.0.2] - 2026-08-23

### Changed

- Changed Learn from append-only accumulation to explicit active-rule transitions: add, no-op, correct, narrow, broaden, replace, merge, relocate, or retire.
- Required project-level learning to reach the project's real automatically injected instruction surface instead of stopping at a canonical note or pointer.
- Added paired fresh-session acceptance so corrected rules must prove both the new behavior and the superseded behavior's exit.
- Added Doctor checks for duplicate owners, stale active rules, tombstones, arbitrary size caps, and incomplete projection updates.
- Kept public/private authority, privacy, permission, and `local-only` / `private-remote` boundaries unchanged.

## [1.0.1] - 2026-08-15

### Fixed

- Corrected the private-template bootstrap command so it can be copied directly from the rendered README.
- Refreshed the official GitHub Actions to their current Node 24 runtime releases while preserving project tests at Node.js 18 and Python 3.10.

## [1.0.0] - 2026-08-15

### Portable Core

- User-owned, Obsidian-compatible Markdown authority with an immutable evidence layer.
- Eight Agent Skills for capture, attachment, synchronization, learning, distillation, long-term direction, diagnosis, and help.
- Nine allowlisted MCP tools for knowledge, personal-AI authority, and Skill discovery.
- Separate common user rules and Claude, Codex, AntiGravity, and Hermes role contracts.
- Atomic canonical ownership, provenance, freshness, graph integrity, deterministic derived views, and transactional rollback.
- Reproducible two-process Claude → ContextCanopy → Codex migration smoke with compiler and live-byte guards.
- Private-first and local-only bootstrap instructions that prevent the public template from becoming a personal writable remote.

### Honest boundaries

- Provider-native Memory is not universally importable; accessible exports and selected sources use guided, evidence-preserving migration.
- Every real Agent host still requires a fresh-session attachment check.
- The `context-canopy-mcp` package ships as repository source and a GitHub Release artifact; v1.0.0 does not claim npm publication.
- ContextCanopy stores plaintext files and relies on private remotes, filesystem permissions, encrypted backups, and secret hygiene for confidentiality.

[1.1.0]: https://github.com/YusenZhang0601/context-canopy/releases/tag/v1.1.0
[1.0.2]: https://github.com/YusenZhang0601/context-canopy/releases/tag/v1.0.2
[1.0.1]: https://github.com/YusenZhang0601/context-canopy/releases/tag/v1.0.1
[1.0.0]: https://github.com/YusenZhang0601/context-canopy/releases/tag/v1.0.0
