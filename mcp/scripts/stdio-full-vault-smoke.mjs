import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  StdioClientTransport,
  getDefaultEnvironment
} from '@modelcontextprotocol/sdk/client/stdio.js';
import YAML from 'yaml';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const SERVER_PATH = path.join(PROJECT_ROOT, 'index.js');
const CANONICAL_ROOTS = ['01-Knowledge', '02-Insights', '03-Personal'];
const EXPECTED_TOOLS = [
  'capture_from_conversation',
  'get_agent_profile',
  'get_common_rules',
  'get_entry',
  'get_mountain_context',
  'list_entries',
  'list_second_brain_skills',
  'read_second_brain_skill',
  'search_knowledge'
];

function requireSourceVault() {
  const defaultVault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../vault');
  const configured = String(process.env.SECOND_BRAIN_FULL_VAULT_PATH || defaultVault).trim();
  if (!configured) {
    throw new Error(
      'SECOND_BRAIN_FULL_VAULT_PATH is required; the smoke never defaults to the live Vault'
    );
  }
  const absolutePath = path.resolve(configured);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Vault path does not exist: ${absolutePath}`);
  }
  const vaultPath = fs.realpathSync(absolutePath);
  if (vaultPath === path.parse(vaultPath).root) {
    throw new Error('SECOND_BRAIN_FULL_VAULT_PATH cannot be a filesystem root');
  }
  for (const required of [
    '01-Knowledge',
    '02-Insights',
    '03-Personal',
    '04-Sources',
    '90-System/ATOMICITY-REVIEW.json',
    '90-System/scripts/compile_vault.py'
  ]) {
    if (!fs.existsSync(path.join(vaultPath, required))) {
      throw new Error(`configured full Vault is missing ${required}`);
    }
  }
  return vaultPath;
}

function walkMarkdown(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
    }
  }
  return files.sort();
}

function frontmatterSources(markdown) {
  if (!markdown.startsWith('---\n')) return [];
  const end = markdown.indexOf('\n---\n', 4);
  if (end < 0) return [];
  const metadata = YAML.parse(markdown.slice(4, end)) || {};
  return Array.isArray(metadata.sources) ? metadata.sources : [];
}

export function assertManifestCoversCanonicalAuthorities(
  vaultPath,
  manifestPath = path.join(PROJECT_ROOT, '.claude-plugin/plugin.json')
) {
  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf8')
  );
  const roots = manifest?.permissions?.filesystem?.read;
  assert.ok(Array.isArray(roots) && roots.length > 0, 'plugin manifest has no read roots');
  const resolvedRoots = roots.map(root => path.resolve(root));
  const uncovered = [];
  let absoluteSourceRefs = 0;
  let canonicalPages = 0;
  for (const canonicalRoot of CANONICAL_ROOTS) {
    for (const file of walkMarkdown(path.join(vaultPath, canonicalRoot))) {
      canonicalPages += 1;
      const markdown = fs.readFileSync(file, 'utf8');
      for (const source of frontmatterSources(markdown)) {
        if (typeof source !== 'string' || !path.isAbsolute(source)) continue;
        absoluteSourceRefs += 1;
        const resolved = path.resolve(source);
        const covered = resolvedRoots.some(root => (
          resolved === root || resolved.startsWith(`${root}${path.sep}`)
        ));
        if (!covered) uncovered.push({
          page: path.relative(vaultPath, file).split(path.sep).join('/'),
          source
        });
      }
    }
  }
  assert.deepEqual(uncovered, [], 'canonical authority lies outside plugin read permissions');
  return {
    canonicalPages,
    canonicalRoots: CANONICAL_ROOTS.length,
    absoluteSourceRefs,
    readRoots: resolvedRoots.length
  };
}

function sectionText(markdown, heading) {
  const match = new RegExp(`^## ${heading}\\s*$`, 'm').exec(markdown);
  if (!match) return null;
  const start = match.index + match[0].length;
  const next = /^##\s+/m.exec(markdown.slice(start));
  return markdown.slice(start, next ? start + next.index : markdown.length);
}

