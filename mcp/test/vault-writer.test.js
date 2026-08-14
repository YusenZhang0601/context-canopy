import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  CaptureError,
  buildNewPage,
  captureKnowledge,
  parsePage,
  serializePage,
  validateCanonicalPage
} from '../lib/vault-writer.js';


const FIXED_NOW = new Date('2026-07-19T08:00:00.000Z');
const SHANGHAI_NEXT_DAY = new Date('2026-07-19T16:30:00.000Z');

function createVault() {
  const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-mcp-'));
  for (const directory of [
    '01-Knowledge/Experience',
    '01-Knowledge/Projects',
    '01-Knowledge/Technical',
    '04-Sources',
    '90-System'
  ]) {
    fs.mkdirSync(path.join(vaultPath, directory), { recursive: true });
  }
  fs.writeFileSync(path.join(vaultPath, '90-System/ONTOLOGY.md'), `
## Relation Sections

- \`上位概念\`
- \`组成部分\`
- \`支撑\`
- \`反例或限制\`
- \`应用场景\`
- \`相关人物或偏好\`

## Controlled Tags

- \`domain/knowledge\`
- \`status/seed\`
- \`status/active\`
- \`status/stable\`
- \`source/conversation\`
- \`source/manual\`
- \`source/web\`
- \`source/live-verification\`
- \`topic/testing\`
`.trimStart());
  fs.writeFileSync(path.join(vaultPath, '90-System/INDEX.md'), 'INDEX_ORIGINAL\n');
  fs.writeFileSync(path.join(vaultPath, '90-System/SOURCE-COVERAGE.md'), 'COVERAGE_ORIGINAL\n');
  fs.writeFileSync(path.join(vaultPath, '90-System/LOG.md'), 'LOG_ORIGINAL\n');
  fs.writeFileSync(
    path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json'),
    `${JSON.stringify({ version: 1, review_date: '2026-07-19', entries: {} }, null, 2)}\n`
  );
  fs.writeFileSync(path.join(vaultPath, '04-Sources/evidence.md'), '# Evidence\n');
  return vaultPath;
}

function baseRelations() {
  return [
    { target: 'SeedOne', label: '支撑', reciprocal_label: '应用场景' },
    { target: 'SeedTwo', label: '反例或限制' }
  ];
}

function writePage(vaultPath, relativePath, { title, aliases = [], content = 'Original body.' }) {
  const ontologyPath = path.join(vaultPath, '90-System/ONTOLOGY.md');
  const built = buildNewPage({
    title,
    content,
    category: relativePath.split('/')[0],
    summary: `${title} summary.`,
    tags: ['topic/testing'],
    confidence: 'medium',
    card_form: 'atomic',
    atomic_scope: `${title} 的单一测试主题`,
    aliases,
    related_concepts: [],
    relations: baseRelations()
  }, { ontologyPath, vaultPath, now: FIXED_NOW });
  const target = path.join(vaultPath, '01-Knowledge', relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, built.markdown);
  const registryPath = path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.entries[`01-Knowledge/${relativePath}`] = {
    sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),
    form: 'atomic',
    scope: `${title} 的单一测试主题`,
    reviewed_at: '2026-07-19',
    reviewed_by: 'test fixture'
  };
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  return target;
}

function writeLegacyLayoutPage(vaultPath, relativePath, title) {
  const target = path.join(vaultPath, '01-Knowledge', relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const markdown = `---
type: knowledge
created: 2026-07-19
updated: 2026-07-19
status: seed
summary: Legacy layout fixture.
confidence: medium
aliases: []
freshness: timeless
last_checked: 2026-07-19
sources:
  - Current conversation
tags:
  - domain/knowledge
  - source/conversation
  - status/seed
  - topic/testing
---
# ${title}

## 关系

- **上位概念**：[[Fixture Parent]]
- **支撑**：[[Fixture Peer]]

## 领域边界

This historical canonical deliberately has no MCP-managed 内容 section.

## 更新记录

- 2026-07-19：Legacy fixture.
`;
  fs.writeFileSync(target, markdown);
  const registryPath = path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  registry.entries[`01-Knowledge/${relativePath}`] = {
    sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),
    form: 'atomic',
    scope: `${title} 的历史布局兼容主题`,
    reviewed_at: '2026-07-19',
    reviewed_by: 'test fixture'
  };
  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  return target;
}

