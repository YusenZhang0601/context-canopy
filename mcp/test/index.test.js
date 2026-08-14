import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  getAgentProfile,
  getCommonRules,
  getEntry,
  getMountainContext,
  listEntries,
  listSecondBrainSkills,
  readSecondBrainSkill,
  toolDefinitions
} from '../index.js';

function payload(result) {
  return JSON.parse(result.content[0].text);
}

function page(title) {
  return `---
type: knowledge
created: 2026-07-25
updated: 2026-07-25
status: seed
summary: ${title}
confidence: medium
aliases: []
freshness: timeless
last_checked: 2026-07-25
sources:
  - Current conversation
tags:
  - domain/knowledge
  - status/seed
  - source/conversation
---
# ${title}

## 核心摘要

${title}

## 关系

- **支撑**：[[A]]、[[B]]

## 内容

测试。

## 更新记录

- 2026-07-25：测试。
`;
}

test('list_entries all traverses every Knowledge subdirectory', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-list-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const relative of [
    'Experience/One.md',
    'Architecture/Two.md',
    'Debugging/Three.md',
    'Quantitative-Finance/Four.md'
  ]) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, page(path.basename(relative, '.md')));
  }
  const result = listEntries({ category: 'all', limit: 20 }, root);
  const payload = JSON.parse(result.content[0].text);
  assert.equal(payload.scope, '01-Knowledge');
  assert.equal(payload.total, 4);
  assert.deepEqual(
    new Set(payload.entries.map(entry => entry.category)),
    new Set(['Experience', 'Architecture', 'Debugging', 'Quantitative-Finance'])
  );
});

test('Knowledge read tools reject traversal and symlink escapes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-knowledge-boundary-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const knowledge = path.join(root, 'vault/01-Knowledge');
  const personal = path.join(root, 'vault/03-Personal');
  fs.mkdirSync(path.join(knowledge, 'Technical'), { recursive: true });
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(knowledge, 'Technical/Allowed.md'), page('Allowed'));
  fs.writeFileSync(path.join(personal, 'Secret.md'), page('sensitive personal content'));
  fs.symlinkSync(path.join(personal, 'Secret.md'), path.join(knowledge, 'Escape.md'));

  const allowed = getEntry('Technical/Allowed.md', knowledge);
  assert.notEqual(allowed.isError, true);
  assert.equal(payload(allowed).path, 'Technical/Allowed.md');

  const escapedEntry = getEntry('Escape.md', knowledge);
  assert.equal(escapedEntry.isError, true);
  assert.equal(payload(escapedEntry).error, 'not_found');
  assert.doesNotMatch(escapedEntry.content[0].text, /sensitive personal content/);

  const escapedList = listEntries({ category: '../03-Personal' }, knowledge);
  assert.equal(escapedList.isError, true);
  assert.equal(payload(escapedList).error, 'invalid_category');
  assert.doesNotMatch(escapedList.content[0].text, /sensitive personal content/);
});

test('list_entries rejects an allowlisted category symlink that leaves Knowledge', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-category-boundary-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const knowledge = path.join(root, '01-Knowledge');
  const outside = path.join(root, 'outside');
  fs.mkdirSync(knowledge, { recursive: true });
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, 'Secret.md'), page('sensitive outside content'));
  fs.symlinkSync(outside, path.join(knowledge, 'Technical'));

  const result = listEntries({ category: 'Technical' }, knowledge);
  assert.equal(result.isError, true);
  assert.equal(payload(result).error, 'invalid_category_root');
  assert.doesNotMatch(result.content[0].text, /sensitive outside content/);
});

test('capture tool declares atomic contract and review deadline', () => {
  const capture = toolDefinitions().find(tool => tool.name === 'capture_from_conversation');
  assert.ok(capture);
  assert.ok(capture.inputSchema.required.includes('card_form'));
  assert.ok(capture.inputSchema.required.includes('atomic_scope'));
  assert.deepEqual(capture.inputSchema.properties.card_form.enum, ['atomic', 'entity']);
  assert.equal(capture.inputSchema.properties.review_after.pattern, '^\\d{4}-\\d{2}-\\d{2}$');
});

