# ContextCanopy Agent Entry

This repository is the public ContextCanopy distribution. It is not a user's personalized authority.

## Route before acting

- For setup or migration, read `README.md` and `skills/second-brain-attach/SKILL.md`; finish with `second-brain-doctor` in a fresh host session.
- For Vault reads or writes, work from `vault/` and read `vault/AGENTS.md` completely before acting.
- For MCP code or tests, work from `mcp/` and read `mcp/AGENTS.md` completely before acting.
- For documentation changes, keep `README.md` and `README.zh-CN.md` semantically aligned. Do not translate code, paths, commands, or compatibility identifiers.

## Privacy and authority boundary

- Before writing real personal context, have the user choose `local-only` or `private-remote` authority.
- The public ContextCanopy remote is distribution-only. Never push a personalized Vault, raw conversations, credentials, private repository URLs, unpublished research, or sensitive evidence to it.
- A `private-remote` setup must use a separate repository whose private visibility and writable identity were verified live. A public fork is not a personal Vault.
- Keep common user context separate from each Agent's role. A new Agent should recognize the same person without becoming a clone of another Agent.

## Portability claims

- ContextCanopy moves user-owned durable context, Skills, and host projections. It does not move model weights, hidden provider memory, credentials, permissions, or active runtime state.
- Selected accessible conversations and exports can be migrated through the guided Distill workflow. Do not claim a universal one-click provider-memory importer unless one has been implemented and verified.
- Configuration-file presence is not installation proof. Attach and Sync complete only after the target host passes a fresh-session Doctor check.

## Completion evidence

Run checks that match the change. For a repository-wide release change, run:

```bash
npm test
npm run smoke

cd mcp
node --check index.js
node --check lib/vault-writer.js
node --check scripts/stdio-full-vault-smoke.mjs
npm pack --dry-run
npm audit --audit-level=low
```

Tests must use temporary copies and must not write to a live personalized Vault. Report untested hosts and remaining migration limits explicitly.