function findHistoricalTarget(vaultPath) {
  const registry = JSON.parse(
    fs.readFileSync(path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json'), 'utf8')
  );
  for (const registryPath of Object.keys(registry.entries || {}).sort()) {
    if (!registryPath.startsWith('01-Knowledge/') || !registryPath.endsWith('.md')) continue;
    const filePath = path.join(vaultPath, registryPath);
    if (!fs.existsSync(filePath)) continue;
    const markdown = fs.readFileSync(filePath, 'utf8');
    const relations = sectionText(markdown, '关系');
    if (
      relations &&
      /^## 更新记录\s*$/m.test(markdown) &&
      (relations.match(/\[\[/g) || []).length >= 2
    ) {
      return {
        registryPath,
        toolPath: registryPath.slice('01-Knowledge/'.length),
        relationTarget: registryPath.replace(/\.md$/, '')
      };
    }
  }
  throw new Error(
    'full Vault has no atomicity-registered canonical target with relations and update log'
  );
}

function findSecondTarget(vaultPath, historicalRegistryPath) {
  const registry = JSON.parse(
    fs.readFileSync(path.join(vaultPath, '90-System/ATOMICITY-REVIEW.json'), 'utf8')
  );
  for (const registryPath of Object.keys(registry.entries || {}).sort()) {
    if (
      registryPath !== historicalRegistryPath &&
      registryPath.startsWith('01-Knowledge/') &&
      registryPath.endsWith('.md') &&
      fs.existsSync(path.join(vaultPath, registryPath))
    ) {
      return registryPath.replace(/\.md$/, '');
    }
  }
  throw new Error('full Vault has no second atomicity-registered canonical relation target');
}

function findImmutableSource(vaultPath) {
  const sourceRoot = path.join(vaultPath, '04-Sources');
  const candidates = walkMarkdown(sourceRoot)
    .filter(file => path.basename(file).toLowerCase() !== 'readme.md');
  if (candidates.length === 0) {
    throw new Error('full Vault has no non-README Markdown source under 04-Sources');
  }
  const filePath = candidates[0];
  return {
    filePath,
    sourceRef: path.relative(vaultPath, filePath).split(path.sep).join('/')
  };
}

function findPersonalAiFixture(vaultPath) {
  const commonRules = path.join(vaultPath, '90-System/Personal-AI/COMMON-RULES.md');
  const overviewCandidates = [
    path.join(vaultPath, '03-Personal/Profile/长期方向与山脉.md'),
    path.join(vaultPath, '03-Personal/Profile/个人AI协作体系.md')
  ];
  const overview = overviewCandidates.find(candidate => fs.existsSync(candidate));
  const agentRoot = path.join(vaultPath, '90-System/Personal-AI/AGENTS');
  const mountainRoot = path.join(vaultPath, '03-Personal/Mountains');
  const skillRoot = path.join(vaultPath, '90-System/Personal-AI/SKILLS');
  const sourceAgentId = 'claude';
  const targetAgentId = 'codex';
  const sourceAgentFile = path.join(agentRoot, `${sourceAgentId}.md`);
  const targetAgentFile = path.join(agentRoot, `${targetAgentId}.md`);
  for (const required of [
    commonRules,
    overview,
    agentRoot,
    sourceAgentFile,
    targetAgentFile,
    mountainRoot,
    skillRoot
  ]) {
    if (!required || !fs.existsSync(required)) {
      throw new Error(`full Vault is missing personal AI authority: ${required ? path.relative(vaultPath, required) : 'overview'}`);
    }
  }
  const mountainFile = fs.readdirSync(mountainRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('.'))
    .sort((left, right) => left.name.localeCompare(right.name))[0];
  const skillDirectory = fs.readdirSync(skillRoot, { withFileTypes: true })
    .filter(entry => (
      entry.isDirectory() &&
      /^second-brain-[a-z0-9][a-z0-9-]*$/.test(entry.name) &&
      fs.existsSync(path.join(skillRoot, entry.name, 'SKILL.md'))
    ))
    .sort((left, right) => left.name.localeCompare(right.name))[0];
  if (!mountainFile || !skillDirectory) {
    throw new Error('full Vault personal AI authority lacks an agent, mountain, or Skill fixture');
  }
  return {
    sourceAgentId,
    targetAgentId,
    mountain: path.basename(mountainFile.name, '.md'),
    skillId: skillDirectory.name,
    overviewRelative: path.relative(vaultPath, overview).split(path.sep).join('/')
  };
}

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function snapshotVaultBytes(vaultPath) {
  const snapshot = new Map();
  const stack = [vaultPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const relative = path.relative(vaultPath, full).split(path.sep).join('/');
        snapshot.set(relative, sha256(full));
      }
    }
  }
  return new Map([...snapshot].sort(([left], [right]) => left.localeCompare(right)));
}

export function assertVaultBytesUnchanged(vaultPath, before) {
  const after = snapshotVaultBytes(vaultPath);
  const changes = [];
  for (const relative of new Set([...before.keys(), ...after.keys()])) {
    if (!before.has(relative)) changes.push(`added:${relative}`);
    else if (!after.has(relative)) changes.push(`removed:${relative}`);
    else if (before.get(relative) !== after.get(relative)) changes.push(`changed:${relative}`);
  }
  assert.deepEqual(
    changes.sort(),
    [],
    'live Vault byte tree changed during smoke'
  );
}

function runCompilerCheck(vaultPath, phase) {
  const compiler = path.join(vaultPath, '90-System/scripts/compile_vault.py');
  const result = spawnSync(
    process.env.SECOND_BRAIN_PYTHON || 'python3',
    [compiler, '--check', '--format', 'json'],
    {
      cwd: vaultPath,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 16 * 1024 * 1024
    }
  );
  if (result.error || result.status !== 0) {
    const detail = [result.error?.message, result.stdout, result.stderr]
      .filter(Boolean)
      .join('\n')
      .slice(-8000);
    throw new Error(`${phase} copied-Vault compiler check failed:\n${detail}`);
  }
  return result.stdout.trim();
}

function parseToolPayload(result, label) {
  const text = result.content?.find(item => item.type === 'text')?.text;
  assert.ok(text, `${label} returned no text content`);
  assert.notEqual(result.isError, true, `${label} failed: ${text}`);
  return JSON.parse(text);
}

async function runSmoke() {
  const sourceVault = requireSourceVault();
  const permissionCoverage = assertManifestCoversCanonicalAuthorities(sourceVault);
  const liveVaultSnapshot = snapshotVaultBytes(sourceVault);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'second-brain-stdio-full-vault-'));
  const copiedVault = path.join(tempRoot, 'vault');
  let client;
  let transport;
  let serverStderr = '';
  let summary;
  let smokeError;

  try {
    fs.cpSync(sourceVault, copiedVault, {
      recursive: true,
      dereference: true,
      preserveTimestamps: true,
      force: false,
      errorOnExist: true
    });
    // The live maintenance lock must remain in place while release checks run.
    // Remove only the copied lock so the disposable transaction can execute.
    fs.rmSync(path.join(copiedVault, '90-System/.capture.lock'), { force: true });

    const historical = findHistoricalTarget(copiedVault);
    const secondTarget = findSecondTarget(copiedVault, historical.registryPath);
    const immutableSource = findImmutableSource(copiedVault);
    const personalAi = findPersonalAiFixture(copiedVault);
    const sourceHash = sha256(immutableSource.filePath);
    fs.chmodSync(immutableSource.filePath, 0o444);

    runCompilerCheck(copiedVault, 'baseline');

    const childEnvironment = {
      ...getDefaultEnvironment(),
      SECOND_BRAIN_VAULT_PATH: copiedVault
    };
    if (process.env.SECOND_BRAIN_PYTHON) {
      childEnvironment.SECOND_BRAIN_PYTHON = process.env.SECOND_BRAIN_PYTHON;
    }
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      cwd: PROJECT_ROOT,
      env: childEnvironment,
      stderr: 'pipe'
    });
    transport.stderr?.on('data', chunk => {
      serverStderr += chunk.toString();
    });
    client = new Client(
      { name: 'context-canopy-agent-a-claude', version: '1.0.0' },
      { capabilities: {} }
    );
    const packageVersion = JSON.parse(
      fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    ).version;
    await client.connect(transport, { timeout: 30_000 });
    assert.equal(client.getServerVersion()?.name, 'second-brain');
    assert.equal(client.getServerVersion()?.version, packageVersion);

    const listedTools = await client.listTools(undefined, { timeout: 30_000 });
    assert.deepEqual(
      listedTools.tools.map(tool => tool.name).sort(),
      EXPECTED_TOOLS
    );

    const entries = parseToolPayload(
      await client.callTool(
        { name: 'list_entries', arguments: { category: 'all', limit: 1 } },
        undefined,
        { timeout: 30_000 }
      ),
      'list_entries'
    );
    assert.equal(entries.scope, '01-Knowledge');
    assert.ok(entries.total > 0, 'full Vault list_entries returned no canonical pages');

    const commonRules = parseToolPayload(
      await client.callTool(
        { name: 'get_common_rules', arguments: {} },
        undefined,
        { timeout: 30_000 }
      ),
      'get_common_rules'
    );
    assert.equal(commonRules.path, '90-System/Personal-AI/COMMON-RULES.md');
    assert.ok(commonRules.content.length > 0, 'get_common_rules returned empty content');

    const sourceAgentProfile = parseToolPayload(
      await client.callTool(
        { name: 'get_agent_profile', arguments: { agent_id: personalAi.sourceAgentId } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_agent_profile'
    );
    assert.equal(
      sourceAgentProfile.path,
      `90-System/Personal-AI/AGENTS/${personalAi.sourceAgentId}.md`
    );

    const mountainOverview = parseToolPayload(
      await client.callTool(
        { name: 'get_mountain_context', arguments: {} },
        undefined,
        { timeout: 30_000 }
      ),
      'get_mountain_context overview'
    );
    assert.equal(mountainOverview.path, personalAi.overviewRelative);
    const mountain = parseToolPayload(
      await client.callTool(
        { name: 'get_mountain_context', arguments: { mountain: personalAi.mountain } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_mountain_context named mountain'
    );
    assert.equal(mountain.path, `03-Personal/Mountains/${personalAi.mountain}.md`);

    const skills = parseToolPayload(
      await client.callTool(
        { name: 'list_second_brain_skills', arguments: {} },
        undefined,
        { timeout: 30_000 }
      ),
      'list_second_brain_skills'
    );
    assert.ok(skills.total > 0, 'list_second_brain_skills returned no Skills');
    assert.ok(skills.skills.some(skill => skill.id === personalAi.skillId));
    const skill = parseToolPayload(
      await client.callTool(
        { name: 'read_second_brain_skill', arguments: { skill_id: personalAi.skillId } },
        undefined,
        { timeout: 30_000 }
      ),
      'read_second_brain_skill'
    );
    assert.equal(skill.metadata.name, personalAi.skillId);

    const historicalEntry = parseToolPayload(
      await client.callTool(
        { name: 'get_entry', arguments: { path: historical.toolPath } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_entry historical target'
    );
    assert.equal(historicalEntry.path, historical.toolPath);
    assert.doesNotMatch(historicalEntry.content, /^## 内容\s*$/m);

    const nonce = `${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
    const capture = parseToolPayload(
      await client.callTool(
        {
          name: 'capture_from_conversation',
          arguments: {
            title: `Stdio Full Vault Disposable ${nonce}`,
            content: 'A fresh stdio process can transactionally validate capture against an isolated full-Vault copy.',
            category: 'Technical',
            summary: 'Fresh stdio capture is validated only against an isolated full-Vault copy.',
            card_form: 'atomic',
            atomic_scope: '验证全新 stdio 进程在完整 Vault 副本上的一次性事务捕获',
            confidence: 'medium',
            freshness: 'timeless',
            source_refs: [immutableSource.sourceRef],
            check_duplicates: false,
            relations: [
              {
                target: historical.relationTarget,
                label: '上位概念',
                reciprocal_label: '组成部分'
              },
              {
                target: secondTarget,
                label: '支撑'
              }
            ]
          }
        },
        undefined,
        { timeout: 180_000 }
      ),
      'capture_from_conversation'
    );
    assert.equal(capture.success, true);
    assert.equal(capture.mode, 'create');
    assert.ok(
      capture.reciprocal_paths.includes(historical.registryPath),
      'capture did not update the historical-layout reciprocal target'
    );

    const createdEntry = parseToolPayload(
      await client.callTool(
        { name: 'get_entry', arguments: { path: capture.path } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_entry disposable card'
    );
    assert.equal(createdEntry.path, capture.path);
    assert.ok(createdEntry.frontmatter.sources.includes(immutableSource.sourceRef));

    const updatedHistorical = parseToolPayload(
      await client.callTool(
        { name: 'get_entry', arguments: { path: historical.toolPath } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_entry updated historical target'
    );
    assert.match(
      updatedHistorical.content,
      new RegExp(`\\[\\[01-Knowledge/${capture.path.replace(/\.md$/, '')}\\]\\]`)
    );

    assert.equal(
      sha256(immutableSource.filePath),
      sourceHash,
      'immutable copied Markdown source changed during capture'
    );

    const firstServerVersion = client.getServerVersion();
    await client.close();
    client = undefined;
    transport = undefined;

    transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      cwd: PROJECT_ROOT,
      env: childEnvironment,
      stderr: 'pipe'
    });
    transport.stderr?.on('data', chunk => {
      serverStderr += chunk.toString();
    });
    client = new Client(
      { name: 'context-canopy-agent-b-codex', version: '1.0.0' },
      { capabilities: {} }
    );
    await client.connect(transport, { timeout: 30_000 });
    assert.deepEqual(client.getServerVersion(), firstServerVersion);

    const targetCommonRules = parseToolPayload(
      await client.callTool(
        { name: 'get_common_rules', arguments: {} },
        undefined,
        { timeout: 30_000 }
      ),
      'get_common_rules from target agent'
    );
    assert.equal(targetCommonRules.sha256, commonRules.sha256);

    const targetAgentProfile = parseToolPayload(
      await client.callTool(
        { name: 'get_agent_profile', arguments: { agent_id: personalAi.targetAgentId } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_agent_profile from target agent'
    );
    assert.equal(
      targetAgentProfile.path,
      `90-System/Personal-AI/AGENTS/${personalAi.targetAgentId}.md`
    );
    assert.notEqual(
      targetAgentProfile.sha256,
      sourceAgentProfile.sha256,
      'source and target Agent profiles must remain independent'
    );

    const targetSearch = parseToolPayload(
      await client.callTool(
        { name: 'search_knowledge', arguments: { query: nonce } },
        undefined,
        { timeout: 30_000 }
      ),
      'search_knowledge from target agent'
    );
    assert.ok(
      targetSearch.results.some(result => result.path === capture.path),
      'target Agent could not discover the source Agent capture'
    );

    const targetReadback = parseToolPayload(
      await client.callTool(
        { name: 'get_entry', arguments: { path: capture.path } },
        undefined,
        { timeout: 30_000 }
      ),
      'get_entry from target agent'
    );
    assert.equal(targetReadback.path, capture.path);
    assert.ok(targetReadback.frontmatter.sources.includes(immutableSource.sourceRef));
    assert.match(targetReadback.content, new RegExp(nonce));

    runCompilerCheck(copiedVault, 'final');
    assert.equal(
      fs.existsSync(path.join(sourceVault, '01-Knowledge', capture.path)),
      false,
      'disposable card was written to the live Vault'
    );

    summary = {
      success: true,
      initialized_server: client.getServerVersion(),
      tools: EXPECTED_TOOLS,
      listed_entries: entries.total,
      immutable_source: immutableSource.sourceRef,
      historical_target: historical.toolPath,
      disposable_card: capture.path,
      reciprocal_paths: capture.reciprocal_paths,
      cross_agent_handoff: {
        source_agent: personalAi.sourceAgentId,
        target_agent: personalAi.targetAgentId,
        fresh_server_processes: 2,
        shared_common_rules: true,
        distinct_agent_profiles: true,
        entry_found_by_target: true,
        entry_read_by_target: true
      },
      manifest_authority_coverage: permissionCoverage,
      personal_ai_authority: personalAi,
      copied_vault_compiler_check: 'passed',
      live_vault_byte_guard: {
        algorithm: 'sha256',
        regular_files: liveVaultSnapshot.size
      },
      live_vault_unchanged: true
    };
  } catch (error) {
    if (serverStderr.trim()) {
      smokeError = new Error(`${error.message}\nFresh server stderr:\n${serverStderr.trim()}`, {
        cause: error
      });
    } else {
      smokeError = error;
    }
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {}
    } else if (transport) {
      try {
        await transport.close();
      } catch {}
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
    try {
      assertVaultBytesUnchanged(sourceVault, liveVaultSnapshot);
    } catch (guardError) {
      smokeError = smokeError
        ? new Error(`${smokeError.message}\nLive Vault guard failure:\n${guardError.message}`, {
            cause: smokeError
          })
        : guardError;
    }
  }

  if (smokeError) throw smokeError;

  return {
    ...summary,
    temporary_copy_removed: !fs.existsSync(tempRoot)
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runSmoke()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