function captureArgs(overrides = {}) {
  return {
    title: 'Captured Topic',
    content: 'New durable body.',
    category: 'Technical',
    summary: 'Captured topic summary.',
    card_form: 'atomic',
    atomic_scope: 'Captured Topic 的单一测试主题',
    tags: ['topic/testing'],
    confidence: 'medium',
    check_duplicates: false,
    relations: [
      { target: 'Target A', label: '上位概念', reciprocal_label: '组成部分' },
      { target: 'Target B', label: '支撑' }
    ],
    ...overrides
  };
}

function successfulCompiler(calls = []) {
  return (_vaultPath, mode) => {
    calls.push(mode);
    return '{}';
  };
}

test('YAML serialization safely round-trips quotes, colon, hash, and aliases', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const summary = '摘要: "quoted" # hash [brackets]';
  const built = buildNewPage({
    title: 'YAML Escape',
    content: 'Safe content.',
    summary,
    tags: ['topic/testing'],
    aliases: ['旧名: "A" #1'],
    confidence: 'medium',
    card_form: 'atomic',
    atomic_scope: '验证 YAML 安全序列化',
    relations: baseRelations()
  }, {
    ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
    vaultPath,
    now: FIXED_NOW
  });
  const parsed = parsePage(built.markdown);
  assert.equal(parsed.metadata.summary, summary);
  assert.deepEqual(parsed.metadata.aliases, ['旧名: "A" #1']);
  assert.match(built.markdown, /^---\n/);
  assert.equal((built.markdown.match(/^---$/gm) || []).length, 2);
});

test('undeclared tags are rejected before any write', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  assert.throws(
    () => buildNewPage({
      title: 'Bad Tag',
      content: 'Body.',
      summary: 'Summary.',
      card_form: 'atomic',
      atomic_scope: '验证未声明标签拒绝行为',
      tags: ['topic/not-registered'],
      relations: baseRelations()
    }, {
      ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
      vaultPath,
      now: FIXED_NOW
    }),
    error => error instanceof CaptureError && error.code === 'invalid_tag'
  );
});

test('exact H1 or alias duplicates are decisions even when fuzzy checking is disabled', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  writePage(vaultPath, 'Projects/Canonical-File.md', {
    title: 'Canonical Title',
    aliases: ['Alias Hit']
  });
  let compilerCalls = 0;
  const result = captureKnowledge(captureArgs({ title: 'Alias Hit' }), {
    vaultPath,
    now: FIXED_NOW,
    compilerRunner: () => { compilerCalls += 1; }
  });
  assert.equal(result.action_required, 'duplicate_decision');
  assert.equal(result.exact_match, 'Projects/Canonical-File.md');
  assert.equal(compilerCalls, 0);
  assert.equal(fs.existsSync(path.join(vaultPath, '01-Knowledge/Technical/Alias-Hit.md')), false);
});

test('legacy related_concepts returns reciprocal decision without writing', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const args = captureArgs({ related_concepts: ['Target A', 'Target B'] });
  delete args.relations;
  const result = captureKnowledge(args, { vaultPath, now: FIXED_NOW, compilerRunner: successfulCompiler() });
  assert.equal(result.action_required, 'reciprocal_relation_decision');
  assert.equal(fs.existsSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md')), false);
});

test('atomic contract and current review deadline are mandatory', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  assert.throws(
    () => buildNewPage({
      ...captureArgs(),
      card_form: undefined
    }, {
      ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
      vaultPath,
      now: FIXED_NOW
    }),
    error => error instanceof CaptureError && error.code === 'invalid_atomic_contract'
  );
  assert.throws(
    () => buildNewPage({
      ...captureArgs(),
      freshness: 'current'
    }, {
      ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
      vaultPath,
      now: FIXED_NOW
    }),
    error => error instanceof CaptureError && error.code === 'invalid_freshness'
  );
  assert.throws(
    () => buildNewPage({
      ...captureArgs(),
      content: '### Embedded document section\n\nNot atomic.'
    }, {
      ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
      vaultPath,
      now: FIXED_NOW
    }),
    error => error instanceof CaptureError && error.code === 'invalid_content'
  );
  const current = buildNewPage({
    ...captureArgs(),
    freshness: 'current',
    review_after: '2026-08-18'
  }, {
    ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
    vaultPath,
    now: FIXED_NOW
  });
  assert.equal(current.metadata.review_after, '2026-08-18');
});

