#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CaptureError, captureKnowledge, parsePage } from './lib/vault-writer.js';

/**
 * Adaptively resolves the Second Brain Vault root path.
 * 1. Checks explicit parameter or process.env.SECOND_BRAIN_VAULT_PATH
 * 2. Checks sibling directory ../vault relative to this MCP package
 * 3. Checks ./vault relative to current working directory
 * 4. Fallback to sibling ../vault
 */
export function resolveVaultPath(explicitPath = process.env.SECOND_BRAIN_VAULT_PATH) {
  if (explicitPath && String(explicitPath).trim()) {
    return path.resolve(String(explicitPath).trim());
  }
  const packageDir = path.dirname(fileURLToPath(import.meta.url));
  const siblingVault = path.resolve(packageDir, '../vault');
  if (fs.existsSync(siblingVault)) {
    return siblingVault;
  }
  const cwdVault = path.resolve(process.cwd(), 'vault');
  if (fs.existsSync(cwdVault)) {
    return cwdVault;
  }
  return siblingVault;
}

const VAULT_PATH = resolveVaultPath();
const KB_PATH = path.join(VAULT_PATH, '01-Knowledge');
const PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
).version;
const PERSONAL_AI_ROOT = '90-System/Personal-AI';
const COMMON_RULES_PATH = `${PERSONAL_AI_ROOT}/COMMON-RULES.md`;
const AGENT_PROFILES_ROOT = `${PERSONAL_AI_ROOT}/AGENTS`;
const SECOND_BRAIN_SKILLS_ROOT = `${PERSONAL_AI_ROOT}/SKILLS`;
const MOUNTAIN_OVERVIEW_PATH = '03-Personal/Profile/长期方向与山脉.md';
const MOUNTAINS_ROOT = '03-Personal/Mountains';
const LISTABLE_KNOWLEDGE_CATEGORIES = new Set(['all', 'Experience', 'Projects', 'Technical']);

function sanitizeQuery(query) {
  return String(query || '').replace(/[;&|`$()]/g, '').replace(/\.\./g, '').slice(0, 200).trim();
}

function walkMarkdown(root) {
  if (!fs.existsSync(root)) return [];
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

function safeKnowledgePath(relativePath, knowledgeRoot = KB_PATH) {
  try {
    const root = path.resolve(knowledgeRoot);
    const candidate = path.resolve(root, String(relativePath || ''));
    if (
      !candidate.startsWith(`${root}${path.sep}`) ||
      path.extname(candidate).toLowerCase() !== '.md' ||
      !fs.existsSync(root) ||
      !fs.existsSync(candidate)
    ) {
      return null;
    }
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    if (
      !realCandidate.startsWith(`${realRoot}${path.sep}`) ||
      !fs.statSync(realCandidate).isFile()
    ) {
      return null;
    }
    return realCandidate;
  } catch {
    return null;
  }
}

function safeKnowledgeDirectory(category, knowledgeRoot = KB_PATH) {
  try {
    const root = path.resolve(knowledgeRoot);
    const candidate = category === 'all' ? root : path.resolve(root, category);
    if (
      (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) ||
      !fs.existsSync(root) ||
      !fs.existsSync(candidate)
    ) {
      return null;
    }
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    if (
      (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${path.sep}`)) ||
      !fs.statSync(realCandidate).isDirectory()
    ) {
      return null;
    }
    return realCandidate;
  } catch {
    return null;
  }
}

