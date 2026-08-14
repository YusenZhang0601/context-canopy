import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assertManifestCoversCanonicalAuthorities,
  assertVaultBytesUnchanged,
  snapshotVaultBytes
} from '../scripts/stdio-full-vault-smoke.mjs';

function canonicalWithSource(title, source) {
  return `---
sources:
  - ${source}
---
# ${title}
`;
}

test('authority coverage scans Knowledge, Insights, and Personal canonical roots', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-authority-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const authorityRoot = path.join(root, 'authorities');
  fs.mkdirSync(authorityRoot);
  const vaultPath = path.join(root, 'vault');
  const pages = [
    ['01-Knowledge', 'Knowledge.md'],
    ['02-Insights', 'Insight.md'],
    ['03-Personal', 'Personal.md']
  ];
  for (const [canonicalRoot, filename] of pages) {
    const directory = path.join(vaultPath, canonicalRoot);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, filename),
      canonicalWithSource(filename, path.join(authorityRoot, `${filename}.txt`))
    );
  }
  const manifestPath = path.join(root, 'plugin.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    permissions: { filesystem: { read: [authorityRoot] } }
  }));

  const result = assertManifestCoversCanonicalAuthorities(vaultPath, manifestPath);
  assert.deepEqual(result, {
    canonicalPages: 3,
    canonicalRoots: 3,
    absoluteSourceRefs: 3,
    readRoots: 1
  });

  fs.writeFileSync(
    path.join(vaultPath, '03-Personal/Personal.md'),
    canonicalWithSource('Personal', path.join(root, 'outside-authority.txt'))
  );
  assert.throws(
    () => assertManifestCoversCanonicalAuthorities(vaultPath, manifestPath),
    /canonical authority lies outside plugin read permissions/
  );
});

test('full Vault byte guard detects changes and additions in any subtree', t => {
  const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-byte-guard-'));
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const insight = path.join(vaultPath, '02-Insights/OutsideFormerGuard.md');
  fs.mkdirSync(path.dirname(insight), { recursive: true });
  fs.writeFileSync(insight, 'before');

  const before = snapshotVaultBytes(vaultPath);
  assert.equal(before.size, 1);
  assertVaultBytesUnchanged(vaultPath, before);

  fs.writeFileSync(insight, 'after');
  assert.throws(
    () => assertVaultBytesUnchanged(vaultPath, before),
    /live Vault byte tree changed during smoke/
  );
  fs.writeFileSync(insight, 'before');
  fs.writeFileSync(path.join(vaultPath, 'new-file.txt'), 'added');
  assert.throws(
    () => assertVaultBytesUnchanged(vaultPath, before),
    /live Vault byte tree changed during smoke/
  );
});