test('README-style and multi-topic content cannot masquerade as an atomic card', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const context = {
    ontologyPath: path.join(vaultPath, '90-System/ONTOLOGY.md'),
    vaultPath,
    now: FIXED_NOW
  };
  assert.throws(
    () => buildNewPage({
      ...captureArgs(),
      title: 'Product Operations Manual',
      atomic_scope: '概述产品运维手册',
      content: 'Authentication, cache invalidation, and incident response.'
    }, context),
    error => error instanceof CaptureError && error.code === 'invalid_atomic_contract'
  );
  assert.throws(
    () => buildNewPage({
      ...captureArgs(),
      title: 'Product Operations',
      atomic_scope: '解释产品运维的单一原则',
      content: [
        'Authentication: use OAuth device flow.',
        'Cache Invalidation: use versioned keys.',
        'Incident Response: preserve logs.'
      ].join('\n\n')
    }, context),
    error => error instanceof CaptureError && error.code === 'invalid_content'
  );
  const valid = buildNewPage({
    ...captureArgs(),
    content: [
      'OAuth device flow separates browser authorization from token polling.',
      '**限制**：它适合输入受限客户端，不替代普通浏览器重定向。',
      '**验证**：分别检查浏览器授权与轮询完成状态。'
    ].join('\n\n')
  }, context);
  assert.match(valid.markdown, /\*\*限制\*\*/);
  assert.match(valid.markdown, /\*\*验证\*\*/);
});

test('capture updates atomicity registry in the same transaction', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  writePage(vaultPath, 'Projects/Target-A.md', { title: 'Target A' });
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const result = captureKnowledge(captureArgs(), {
    vaultPath,
    now: FIXED_NOW,
    compilerRunner: successfulCompiler()
  });
  assert.equal(result.success, true);
  const registry = JSON.parse(
    fs.readFileSync(path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json'), 'utf8')
  );
  const entry = registry.entries['01-Knowledge/Technical/Captured-Topic.md'];
  assert.equal(entry.form, 'atomic');
  assert.equal(entry.scope, 'Captured Topic 的单一测试主题');
  assert.match(entry.sha256, /^[0-9a-f]{64}$/);
  const created = parsePage(
    fs.readFileSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md'), 'utf8')
  );
  assert.ok(created.metadata.aliases.includes('Captured Topic'));
});

test('target_path updates body and writes Asia/Shanghai log without replacing relations', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const target = writePage(vaultPath, 'Experience/Existing.md', {
    title: 'Existing',
    content: 'Old body.'
  });
  const calls = [];
  const args = captureArgs({
    title: 'Existing',
    category: 'Experience',
    target_path: 'Experience/Existing.md',
    content: 'Replacement body with exact target_path.',
    summary: 'Updated: "safe" # summary'
  });
  delete args.relations;
  const result = captureKnowledge(args, {
    vaultPath,
    now: SHANGHAI_NEXT_DAY,
    compilerRunner: successfulCompiler(calls)
  });
  assert.equal(result.success, true);
  assert.deepEqual(calls, ['check', 'write-derived', 'check']);
  const updated = fs.readFileSync(target, 'utf8');
  const parsed = parsePage(updated);
  assert.equal(parsed.metadata.summary, 'Updated: "safe" # summary');
  assert.equal(parsed.metadata.updated, '2026-07-20');
  assert.match(parsed.body, /Replacement body with exact target_path\./);
  assert.doesNotMatch(parsed.body, /Old body\./);
  assert.match(parsed.body, /\*\*支撑\*\*：\[\[SeedOne\]\]/);
  const log = fs.readFileSync(path.join(vaultPath, '90-System/LOG.md'), 'utf8');
  assert.match(log, /\[2026-07-20 00:30 \+08:00\]/);
});