function safeExistingMarkdown(vaultPath, allowedRoot, relativePath) {
  try {
    const vaultRoot = path.resolve(vaultPath);
    const root = path.resolve(vaultRoot, allowedRoot);
    const candidate = path.resolve(root, relativePath);
    if (
      path.extname(candidate).toLowerCase() !== '.md' ||
      (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) ||
      !fs.existsSync(vaultRoot) ||
      !fs.existsSync(root) ||
      !fs.existsSync(candidate)
    ) {
      return null;
    }
    const realVault = fs.realpathSync(vaultRoot);
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    if (
      (realRoot !== realVault && !realRoot.startsWith(`${realVault}${path.sep}`)) ||
      (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${path.sep}`)) ||
      !fs.statSync(realCandidate).isFile()
    ) {
      return null;
    }
    return realCandidate;
  } catch {
    return null;
  }
}

function markdownResult(vaultPath, relativePath, allowedRoot) {
  const allowedRelative = path.relative(allowedRoot, relativePath);
  const file = safeExistingMarkdown(vaultPath, allowedRoot, allowedRelative);
  if (!file) {
    return textResult({ error: 'not_found', path: relativePath }, true);
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    return textResult({
      path: relativePath.split(path.sep).join('/'),
      sha256: cryptoHash(content),
      content
    });
  } catch (error) {
    return textResult({ error: 'read_failed', message: error.message }, true);
  }
}

function cryptoHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function safeIdentifier(value, pattern, maxLength = 80) {
  const normalized = String(value || '').trim();
  if (!normalized || normalized.length > maxLength || !pattern.test(normalized)) return null;
  return normalized;
}

function safeMarkdownLeaf(value, maxLength = 160) {
  const normalized = String(value || '').trim();
  if (
    !normalized ||
    normalized.length > maxLength ||
    normalized.includes('\0') ||
    normalized.includes('/') ||
    normalized.includes('\\') ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('.')
  ) {
    return null;
  }
  return normalized.endsWith('.md') ? normalized : `${normalized}.md`;
}

export function getCommonRules(vaultPath = VAULT_PATH) {
  return markdownResult(vaultPath, COMMON_RULES_PATH, PERSONAL_AI_ROOT);
}

export function getAgentProfile(args = {}, vaultPath = VAULT_PATH) {
  const agentId = safeIdentifier(args.agent_id, /^[a-z0-9][a-z0-9_-]*$/);
  if (!agentId) {
    return textResult({ error: 'invalid_agent_id' }, true);
  }
  const relativePath = `${AGENT_PROFILES_ROOT}/${agentId}.md`;
  return markdownResult(vaultPath, relativePath, AGENT_PROFILES_ROOT);
}

export function getMountainContext(args = {}, vaultPath = VAULT_PATH) {
  const requested = String(args.mountain || '').trim();
  if (!requested) {
    const overviewRelative = fs.existsSync(path.join(vaultPath, MOUNTAIN_OVERVIEW_PATH))
      ? MOUNTAIN_OVERVIEW_PATH
      : '03-Personal/Profile/个人AI协作体系.md';
    return markdownResult(vaultPath, overviewRelative, '03-Personal/Profile');
  }
  const leaf = safeMarkdownLeaf(requested);
  if (!leaf) {
    return textResult({ error: 'invalid_mountain' }, true);
  }
  const relativePath = `${MOUNTAINS_ROOT}/${leaf}`;
  return markdownResult(vaultPath, relativePath, MOUNTAINS_ROOT);
}

export function listSecondBrainSkills(_args = {}, vaultPath = VAULT_PATH) {
  const root = path.resolve(vaultPath, SECOND_BRAIN_SKILLS_ROOT);
  if (!fs.existsSync(root)) {
    return textResult({
      scope: SECOND_BRAIN_SKILLS_ROOT,
      total: 0,
      skills: []
    });
  }
  let realRoot;
  try {
    const realVault = fs.realpathSync(path.resolve(vaultPath));
    realRoot = fs.realpathSync(root);
    if (realRoot !== realVault && !realRoot.startsWith(`${realVault}${path.sep}`)) {
      return textResult({ error: 'invalid_skills_root' }, true);
    }
  } catch {
    return textResult({ error: 'invalid_skills_root' }, true);
  }
  const skills = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || !/^second-brain-[a-z0-9][a-z0-9-]*$/.test(entry.name)) continue;
    const skillFile = safeExistingMarkdown(
      vaultPath,
      SECOND_BRAIN_SKILLS_ROOT,
      `${entry.name}/SKILL.md`
    );
    if (!skillFile || !skillFile.startsWith(`${realRoot}${path.sep}`)) continue;
    try {
      const content = fs.readFileSync(skillFile, 'utf8');
      const { metadata } = parsePage(content);
      if (metadata.name !== entry.name) continue;
      skills.push({
        id: entry.name,
        description: String(metadata.description || ''),
        path: `${SECOND_BRAIN_SKILLS_ROOT}/${entry.name}/SKILL.md`,
        sha256: cryptoHash(content)
      });
    } catch {}
  }
  return textResult({
    scope: SECOND_BRAIN_SKILLS_ROOT,
    total: skills.length,
    skills
  });
}

export function readSecondBrainSkill(args = {}, vaultPath = VAULT_PATH) {
  const skillId = safeIdentifier(
    args.skill_id,
    /^second-brain-[a-z0-9][a-z0-9-]*$/
  );
  if (!skillId) {
    return textResult({ error: 'invalid_skill_id' }, true);
  }
  const relativePath = `${SECOND_BRAIN_SKILLS_ROOT}/${skillId}/SKILL.md`;
  const result = markdownResult(vaultPath, relativePath, SECOND_BRAIN_SKILLS_ROOT);
  if (result.isError) return result;
  try {
    const payload = JSON.parse(result.content[0].text);
    const { metadata } = parsePage(payload.content);
    if (metadata.name !== skillId) {
      return textResult({ error: 'skill_identity_mismatch', skill_id: skillId }, true);
    }
    return textResult({ ...payload, metadata });
  } catch (error) {
    return textResult({ error: 'invalid_skill', message: error.message }, true);
  }
}

function extractRelevantExcerpt(content, keywords, contextLength = 220) {
  const lower = content.toLowerCase();
  const index = keywords.map(keyword => lower.indexOf(keyword)).find(position => position >= 0) ?? -1;
  if (index < 0) return content.slice(0, 500) + (content.length > 500 ? '…' : '');
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + contextLength);
  return `${start > 0 ? '…' : ''}${content.slice(start, end)}${end < content.length ? '…' : ''}`;
}

export function toolDefinitions() {
  return [
    {
      name: 'get_common_rules',
      description: '只读获取个人 AI 基底的通用规则 authority；不读取原始来源或替 Agent 做语义裁决。',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: 'get_agent_profile',
      description: '只读获取一个明确 agent_id 的独立角色与宿主配置说明。',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            pattern: '^[a-z0-9][a-z0-9_-]*$',
            maxLength: 80,
            description: 'Agent 实例标识，例如 codex、claude、antigravity 或 hermes'
          }
        },
        required: ['agent_id'],
        additionalProperties: false
      }
    },
    {
      name: 'get_mountain_context',
      description: '只读获取长期方向总览，或按单个山名读取其当前、目标、路线、阻点与下一步证据。',
      inputSchema: {
        type: 'object',
        properties: {
          mountain: {
            type: 'string',
            maxLength: 160,
            description: '可选山名或 Markdown 文件名；省略时返回长期方向总览'
          }
        },
        additionalProperties: false
      }
    },
    {
      name: 'list_second_brain_skills',
      description: '只读列出当前 Vault authority 中注册的 second-brain-* Skills 及内容哈希。',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    },
    {
      name: 'read_second_brain_skill',
      description: '只读获取一个 second-brain-* Skill 的规范正文；MCP 包本身不复制这些 Skills。',
      inputSchema: {
        type: 'object',
        properties: {
          skill_id: {
            type: 'string',
            pattern: '^second-brain-[a-z0-9][a-z0-9-]*$',
            maxLength: 80
          }
        },
        required: ['skill_id'],
        additionalProperties: false
      }
    },
    {
      name: 'search_knowledge',
      description: '在 Second Brain canonical 知识图谱中搜索概念、项目经验和技术材料。',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: '关键词或短语' } },
        required: ['query']
      }
    },
    {
      name: 'capture_from_conversation',
      description: '以事务方式新建或更新单一原子主题或简洁实体页；自动执行查重、原子性登记、来源、关系、派生重建和最终审计门禁。',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '页面标题和默认文件名' },
          content: {
            type: 'string',
            description: '写入“内容”章节的单主题正文；禁止 H1–H6、目录和多主题文档结构，展开时仅用解释、边界、限制、验证、应用、证据等支撑标签'
          },
          category: {
            type: 'string',
            enum: ['Experience', 'Projects', 'Technical'],
            description: '兼容旧接口的知识分类'
          },
          summary: { type: 'string', description: '一句话摘要；YAML 特殊字符会被安全转义' },
          card_form: {
            type: 'string',
            enum: ['atomic', 'entity'],
            description: 'atomic 表示单一概念、主张、方法或事件；entity 仅用于简洁的人物、项目或系统实体页'
          },
          atomic_scope: {
            type: 'string',
            maxLength: 200,
            description: '一句话声明本页唯一负责的稳定主题；会写入原子性复核登记'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: '必须已在 90-System/ONTOLOGY.md 注册；生命周期和来源标签会自动补齐'
          },
          confidence: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: '只有持久来源才能使用 high；仅 Current conversation 时自动降为 medium'
          },
          related_concepts: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            description: '旧接口兼容字段；仅提供本字段时会返回 reciprocal_relation_decision，不写盘'
          },
          relations: {
            type: 'array',
            minItems: 2,
            description: '有语义的 canonical 关系；新建至少两项，且至少一项提供 reciprocal_label',
            items: {
              type: 'object',
              properties: {
                target: { type: 'string', description: 'canonical 标题、alias 或完整路径' },
                label: {
                  type: 'string',
                  enum: ['上位概念', '组成部分', '支撑', '反例或限制', '应用场景', '相关人物或偏好']
                },
                reciprocal_label: {
                  type: 'string',
                  enum: ['上位概念', '组成部分', '支撑', '反例或限制', '应用场景', '相关人物或偏好'],
                  description: '可选；显式同步到目标页的反向关系标签'
                }
              },
              required: ['target', 'label'],
              additionalProperties: false
            }
          },
          source_refs: {
            type: 'array',
            items: { type: 'string' },
            description: '持久来源的 vault 相对路径、绝对路径或 URL；sources 中保存普通字符串'
          },
          aliases: {
            type: 'array',
            items: { type: 'string' },
            description: '旧标题、简称或兼容链接'
          },
          freshness: {
            type: 'string',
            enum: ['timeless', 'current', 'stale', 'blocked'],
            description: '事实新鲜度；默认 timeless'
          },
          review_after: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: '仅 freshness=current 时必填的复查截止日；其他 freshness 禁止设置'
          },
          check_duplicates: {
            type: 'boolean',
            description: '新建前检查疑似重复，默认 true；同名精确冲突始终要求裁决'
          },
          target_path: {
            type: 'string',
            description: '相对 01-Knowledge 的现有页面路径；更新正文、摘要、来源和更新记录'
          }
        },
        required: ['title', 'content', 'category', 'summary', 'card_form', 'atomic_scope']
      }
    },
    {
      name: 'get_entry',
      description: '读取指定 canonical 知识页及其 frontmatter 和双链。',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: '相对 01-Knowledge 的 Markdown 路径' } },
        required: ['path']
      }
    },
    {
      name: 'list_entries',
      description: '按目录、标签和更新时间列出 canonical 知识页。',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['Experience', 'Projects', 'Technical', 'all'] },
          tag_filter: { type: 'string' },
          sort_by: { type: 'string', enum: ['updated', 'created', 'title'] },
          limit: { type: 'number', minimum: 1, maximum: 500 }
        }
      }
    }
  ];
}

function textResult(payload, isError = false) {
  return {
    content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {})
  };
}

function searchKnowledge(rawQuery, knowledgeRoot = KB_PATH) {
  const query = sanitizeQuery(rawQuery);
  if (!query) return textResult({ error: 'invalid_query', message: '查询不能为空' }, true);
  const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
  const ranked = [];
  for (const file of walkMarkdown(knowledgeRoot)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lower = content.toLowerCase();
      const score = keywords.reduce((total, keyword) => total + (lower.includes(keyword) ? 1 : 0), 0);
      if (score > 0) ranked.push({ file, content, score });
    } catch {}
  }
  ranked.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  const results = ranked.slice(0, 10).map((item, index) => ({
    rank: index + 1,
    title: item.content.match(/^#\s+(.+)$/m)?.[1] || path.basename(item.file, '.md'),
    path: path.relative(knowledgeRoot, item.file),
    ...(index === 0 ? { excerpt: extractRelevantExcerpt(item.content, keywords) } : {})
  }));
  return textResult({ query, totalResults: ranked.length, showing: results.length, results });
}

export function getEntry(relativePath, knowledgeRoot = KB_PATH) {
  const file = safeKnowledgePath(relativePath, knowledgeRoot);
  if (!file || !fs.existsSync(file)) return textResult({ error: 'not_found', path: relativePath }, true);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const { metadata } = parsePage(content);
    const links = [...new Set([...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(match => match[1]))];
    return textResult({
      path: path.relative(fs.realpathSync(knowledgeRoot), file),
      frontmatter: metadata,
      content,
      links
    });
  } catch (error) {
    return textResult({ error: 'read_failed', message: error.message }, true);
  }
}

export function listEntries(args = {}, knowledgeRoot = KB_PATH) {
  const category = args.category || 'all';
  if (!LISTABLE_KNOWLEDGE_CATEGORIES.has(category)) {
    return textResult({ error: 'invalid_category', category }, true);
  }
  const sortBy = args.sort_by || 'updated';
  const limit = Math.max(1, Math.min(Number(args.limit) || 20, 500));
  const requestedRoot = category === 'all' ? knowledgeRoot : path.join(knowledgeRoot, category);
  if (!fs.existsSync(requestedRoot)) {
    return textResult({
      scope: '01-Knowledge',
      total: 0,
      showing: 0,
      sort_by: sortBy,
      entries: []
    });
  }
  const categoryRoot = safeKnowledgeDirectory(category, knowledgeRoot);
  if (!categoryRoot) {
    return textResult({ error: 'invalid_category_root', category }, true);
  }
  const entries = [];
  const realKnowledgeRoot = fs.realpathSync(knowledgeRoot);
  for (const file of walkMarkdown(categoryRoot)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const { metadata } = parsePage(content);
      if (args.tag_filter && !(metadata.tags || []).some(tag => tag.includes(args.tag_filter))) continue;
      const relativePath = path.relative(realKnowledgeRoot, file);
      const actualCategory = relativePath.split(path.sep)[0];
      entries.push({
        title: content.match(/^#\s+(.+)$/m)?.[1] || path.basename(file, '.md'),
        path: relativePath,
        category: actualCategory,
        summary: metadata.summary || '',
        updated: String(metadata.updated || ''),
        created: String(metadata.created || ''),
        status: metadata.status || 'unknown',
        freshness: metadata.freshness || 'unknown',
        tags: metadata.tags || []
      });
    } catch {}
  }
  entries.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'zh-CN');
    return String(b[sortBy]).localeCompare(String(a[sortBy])) || a.title.localeCompare(b.title, 'zh-CN');
  });
  return textResult({
    scope: '01-Knowledge',
    total: entries.length,
    showing: Math.min(entries.length, limit),
    sort_by: sortBy,
    entries: entries.slice(0, limit)
  });
}

export function createServer(options = {}) {
  const vaultPath = path.resolve(options.vaultPath || VAULT_PATH);
  const knowledgeRoot = path.join(vaultPath, '01-Knowledge');
  const server = new Server(
    { name: 'second-brain', version: PACKAGE_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions() }));
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const name = request.params.name;
    const args = request.params.arguments || {};
    if (name === 'get_common_rules') return getCommonRules(vaultPath);
    if (name === 'get_agent_profile') return getAgentProfile(args, vaultPath);
    if (name === 'get_mountain_context') return getMountainContext(args, vaultPath);
    if (name === 'list_second_brain_skills') return listSecondBrainSkills(args, vaultPath);
    if (name === 'read_second_brain_skill') return readSecondBrainSkill(args, vaultPath);
    if (name === 'search_knowledge') return searchKnowledge(args.query, knowledgeRoot);
    if (name === 'get_entry') return getEntry(args.path, knowledgeRoot);
    if (name === 'list_entries') return listEntries(args, knowledgeRoot);
    if (name === 'capture_from_conversation') {
      try {
        return textResult(captureKnowledge(args, { vaultPath }));
      } catch (error) {
        const known = error instanceof CaptureError;
        return textResult({
          error: known ? error.code : 'unexpected_error',
          message: error.message,
          ...(known && error.details ? { details: error.details } : {})
        }, true);
      }
    }
    return textResult({ error: 'unknown_tool', name }, true);
  });
  return server;
}

export async function main() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error('Second Brain MCP server running');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
