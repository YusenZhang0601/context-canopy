# Contributing to ContextCanopy

Thank you for helping make personal AI continuity more inspectable, portable, and trustworthy.

## Good contribution areas

- host adapters and setup guidance;
- adversarial tests for path, symlink, transaction, and privacy boundaries;
- clearer onboarding and cross-platform fixes;
- small, realistic seed-graph examples;
- improvements to Skills, MCP tools, or compiler diagnostics.

Open an issue before a large design change. Small documentation fixes and focused regression tests can go directly to a pull request.

## Privacy first

This repository is a public distribution template. Never include real personal profiles, conversation archives, credentials, private repository URLs, unpublished research, or a personalized Vault in an issue, fixture, or pull request.

Use synthetic data in tests. If a bug requires sensitive evidence, follow [SECURITY.md](SECURITY.md) instead of posting it publicly.

## Development setup

```bash
git clone https://github.com/YusenZhang0601/context-canopy.git
cd context-canopy/mcp
npm ci
cd ..
python3 -m pip install pyyaml
```

## Required checks

Run checks that match your change. Before requesting review, the full suite should pass:

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

Tests must use temporary copies and must not write to a live personalized Vault.

## Pull request expectations

- Keep the change narrow and explain the user-visible problem it solves.
- Add a direct regression test for behavioral fixes.
- Preserve the public/private authority boundary.
- Do not hand-edit deterministic Vault views such as `INDEX.md` or `SOURCE-COVERAGE.md`.
- Report exactly which checks ran and any platform or host that remains untested.
- Avoid unrelated formatting, dependency, or naming changes.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