test('explicit reciprocal relation updates target page in the same transaction', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const targetA = writePage(vaultPath, 'Projects/Target-A.md', { title: 'Target A' });
  const targetB = writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const result = captureKnowledge(captureArgs(), {
    vaultPath,
    now: FIXED_NOW,
    compilerRunner: successfulCompiler()
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.reciprocal_paths, ['01-Knowledge/Projects/Target-A.md']);
  const primary = fs.readFileSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md'), 'utf8');
  assert.match(primary, /\*\*上位概念\*\*：\[\[01-Knowledge\/Projects\/Target-A\]\]/);
  assert.match(primary, /\*\*支撑\*\*：\[\[01-Knowledge\/Projects\/Target-B\]\]/);
  assert.match(fs.readFileSync(targetA, 'utf8'), /\*\*组成部分\*\*：\[\[01-Knowledge\/Technical\/Captured-Topic\]\]/);
  assert.doesNotMatch(fs.readFileSync(targetB, 'utf8'), /Captured-Topic/);
});

test('reciprocal relation can update an existing non-MCP canonical layout', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const legacy = writeLegacyLayoutPage(
    vaultPath,
    'Projects/Legacy-Target.md',
    'Legacy Target'
  );
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const result = captureKnowledge(captureArgs({
    relations: [
      {
        target: 'Legacy Target',
        label: '上位概念',
        reciprocal_label: '组成部分'
      },
      { target: 'Target B', label: '支撑' }
    ]
  }), {
    vaultPath,
    now: FIXED_NOW,
    compilerRunner: successfulCompiler()
  });
  assert.equal(result.success, true);
  const updated = fs.readFileSync(legacy, 'utf8');
  assert.match(updated, /^## 领域边界$/m);
  assert.doesNotMatch(updated, /^## 内容$/m);
  assert.match(updated, /\*\*组成部分\*\*：\[\[01-Knowledge\/Technical\/Captured-Topic\]\]/);
});

test('reciprocal maintenance accepts a system authority source without a source-layer backlink', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  fs.writeFileSync(path.join(vaultPath, '90-System/SCHEMA.md'), '# Schema fixture\n');
  const targetA = writeLegacyLayoutPage(
    vaultPath,
    'Projects/System-Sourced-Target.md',
    'System Sourced Target'
  );
  const parsed = parsePage(fs.readFileSync(targetA, 'utf8'));
  parsed.metadata.sources = ['90-System/SCHEMA.md'];
  fs.writeFileSync(targetA, serializePage(parsed.metadata, parsed.body));
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });

  const result = captureKnowledge(captureArgs({
    relations: [
      {
        target: 'System Sourced Target',
        label: '应用场景',
        reciprocal_label: '支撑'
      },
      { target: 'Target B', label: '支撑' }
    ]
  }), {
    vaultPath,
    now: FIXED_NOW,
    compilerRunner: successfulCompiler()
  });

  assert.equal(result.success, true);
  const updated = fs.readFileSync(targetA, 'utf8');
  assert.match(updated, /\*\*支撑\*\*：.*\[\[01-Knowledge\/Technical\/Captured-Topic\]\]/);
  assert.doesNotMatch(updated, /\[\[90-System\/SCHEMA/);
});

test('source-layer Markdown still requires an explicit source backlink', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const target = writeLegacyLayoutPage(
    vaultPath,
    'Projects/Missing-Source-Link.md',
    'Missing Source Link'
  );
  const parsed = parsePage(fs.readFileSync(target, 'utf8'));
  parsed.metadata.sources = ['04-Sources/evidence.md'];
  const markdown = serializePage(parsed.metadata, parsed.body);

  assert.throws(
    () => validateCanonicalPage(markdown, { vaultPath, layout: 'existing' }),
    error => error instanceof CaptureError && error.code === 'missing_source_link'
  );
});

test('inherited compiler baseline failure performs no writes and releases the lock', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const targetA = writePage(vaultPath, 'Projects/Target-A.md', { title: 'Target A' });
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const observedPaths = [
    targetA,
    path.join(vaultPath, '90-System/INDEX.md'),
    path.join(vaultPath, '90-System/SOURCE-COVERAGE.md'),
    path.join(vaultPath, '90-System/LOG.md'),
    path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json')
  ];
  const before = new Map(observedPaths.map(file => [file, fs.readFileSync(file)]));
  const calls = [];

  assert.throws(
    () => captureKnowledge(captureArgs(), {
      vaultPath,
      now: FIXED_NOW,
      compilerRunner: (_root, mode) => {
        calls.push(mode);
        throw new CaptureError('synthetic inherited error', 'compiler_failed');
      }
    }),
    error => (
      error instanceof CaptureError &&
      error.code === 'vault_baseline_failed' &&
      /未开始写入/.test(error.message)
    )
  );
  assert.deepEqual(calls, ['check']);
  assert.equal(
    fs.existsSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md')),
    false
  );
  for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(file), bytes);
  assert.equal(fs.existsSync(path.join(vaultPath, '90-System/.capture.lock')), false);
});