test('personal AI read tools expose only allowlisted authority files', t => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-personal-ai-'));
  t.after(() => fs.rmSync(vault, { recursive: true, force: true }));

  const files = new Map([
    ['90-System/Personal-AI/COMMON-RULES.md', '# Common Rules\n'],
    ['90-System/Personal-AI/AGENTS/codex.md', '# Codex Profile\n'],
    ['03-Personal/Profile/长期方向与山脉.md', '# 长期方向与山脉\n'],
    ['03-Personal/Mountains/个人AI基底.md', '# 个人AI基底\n'],
    [
      '90-System/Personal-AI/SKILLS/second-brain-help/SKILL.md',
      '---\nname: second-brain-help\ndescription: 选择正确的 Second Brain Skill。\n---\n# Help\n'
    ],
    [
      '90-System/Personal-AI/SKILLS/second-brain-sync/SKILL.md',
      '---\nname: second-brain-sync\ndescription: 同步 Agent 配置。\n---\n# Sync\n'
    ],
    [
      '90-System/Personal-AI/SKILLS/not-allowlisted/SKILL.md',
      '---\nname: not-allowlisted\ndescription: should not appear\n---\n# Nope\n'
    ]
  ]);
  for (const [relative, content] of files) {
    const target = path.join(vault, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }

  const common = getCommonRules(vault);
  assert.notEqual(common.isError, true);
  assert.equal(payload(common).path, '90-System/Personal-AI/COMMON-RULES.md');
  assert.equal(payload(common).content, '# Common Rules\n');

  const profile = getAgentProfile({ agent_id: 'codex' }, vault);
  assert.notEqual(profile.isError, true);
  assert.equal(payload(profile).content, '# Codex Profile\n');
  assert.equal(payload(getAgentProfile({ agent_id: '../codex' }, vault)).error, 'invalid_agent_id');

  const overview = getMountainContext({}, vault);
  assert.equal(payload(overview).path, '03-Personal/Profile/长期方向与山脉.md');
  const mountain = getMountainContext({ mountain: '个人AI基底' }, vault);
  assert.equal(payload(mountain).content, '# 个人AI基底\n');
  assert.equal(payload(getMountainContext({ mountain: '../Profile/秘密' }, vault)).error, 'invalid_mountain');

  const listed = payload(listSecondBrainSkills({}, vault));
  assert.equal(listed.total, 2);
  assert.deepEqual(listed.skills.map(skill => skill.id), [
    'second-brain-help',
    'second-brain-sync'
  ]);
  const skill = readSecondBrainSkill({ skill_id: 'second-brain-help' }, vault);
  assert.equal(payload(skill).metadata.name, 'second-brain-help');
  assert.equal(payload(readSecondBrainSkill({ skill_id: '../help' }, vault)).error, 'invalid_skill_id');
});

test('personal AI read tools reject symlinks that escape their allowlisted roots', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-personal-ai-symlink-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault');
  const profiles = path.join(vault, '90-System/Personal-AI/AGENTS');
  fs.mkdirSync(profiles, { recursive: true });
  const outside = path.join(root, 'outside.md');
  fs.writeFileSync(outside, 'sensitive outside content');
  fs.symlinkSync(outside, path.join(profiles, 'escape.md'));

  const result = getAgentProfile({ agent_id: 'escape' }, vault);
  assert.equal(result.isError, true);
  assert.equal(payload(result).error, 'not_found');
  assert.doesNotMatch(result.content[0].text, /sensitive outside content/);

  const outsideSkills = path.join(root, 'outside-skills');
  fs.mkdirSync(path.join(outsideSkills, 'second-brain-escape'), { recursive: true });
  fs.writeFileSync(
    path.join(outsideSkills, 'second-brain-escape/SKILL.md'),
    '---\nname: second-brain-escape\ndescription: sensitive outside skill\n---\n# Escape\n'
  );
  const personalAiRoot = path.join(vault, '90-System/Personal-AI');
  fs.symlinkSync(outsideSkills, path.join(personalAiRoot, 'SKILLS'));
  const skills = listSecondBrainSkills({}, vault);
  assert.equal(skills.isError, true);
  assert.equal(payload(skills).error, 'invalid_skills_root');
  assert.doesNotMatch(skills.content[0].text, /sensitive outside skill/);
});

test('tool surface contains the four legacy tools and five thin personal AI reads', () => {
  assert.deepEqual(
    toolDefinitions().map(tool => tool.name).sort(),
    [
      'capture_from_conversation',
      'get_agent_profile',
      'get_common_rules',
      'get_entry',
      'get_mountain_context',
      'list_entries',
      'list_second_brain_skills',
      'read_second_brain_skill',
      'search_knowledge'
    ]
  );
});
