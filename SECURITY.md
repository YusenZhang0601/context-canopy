# Security Policy

ContextCanopy handles local knowledge and may eventually contain highly personal context. Privacy-boundary failures, path traversal, escaping symlinks, credential exposure, unintended remote writes, and transaction rollback failures are security issues.

## Supported version

Security fixes target the latest release on the default branch. Older snapshots may not receive backports.

## Report a vulnerability privately

Do not open a public issue for a suspected vulnerability or include private Vault data in a report.

Use GitHub's private vulnerability reporting for this repository when available. Otherwise email **zhangyswx@163.com** with:

- the affected commit or version;
- a minimal reproduction using synthetic data;
- the expected and observed boundary;
- the practical impact;
- any proposed mitigation.

Please do not access data you do not own, test against another person's Vault, publish an exploit before coordination, or perform denial-of-service testing.

## Scope notes

The project is local-first, but that does not automatically make every deployment private. Users remain responsible for filesystem permissions, host configuration, backups, and ensuring that a personalized Vault is never pushed to a public remote.