test('compiler failure restores primary page, reciprocal pages, INDEX, coverage, and LOG', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const targetA = writePage(vaultPath, 'Projects/Target-A.md', { title: 'Target A' });
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const indexPath = path.join(vaultPath, '90-System/INDEX.md');
  const coveragePath = path.join(vaultPath, '90-System/SOURCE-COVERAGE.md');
  const logPath = path.join(vaultPath, '90-System/LOG.md');
  const atomicityPath = path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json');
  const targetBefore = fs.readFileSync(targetA);
  const atomicityBefore = fs.readFileSync(atomicityPath);
  fs.chmodSync(targetA, 0o644);
  fs.chmodSync(indexPath, 0o640);
  const targetModeBefore = fs.statSync(targetA).mode & 0o777;
  const indexModeBefore = fs.statSync(indexPath).mode & 0o777;
  assert.throws(
    () => captureKnowledge(captureArgs(), {
      vaultPath,
      now: FIXED_NOW,
      compilerRunner: (_root, mode) => {
        if (mode === 'write-derived') {
          fs.writeFileSync(indexPath, 'INDEX_MUTATED\n');
          fs.writeFileSync(coveragePath, 'COVERAGE_MUTATED\n');
          throw new CaptureError('synthetic compiler failure', 'compiler_failed');
        }
      }
    }),
    error => error instanceof CaptureError && error.code === 'compiler_failed'
  );
  assert.equal(fs.existsSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md')), false);
  assert.deepEqual(fs.readFileSync(targetA), targetBefore);
  assert.equal(fs.readFileSync(indexPath, 'utf8'), 'INDEX_ORIGINAL\n');
  assert.equal(fs.readFileSync(coveragePath, 'utf8'), 'COVERAGE_ORIGINAL\n');
  assert.equal(fs.readFileSync(logPath, 'utf8'), 'LOG_ORIGINAL\n');
  assert.deepEqual(fs.readFileSync(atomicityPath), atomicityBefore);
  assert.equal(fs.statSync(targetA).mode & 0o777, targetModeBefore);
  assert.equal(fs.statSync(indexPath).mode & 0o777, indexModeBefore);
  assert.equal(fs.existsSync(path.join(vaultPath, '90-System/.capture.lock')), false);
});

test('final compiler check failure also rolls back a completed derived-index write', t => {
  const vaultPath = createVault();
  t.after(() => fs.rmSync(vaultPath, { recursive: true, force: true }));
  const targetA = writePage(vaultPath, 'Projects/Target-A.md', { title: 'Target A' });
  writePage(vaultPath, 'Projects/Target-B.md', { title: 'Target B' });
  const targetBefore = fs.readFileSync(targetA);
  const indexPath = path.join(vaultPath, '90-System/INDEX.md');
  const coveragePath = path.join(vaultPath, '90-System/SOURCE-COVERAGE.md');
  let checkCalls = 0;
  assert.throws(
    () => captureKnowledge(captureArgs(), {
      vaultPath,
      now: FIXED_NOW,
      compilerRunner: (_root, mode) => {
        if (mode === 'write-derived') {
          fs.writeFileSync(indexPath, 'DERIVED_INDEX\n');
          fs.writeFileSync(coveragePath, 'DERIVED_COVERAGE\n');
          return '{}';
        }
        checkCalls += 1;
        if (checkCalls === 1) return '{}';
        throw new CaptureError('synthetic final check failure', 'compiler_failed');
      }
    }),
    error => error instanceof CaptureError && error.code === 'compiler_failed'
  );
  assert.equal(fs.existsSync(path.join(vaultPath, '01-Knowledge/Technical/Captured-Topic.md')), false);
  assert.deepEqual(fs.readFileSync(targetA), targetBefore);
  assert.equal(fs.readFileSync(indexPath, 'utf8'), 'INDEX_ORIGINAL\n');
  assert.equal(fs.readFileSync(coveragePath, 'utf8'), 'COVERAGE_ORIGINAL\n');
});
