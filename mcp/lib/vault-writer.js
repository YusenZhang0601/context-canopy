import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

export function resolveVaultPath(explicitPath = process.env.SECOND_BRAIN_VAULT_PATH) {
  if (explicitPath && String(explicitPath).trim()) {
    return path.resolve(String(explicitPath).trim());
  }
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const siblingVault = path.resolve(currentDir, '../../vault');
  if (fs.existsSync(siblingVault)) {
    return siblingVault;
  }
  const cwdVault = path.resolve(process.cwd(), 'vault');
  if (fs.existsSync(cwdVault)) {
    return cwdVault;
  }
  return siblingVault;
}

const CATEGORIES = new Set(['Experience', 'Projects', 'Technical']);
const CONFIDENCE = new Set(['low', 'medium', 'high']);
const FRESHNESS = new Set(['timeless', 'current', 'stale', 'blocked']);
const CARD_FORMS = new Set(['atomic', 'entity']);
const REQUIRED_FIELDS = [
  'type',
  'created',
  'updated',
  'status',
  'summary',
  'confidence',
  'aliases',
  'freshness',
  'last_checked',
  'sources',
  'tags'
];

export class CaptureError extends Error {
  constructor(message, code = 'capture_error', details = undefined) {
    super(message);
    this.name = 'CaptureError';
    this.code = code;
    this.details = details;
  }
}

export function shanghaiClock(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).map(part => [part.type, part.value])
  );
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return { day, timestamp: `${day} ${parts.hour}:${parts.minute} +08:00` };
}

export function parsePage(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new CaptureError('页面缺少合法 YAML frontmatter', 'invalid_yaml');

  const document = YAML.parseDocument(match[1], { prettyErrors: true, strict: true });
  if (document.errors.length > 0) {
    throw new CaptureError(
      `YAML 解析失败：${document.errors.map(error => error.message).join('; ')}`,
      'invalid_yaml'
    );
  }
  const metadata = document.toJS();
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new CaptureError('frontmatter 必须是 YAML mapping', 'invalid_yaml');
  }
  return { metadata, body: markdown.slice(match[0].length), frontmatterEnd: match[0].length };
}

export function serializePage(metadata, body) {
  const yaml = YAML.stringify(metadata, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n${body.replace(/^\n+/, '')}`;
}

function uniqueStrings(values = []) {
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string' || /\r|\n/.test(value))) {
    throw new CaptureError('数组字段必须使用字符串数组', 'invalid_input');
  }
  return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function singleLine(value, field) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new CaptureError(`${field} 不能为空`, 'invalid_input');
  if (/\r|\n/.test(normalized)) {
    throw new CaptureError(`${field} 必须是单行字符串`, 'invalid_input');
  }
  return normalized;
}

function normalizeSourceRef(value) {
  let source = String(value).trim();
  const wikilink = source.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/);
  if (wikilink) source = wikilink[1].trim();
  return source;
}

export function normalizeSources(values) {
  const sources = uniqueStrings(values).map(normalizeSourceRef);
  return [...new Set(sources)];
}

export function isDurableSource(source) {
  if (!source || source === 'Current conversation') return false;
  return /^(?:https?:\/\/|\/)/.test(source) || source.startsWith('04-Sources/') || /\.[A-Za-z0-9]{1,8}$/.test(source);
}

function isGenericReadme(source) {
  if (!source || source === 'Current conversation') return false;
  try {
    const pathname = /^https?:\/\//.test(source) ? new URL(source).pathname : source;
    return path.basename(pathname).toLowerCase() === 'readme.md';
  } catch {
    return false;
  }
}

export function readControlledTags(ontologyPath) {
  const content = fs.readFileSync(ontologyPath, 'utf8');
  const allowed = new Set();
  for (const match of content.matchAll(/`((?:domain|status|source|privacy|topic)\/[^`\s]+)`/g)) {
    allowed.add(match[1]);
  }
  if (allowed.size === 0) {
    throw new CaptureError(`未能从 ${ontologyPath} 读取受控标签`, 'ontology_unreadable');
  }
  return allowed;
}

function sourceTag(sources) {
  if (sources.some(source => /^https?:\/\//.test(source))) return 'source/web';
  if (sources.some(source => source.replaceAll('\\', '/').includes('04-Sources/Knowledge/Imported/live-verification-'))) {
    return 'source/live-verification';
  }
  if (sources.some(source => source.replaceAll('\\', '/').includes('04-Sources/'))) return 'source/manual';
  return 'source/conversation';
}

export function normalizeAndValidateTags(inputTags, { allowedTags, status, sources }) {
  const tags = uniqueStrings(inputTags || []);
  const expectedStatus = `status/${status}`;
  const statusTags = tags.filter(tag => tag.startsWith('status/'));
  if (statusTags.length > 0 && (statusTags.length !== 1 || statusTags[0] !== expectedStatus)) {
    throw new CaptureError(
      `status 标签必须与页面状态一致，应为 ${expectedStatus}`,
      'invalid_tag',
      { tags: statusTags }
    );
  }

  const normalized = [...tags];
  for (const required of ['domain/knowledge', expectedStatus, sourceTag(sources)]) {
    if (!normalized.includes(required)) normalized.push(required);
  }
  const invalid = normalized.filter(tag => !allowedTags.has(tag));
  if (invalid.length > 0) {
    throw new CaptureError(
      `发现未在 ONTOLOGY.md 注册的标签：${invalid.join(', ')}`,
      'invalid_tag',
      { invalid_tags: invalid }
    );
  }
  return normalized;
}

function cleanConcept(value) {
  if (typeof value !== 'string') {
    throw new CaptureError('canonical 关系目标必须是字符串', 'invalid_relation');
  }
  const raw = String(value).trim();
  const match = raw.match(/^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/);
  const target = (match ? match[1] : raw).trim().replace(/\.md$/, '');
  if (!target || target.startsWith('04-Sources/') || target.includes('\n')) {
    throw new CaptureError(`非法 canonical 关系：${raw}`, 'invalid_relation');
  }
  return target;
}

export function normalizeRelatedConcepts(values, { required = true } = {}) {
  const concepts = uniqueStrings(values || []).map(cleanConcept);
  const unique = [...new Set(concepts)];
  if (required && unique.length < 2) {
    throw new CaptureError('新页面至少需要 2 条真实 canonical 关系', 'insufficient_relations');
  }
  return unique;
}

export function readAllowedRelations(ontologyPath) {
  const content = fs.readFileSync(ontologyPath, 'utf8');
  const relationBlock = content.match(/^## Relation Sections\s*$([\s\S]*?)(?=^##\s+)/m)?.[1] || '';
  const allowed = new Set([...relationBlock.matchAll(/^-\s+`([^`]+)`\s*$/gm)].map(match => match[1]));
  if (allowed.size === 0) {
    throw new CaptureError(`未能从 ${ontologyPath} 读取关系标签`, 'ontology_unreadable');
  }
  return allowed;
}

export function normalizeRelations(values, { allowedRelations, required = true } = {}) {
  if (!Array.isArray(values)) {
    throw new CaptureError('relations 必须是数组', 'invalid_relation');
  }
  const normalized = [];
  const seen = new Set();
  for (const value of values) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new CaptureError('relations 每项必须是 object', 'invalid_relation');
    }
    const target = cleanConcept(value.target);
    const label = String(value.label || '').trim();
    const reciprocalLabel = String(value.reciprocal_label || '').trim();
    if (!allowedRelations.has(label)) {
      throw new CaptureError(`非法关系标签：${label || '(empty)'}`, 'invalid_relation');
    }
    if (reciprocalLabel && !allowedRelations.has(reciprocalLabel)) {
      throw new CaptureError(`非法 reciprocal_label：${reciprocalLabel}`, 'invalid_relation');
    }
    const key = `${target}\u0000${label}\u0000${reciprocalLabel}`;
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push({ target, label, reciprocal_label: reciprocalLabel || null });
    }
  }
  if (required && new Set(normalized.map(item => item.target)).size < 2) {
    throw new CaptureError('新页面至少需要 2 个不同目标的 outbound relation', 'insufficient_relations');
  }
  if (required && !normalized.some(item => item.reciprocal_label)) {
    throw new CaptureError('至少 1 条 relation 必须显式提供 reciprocal_label', 'reciprocal_relation_required');
  }
  return normalized;
}

function vaultRelativeSource(source, vaultPath) {
  if (!source || /^https?:\/\//.test(source) || source === 'Current conversation') return null;
  if (!vaultPath) return path.isAbsolute(source) ? null : source.replaceAll('\\', '/');
  const root = path.resolve(vaultPath);
  const resolved = path.isAbsolute(source) ? path.resolve(source) : path.resolve(root, source);
  if (!resolved.startsWith(root + path.sep)) return null;
  return path.relative(root, resolved).split(path.sep).join('/');
}

function localSourceLink(source, vaultPath) {
  const relative = vaultRelativeSource(source, vaultPath);
  if (!relative?.endsWith('.md')) return null;
  const target = relative.slice(0, -3);
  return `[[${target}|${path.basename(relative, '.md')}]]`;
}

function buildSourceSection(sources, vaultPath) {
  const links = sources.map(source => localSourceLink(source, vaultPath)).filter(Boolean);
  if (links.length === 0) return '';
  return `\n## 来源双链\n\n${links.map(link => `- ${link}`).join('\n')}\n`;
}

function relationSection(relations) {
  const groups = new Map();
  for (const relation of relations) {
    if (!groups.has(relation.label)) groups.set(relation.label, []);
    const links = groups.get(relation.label);
    if (!links.includes(relation.target)) links.push(relation.target);
  }
  return [...groups.entries()]
    .map(([label, targets]) => `- **${label}**：${targets.map(target => `[[${target}]]`).join('、')}`)
    .join('\n');
}

const SUPPORT_BLOCK_LABELS = new Set([
  '解释',
  '边界',
  '限制',
  '验证',
  '应用',
  '证据',
  '示例',
  '反例',
  '当前状态'
]);

const DOCUMENT_TITLE_MARKERS = [
  /\breadme\b/i,
  /\bmanual\b/i,
  /\bhandbook\b/i,
  /\bcomplete guide\b/i,
  /\breport\b/i,
  /\brun(?:ning)? log\b/i,
  /完整指南/,
  /手册/,
  /会议记录/,
  /运行日志/,
  /时间线/,
  /工作体系/,
  /上手流程/,
  /资产概览/
];

function ensureSafeContent(content, { form }) {
  const value = String(content).trim();
  if (!value) throw new CaptureError('content 不能为空', 'invalid_input');
  if (/^#{1,6}\s+/m.test(value) || /^.+\n(?:={3,}|-{3,})\s*$/m.test(value)) {
    throw new CaptureError(
      'content 内不能包含文档级标题；原子卡只允许核心说明和解释、边界、限制、验证、应用等支撑块',
      'invalid_content'
    );
  }
  if (value.length > 4000) {
    throw new CaptureError('content 超过原子卡写入上限；请先把完整材料存入 Sources 再拆分候选', 'invalid_content');
  }
  if (/(?:^|\n)\s*(?:table of contents|目录)\s*(?:\n|$)/i.test(value)) {
    throw new CaptureError('content 疑似完整文档目录；请先存入 Sources 再拆分原子候选', 'invalid_content');
  }

  const blocks = value.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);
  if (form === 'atomic' && blocks.length > 2) {
    const unsupported = blocks.slice(1).filter(block => {
      const match = block.match(/^(?:[-*]\s+)?\*\*([^*]+)\*\*[：:]/);
      return !match || !SUPPORT_BLOCK_LABELS.has(match[1].trim());
    });
    if (unsupported.length > 0) {
      throw new CaptureError(
        'atomic content 含多个未标注用途的实质块；合并为单一说明，或仅用解释、边界、限制、验证、应用、证据等标签支撑同一主题',
        'invalid_content'
      );
    }
  }

  const topicLabels = [...value.matchAll(/^(?:[-*]\s+)?(?:\*\*)?([^:\n：]{2,60})(?:\*\*)?[：:]\s+\S/gm)]
    .map(match => match[1].trim())
    .filter(label => !SUPPORT_BLOCK_LABELS.has(label));
  if (form === 'atomic' && new Set(topicLabels).size >= 3) {
    throw new CaptureError('atomic content 含多个并列主题标签；请先存入 Sources 并拆成多个候选', 'invalid_content');
  }
  return value;
}

function effectiveConfidence(requested, sources) {
  const confidence = requested || 'medium';
  if (!CONFIDENCE.has(confidence)) {
    throw new CaptureError(`非法 confidence：${confidence}`, 'invalid_input');
  }
  const durableSources = sources.filter(isDurableSource);
  if (confidence === 'high' && durableSources.length === 0) {
    return {
      confidence: 'medium',
      warning: '仅有 Current conversation 或非持久来源，confidence 已从 high 降为 medium'
    };
  }
  if (confidence === 'high' && durableSources.every(isGenericReadme)) {
    return {
      confidence: 'medium',
      warning: '通用 README 不能作为高置信具体断言的唯一证据，confidence 已降为 medium'
    };
  }
  return { confidence };
}

function validateFreshness(value) {
  const freshness = value || 'timeless';
  if (!FRESHNESS.has(freshness)) {
    throw new CaptureError(`非法 freshness：${freshness}`, 'invalid_input');
  }
  return freshness;
}

function normalizeAtomicContract(args) {
  const form = String(args.card_form || '').trim();
  if (!CARD_FORMS.has(form)) {
    throw new CaptureError('card_form 必须是 atomic 或 entity', 'invalid_atomic_contract');
  }
  const scope = singleLine(args.atomic_scope, 'atomic_scope');
  if (scope.length > 200) {
    throw new CaptureError('atomic_scope 必须在 200 字符以内', 'invalid_atomic_contract');
  }
  const title = singleLine(args.title, 'title');
  if (DOCUMENT_TITLE_MARKERS.some(pattern => pattern.test(title) || pattern.test(scope))) {
    throw new CaptureError(
      '标题或 atomic_scope 表明输入仍是 README、手册、报告、日志、时间线或导航文档；请先存入 Sources 再提取原子主题',
      'invalid_atomic_contract'
    );
  }
  if (form === 'atomic' && /(项目)?(?:概览|总览)/.test(title)) {
    throw new CaptureError('概览页只能在确有实体边界时使用 card_form: entity；纯导航不得写入', 'invalid_atomic_contract');
  }
  return { form, scope };
}

function normalizeFreshnessMetadata(freshnessValue, reviewAfterValue, checkedDay) {
  const freshness = validateFreshness(freshnessValue);
  const reviewAfter = String(reviewAfterValue || '').trim();
  if (freshness !== 'current') {
    if (reviewAfter) {
      throw new CaptureError('只有 freshness: current 可以设置 review_after', 'invalid_freshness');
    }
    return { freshness };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewAfter)) {
    throw new CaptureError('freshness: current 必须提供 YYYY-MM-DD 格式的 review_after', 'invalid_freshness');
  }
  if (reviewAfter < checkedDay) {
    throw new CaptureError('review_after 不得早于 last_checked', 'invalid_freshness');
  }
  return { freshness, review_after: reviewAfter };
}

export function buildNewPage(args, { ontologyPath, vaultPath, now = new Date() }) {
  const clock = shanghaiClock(now);
  const atomicContract = normalizeAtomicContract(args);
  const sources = normalizeSources(args.source_refs?.length ? args.source_refs : ['Current conversation']);
  const confidenceResult = effectiveConfidence(args.confidence, sources);
  const status = confidenceResult.confidence === 'high' ? 'active' : 'seed';
  const allowedTags = readControlledTags(ontologyPath);
  const tags = normalizeAndValidateTags(args.tags, { allowedTags, status, sources });
  const relations = normalizeRelations(args.relations, {
    allowedRelations: readAllowedRelations(ontologyPath),
    required: true
  });
  const content = ensureSafeContent(args.content, atomicContract);
  const summary = singleLine(args.summary, 'summary');
  const title = singleLine(args.title, 'title');

  const freshnessMetadata = normalizeFreshnessMetadata(args.freshness || 'timeless', args.review_after, clock.day);
  const metadata = {
    type: 'knowledge',
    created: clock.day,
    updated: clock.day,
    status,
    summary,
    confidence: confidenceResult.confidence,
    aliases: uniqueStrings(args.aliases || []),
    ...freshnessMetadata,
    last_checked: clock.day,
    sources,
    tags
  };
  const body = `# ${title}\n\n` +
    `## 核心摘要\n\n${summary}\n\n` +
    `## 关系\n\n${relationSection(relations)}\n\n` +
    `## 内容\n\n${content}\n` +
    buildSourceSection(sources, vaultPath) +
    `\n## 更新记录\n\n- ${clock.day}：初始创建；来源与关系已按 capture 门禁校验。\n`;

  return {
    markdown: serializePage(metadata, body),
    metadata,
    warnings: confidenceResult.warning ? [confidenceResult.warning] : []
  };
}

function sectionBounds(body, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = pattern.exec(body);
  if (!match) return null;
  const contentStart = match.index + match[0].length;
  const next = /^##\s+/m.exec(body.slice(contentStart));
  return {
    headingStart: match.index,
    contentStart,
    end: next ? contentStart + next.index : body.length
  };
}

function replaceSection(body, heading, value) {
  const bounds = sectionBounds(body, heading);
  const block = `## ${heading}\n\n${String(value).trim()}\n\n`;
  if (!bounds) {
    const update = sectionBounds(body, '更新记录');
    const insertAt = update ? update.headingStart : body.length;
    return `${body.slice(0, insertAt).replace(/\s*$/, '\n\n')}${block}${body.slice(insertAt)}`;
  }
  return `${body.slice(0, bounds.headingStart)}${block}${body.slice(bounds.end).replace(/^\s*/, '')}`;
}

function appendUpdate(body, line) {
  const bounds = sectionBounds(body, '更新记录');
  if (!bounds) return `${body.trimEnd()}\n\n## 更新记录\n\n${line}\n`;
  const old = body.slice(bounds.contentStart, bounds.end).trim();
  const value = old ? `${old}\n${line}` : line;
  return replaceSection(body, '更新记录', value).trimEnd() + '\n';
}

export function updateExistingPage(markdown, args, { ontologyPath, vaultPath, now = new Date() }) {
  const { metadata: originalMetadata, body: originalBody } = parsePage(markdown);
  const clock = shanghaiClock(now);
  const atomicContract = normalizeAtomicContract(args);
  const incomingSources = Object.hasOwn(args, 'source_refs')
    ? normalizeSources(args.source_refs || [])
    : ['Current conversation'];
  const sources = normalizeSources([...(originalMetadata.sources || []), ...incomingSources]);
  const requestedConfidence = args.confidence || originalMetadata.confidence || 'medium';
  const confidenceResult = effectiveConfidence(requestedConfidence, sources);
  const status = confidenceResult.confidence === 'high'
    ? (originalMetadata.status === 'stable' ? 'stable' : 'active')
    : (originalMetadata.status === 'deprecated' ? 'deprecated' : 'seed');
  const allowedTags = readControlledTags(ontologyPath);
  const suppliedTags = Object.hasOwn(args, 'tags') ? args.tags : (originalMetadata.tags || []);
  const tagsWithoutLifecycle = uniqueStrings(suppliedTags).filter(tag => !tag.startsWith('status/'));
  const tags = normalizeAndValidateTags(tagsWithoutLifecycle, { allowedTags, status, sources });
  const summary = singleLine(args.summary, 'summary');
  const aliases = uniqueStrings([...(originalMetadata.aliases || []), ...(args.aliases || [])]);

  const requestedFreshness = args.freshness || originalMetadata.freshness || 'timeless';
  const requestedReviewAfter = Object.hasOwn(args, 'review_after')
    ? args.review_after
    : originalMetadata.review_after;
  const freshnessMetadata = normalizeFreshnessMetadata(requestedFreshness, requestedReviewAfter, clock.day);
  const metadata = {
    ...originalMetadata,
    updated: clock.day,
    status,
    summary,
    confidence: confidenceResult.confidence,
    aliases,
    ...freshnessMetadata,
    last_checked: clock.day,
    sources,
    tags
  };
  if (freshnessMetadata.freshness !== 'current') delete metadata.review_after;

  let body = originalBody;
  body = replaceSection(body, '核心摘要', summary);
  body = replaceSection(body, '内容', ensureSafeContent(args.content, atomicContract));
  if (Object.hasOwn(args, 'relations')) {
    const relations = normalizeRelations(args.relations, {
      allowedRelations: readAllowedRelations(ontologyPath),
      required: true
    });
    body = replaceSection(body, '关系', relationSection(relations));
  }
  const sourceSection = buildSourceSection(sources, vaultPath).trim();
  if (sourceSection) body = replaceSection(body, '来源双链', sourceSection.replace(/^## 来源双链\s*/, ''));
  body = appendUpdate(body, `- ${clock.day}：更新正文与摘要；重新校验来源、标签和关系。`);

  return {
    markdown: serializePage(metadata, body),
    metadata,
    warnings: confidenceResult.warning ? [confidenceResult.warning] : []
  };
}

export function validateCanonicalPage(markdown, { vaultPath, layout = 'managed' } = {}) {
  const { metadata, body } = parsePage(markdown);
  const missing = REQUIRED_FIELDS.filter(field => !Object.hasOwn(metadata, field));
  if (missing.length > 0) {
    throw new CaptureError(`缺少必填 frontmatter 字段：${missing.join(', ')}`, 'invalid_page');
  }
  if (!Array.isArray(metadata.aliases) || !Array.isArray(metadata.sources) || !Array.isArray(metadata.tags)) {
    throw new CaptureError('aliases、sources、tags 必须是数组', 'invalid_page');
  }
  if (!CONFIDENCE.has(metadata.confidence) || !FRESHNESS.has(metadata.freshness)) {
    throw new CaptureError('confidence 或 freshness 枚举非法', 'invalid_page');
  }
  const h1 = [...body.matchAll(/^#\s+.+$/gm)];
  if (h1.length !== 1) throw new CaptureError(`页面必须恰有一个 H1，当前为 ${h1.length}`, 'invalid_page');
  const requiredHeadings = layout === 'managed'
    ? ['核心摘要', '关系', '内容', '更新记录']
    : ['关系', '更新记录'];
  for (const heading of requiredHeadings) {
    if (!sectionBounds(body, heading)) throw new CaptureError(`页面缺少 ## ${heading}`, 'invalid_page');
  }
  const relations = sectionBounds(body, '关系');
  const relationText = body.slice(relations.contentStart, relations.end);
  if ((relationText.match(/\[\[/g) || []).length < 2) {
    throw new CaptureError('关系区少于 2 条 canonical 关系', 'invalid_page');
  }
  if (metadata.confidence === 'high' && !metadata.sources.some(isDurableSource)) {
    throw new CaptureError('high confidence 页面必须至少有一个持久来源', 'invalid_page');
  }
  if (vaultPath) {
    const vaultRoot = path.resolve(vaultPath);
    const sourceRoot = path.join(vaultRoot, '04-Sources');
    for (const source of metadata.sources) {
      if (typeof source !== 'string') throw new CaptureError('sources 只能包含普通字符串', 'invalid_page');
      if (source.includes('[[')) throw new CaptureError('sources 不得包含 wikilink', 'invalid_page');
      if (/^https?:\/\//.test(source) || source === 'Current conversation') continue;
      const sourcePath = path.isAbsolute(source) ? path.resolve(source) : path.resolve(vaultRoot, source);
      if (!path.isAbsolute(source) && !sourcePath.startsWith(vaultRoot + path.sep)) {
        throw new CaptureError(`本地来源越出 Vault：${source}`, 'missing_source');
      }
      if (!fs.existsSync(sourcePath)) {
        throw new CaptureError(`本地来源不存在：${source}`, 'missing_source');
      }
      const sourceRelative = path.relative(sourceRoot, sourcePath);
      const isSourceLayerMarkdown = sourceRelative !== '' &&
        sourceRelative !== '..' &&
        !sourceRelative.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(sourceRelative) &&
        sourcePath.toLowerCase().endsWith('.md');
      const relativeSource = vaultRelativeSource(source, vaultPath);
      const sourceTarget = isSourceLayerMarkdown && relativeSource?.endsWith('.md')
        ? relativeSource.slice(0, -3)
        : null;
      if (sourceTarget && !body.includes(`[[${sourceTarget}`)) {
        throw new CaptureError(`缺少正文来源双链：${source}`, 'missing_source_link');
      }
    }
  }
  return metadata;
}

export function safeEntryPath(kbPath, relativePath) {
  const root = path.resolve(kbPath);
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep) || path.extname(resolved) !== '.md') {
    throw new CaptureError(`非法 target_path：${relativePath}`, 'invalid_path');
  }
  return resolved;
}

export function fileNameForTitle(title) {
  const safe = String(title).trim().replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '-');
  if (!safe || safe === '.' || safe === '..') throw new CaptureError('标题无法生成安全文件名', 'invalid_input');
  return `${safe}.md`;
}

function walkMarkdown(root) {
  if (!fs.existsSync(root)) return [];
  const output = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) output.push(full);
    }
  }
  return output.sort();
}

function canonicalRecords(kbPath) {
  const records = [];
  for (const file of walkMarkdown(kbPath)) {
    try {
      const markdown = fs.readFileSync(file, 'utf8');
      const { metadata, body } = parsePage(markdown);
      const h1 = body.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(file, '.md');
      const relativePath = path.relative(kbPath, file).split(path.sep).join('/');
      records.push({
        file,
        markdown,
        metadata,
        title: h1,
        relativePath,
        linkTarget: `01-Knowledge/${relativePath.replace(/\.md$/, '')}`,
        identities: [path.basename(file, '.md'), h1, ...(metadata.aliases || [])]
          .map(value => String(value).trim().normalize('NFC'))
          .filter(Boolean)
      });
    } catch {
      // 全库编译器负责报告既有坏页；写入器只解析可安全更新的 canonical 页面。
    }
  }
  return records;
}

export function findExactDuplicates(title, kbPath) {
  const identity = singleLine(title, 'title').normalize('NFC');
  const parsed = canonicalRecords(kbPath)
    .filter(record => record.identities.includes(identity))
    .map(record => ({
      path: record.relativePath,
      title: record.title,
      matched_identity: identity
    }));
  const knownPaths = new Set(parsed.map(item => item.path));
  for (const file of walkMarkdown(kbPath)) {
    const relativePath = path.relative(kbPath, file).split(path.sep).join('/');
    if (knownPaths.has(relativePath)) continue;
    if (path.basename(file, '.md').normalize('NFC') === identity) {
      parsed.push({ path: relativePath, title: path.basename(file, '.md'), matched_identity: identity });
    }
  }
  return parsed.sort((a, b) => a.path.localeCompare(b.path));
}

function resolveRelations(relations, kbPath, primaryPath) {
  const records = canonicalRecords(kbPath);
  return relations.map(relation => {
    let matches = [];
    const target = relation.target.replace(/^01-Knowledge\//, '');
    if (target.includes('/')) {
      const candidate = safeEntryPath(kbPath, `${target}.md`);
      const direct = records.find(record => path.resolve(record.file) === path.resolve(candidate));
      if (direct) matches = [direct];
    }
    if (matches.length === 0) {
      const identity = relation.target.normalize('NFC');
      matches = records.filter(record => record.identities.includes(identity));
    }
    if (matches.length === 0) {
      throw new CaptureError(`关系目标不存在：${relation.target}`, 'missing_relation_target');
    }
    if (matches.length > 1) {
      throw new CaptureError(
        `关系目标不唯一：${relation.target}`,
        'ambiguous_relation_target',
        { matches: matches.map(record => record.relativePath) }
      );
    }
    const record = matches[0];
    if (path.resolve(record.file) === path.resolve(primaryPath)) {
      throw new CaptureError(`关系不能指向页面自身：${relation.target}`, 'self_relation');
    }
    return {
      ...relation,
      target: record.linkTarget,
      targetFile: record.file,
      targetMarkdown: record.markdown
    };
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addReciprocalRelation(markdown, label, target, now) {
  const { metadata, body: originalBody } = parsePage(markdown);
  const bounds = sectionBounds(originalBody, '关系');
  if (!bounds) throw new CaptureError('reciprocal 目标页面缺少 ## 关系', 'invalid_page');
  const relationBody = originalBody.slice(bounds.contentStart, bounds.end).trim();
  const exactLink = new RegExp(`\\[\\[${escapeRegExp(target)}(?:\\|[^\\]]+)?\\]\\]`);
  const labelPattern = new RegExp(`^-\\s+\\*\\*${escapeRegExp(label)}\\*\\*\\s*[：:]`);
  const lines = relationBody ? relationBody.split('\n') : [];
  const index = lines.findIndex(line => labelPattern.test(line));
  if (index >= 0 && exactLink.test(lines[index])) return markdown;
  if (index >= 0) {
    const separator = /[：:]\s*$/.test(lines[index]) ? '' : '、';
    lines[index] = `${lines[index].trimEnd()}${separator}[[${target}]]`;
  } else {
    lines.push(`- **${label}**：[[${target}]]`);
  }

  const clock = shanghaiClock(now);
  const updatedMetadata = {
    ...metadata,
    updated: clock.day
  };
  let body = replaceSection(originalBody, '关系', lines.join('\n'));
  body = appendUpdate(body, `- ${clock.day}：MCP capture 同步 reciprocal relation 到 [[${target}]]。`);
  return serializePage(updatedMetadata, body);
}

function reciprocalUpdates(relations, primaryLink, now) {
  const updates = new Map();
  for (const relation of relations) {
    if (!relation.reciprocal_label) continue;
    const current = updates.get(relation.targetFile) || relation.targetMarkdown;
    const updated = addReciprocalRelation(current, relation.reciprocal_label, primaryLink, now);
    if (updated !== relation.targetMarkdown) updates.set(relation.targetFile, updated);
  }
  return updates;
}

function titleTokens(title) {
  const compact = String(title).toLowerCase().replace(/[\s\-_,.，。、：:()（）]/g, '');
  const tokens = new Set([compact]);
  for (let i = 0; i + 3 <= compact.length; i += 2) tokens.add(compact.slice(i, i + 3));
  return [...tokens].filter(token => token.length >= 2);
}

export function findDuplicateCandidates(title, kbPath, limit = 5) {
  const tokens = titleTokens(title);
  const candidates = [];
  for (const file of walkMarkdown(kbPath)) {
    try {
      const markdown = fs.readFileSync(file, 'utf8');
      const { metadata, body } = parsePage(markdown);
      const h1 = body.match(/^#\s+(.+)$/m)?.[1] || path.basename(file, '.md');
      const haystack = `${h1}\n${(metadata.aliases || []).join('\n')}\n${metadata.summary || ''}`.toLowerCase();
      const matches = tokens.filter(token => haystack.includes(token));
      if (matches.length > 0) {
        candidates.push({
          path: path.relative(kbPath, file),
          title: h1,
          summary: metadata.summary || '',
          matched_keywords: matches
        });
      }
    } catch {
      // 全库编译器负责报告既有坏页；查重阶段只返回可读候选。
    }
  }
  return candidates
    .sort((a, b) => b.matched_keywords.length - a.matched_keywords.length || a.path.localeCompare(b.path))
    .slice(0, limit);
}

function atomicWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.tmp-${process.pid}-${crypto.randomBytes(6).toString('hex')}`
  );
  let descriptor;
  try {
    descriptor = fs.openSync(temp, 'wx', 0o600);
    fs.writeFileSync(descriptor, content, 'utf8');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temp, filePath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function commitValidatedPage(filePath, markdown, vaultPath, { layout = 'managed' } = {}) {
  const temp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.validate-${process.pid}-${crypto.randomBytes(6).toString('hex')}`
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    fs.writeFileSync(temp, markdown, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    validateCanonicalPage(fs.readFileSync(temp, 'utf8'), { vaultPath, layout });
    fs.renameSync(temp, filePath);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function snapshotFiles(paths) {
  return new Map(paths.map(file => {
    if (!fs.existsSync(file)) return [file, { exists: false }];
    const stat = fs.statSync(file);
    return [file, {
      exists: true,
      content: fs.readFileSync(file),
      mode: stat.mode & 0o777
    }];
  }));
}

function restoreFiles(snapshot) {
  for (const [file, state] of snapshot.entries()) {
    if (!state.exists) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      atomicWrite(file, state.content);
      fs.chmodSync(file, state.mode);
    }
  }
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readAtomicityRegistry(registryPath) {
  if (!fs.existsSync(registryPath)) {
    return { version: 1, review_date: '', entries: {} };
  }
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (error) {
    throw new CaptureError(`原子性登记无法解析：${error.message}`, 'atomicity_registry_invalid');
  }
  if (registry?.version !== 1 || !registry.entries || typeof registry.entries !== 'object' || Array.isArray(registry.entries)) {
    throw new CaptureError('原子性登记结构非法', 'atomicity_registry_invalid');
  }
  return registry;
}

function updateAtomicityRegistry({
  registryPath,
  vaultPath,
  primaryPath,
  reciprocalPaths,
  cardForm,
  atomicScope,
  now
}) {
  const clock = shanghaiClock(now);
  const registry = readAtomicityRegistry(registryPath);
  const canonicalKey = filePath => path.relative(vaultPath, filePath).split(path.sep).join('/');
  const primaryKey = canonicalKey(primaryPath);
  registry.entries[primaryKey] = {
    sha256: sha256File(primaryPath),
    form: cardForm,
    scope: atomicScope,
    reviewed_at: clock.day,
    reviewed_by: 'MCP capture atomic contract'
  };
  for (const reciprocalPath of reciprocalPaths) {
    const key = canonicalKey(reciprocalPath);
    const previous = registry.entries[key];
    if (!previous) {
      throw new CaptureError(`reciprocal 页面缺少原子性登记：${key}`, 'atomicity_review_missing');
    }
    registry.entries[key] = {
      ...previous,
      sha256: sha256File(reciprocalPath),
      reviewed_at: clock.day,
      reviewed_by: 'MCP reciprocal relation maintenance'
    };
  }
  registry.review_date = clock.day;
  const sortedEntries = Object.fromEntries(
    Object.entries(registry.entries).sort(([left], [right]) => left.localeCompare(right))
  );
  atomicWrite(registryPath, `${JSON.stringify({ ...registry, entries: sortedEntries }, null, 2)}\n`);
}

export function runVaultCompiler(vaultPath, mode) {
  const script = path.join(vaultPath, '90-System', 'scripts', 'compile_vault.py');
  if (!fs.existsSync(script)) throw new CaptureError(`编译器不存在：${script}`, 'compiler_missing');
  const args = mode === 'write-derived'
    ? [script, '--write-derived', '--format', 'json']
    : [script, '--check', '--format', 'json'];
  const result = spawnSync(process.env.SECOND_BRAIN_PYTHON || 'python3', args, {
    cwd: vaultPath,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    const detail = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join('\n').slice(-8000);
    throw new CaptureError(`Vault ${mode} 失败：${detail}`, 'compiler_failed');
  }
  return result.stdout;
}

function logEntry({
  title,
  relativePath,
  summary,
  confidence,
  mode,
  sources,
  cardForm,
  atomicScope,
  reciprocalPaths = []
}, now) {
  const clock = shanghaiClock(now);
  const action = mode === 'update' ? '更新' : '新建';
  return `\n## [${clock.timestamp}] ingest | ${title} | MCP 事务捕获\n\n` +
    `- ${action} \`${relativePath}\`\n` +
    `- 摘要：${summary}\n` +
    `- 原子契约：${cardForm}；${atomicScope}\n` +
    `- 标记：${confidence} 置信度\n` +
    `- 来源：${sources.join('；')}\n` +
    (reciprocalPaths.length > 0 ? `- Reciprocal 同步：${reciprocalPaths.join('；')}\n` : '') +
    `- 派生层：全量重建 INDEX 与来源覆盖账本\n` +
    `- 门禁：派生重建与 compile_vault.py --check 纳入同一回滚事务\n\n` +
    `---\n\n**状态**: ✅ MCP 事务提交完成\n`;
}

function acquireLock(systemPath) {
  const lockPath = path.join(systemPath, '.capture.lock');
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${process.pid}\n`, 'utf8');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new CaptureError('另一个 capture 事务正在运行，请稍后重试', 'capture_locked');
    }
    throw error;
  }
  return () => {
    try { fs.closeSync(descriptor); } catch {}
    try { fs.unlinkSync(lockPath); } catch {}
  };
}

export function captureKnowledge(args, options = {}) {
  const vaultPath = path.resolve(options.vaultPath || resolveVaultPath());
  const kbPath = path.join(vaultPath, '01-Knowledge');
  const systemPath = path.join(vaultPath, '90-System');
  const ontologyPath = path.join(systemPath, 'ONTOLOGY.md');
  const now = options.now || new Date();
  const compilerRunner = options.compilerRunner || runVaultCompiler;

  if (!args || !args.title || !args.content || !args.category || !args.summary || !args.card_form || !args.atomic_scope) {
    throw new CaptureError(
      '缺少必填字段 title、content、category、summary、card_form 或 atomic_scope',
      'invalid_input'
    );
  }
  if (!CATEGORIES.has(args.category)) {
    throw new CaptureError('category 必须是 Experience、Projects 或 Technical', 'invalid_input');
  }
  singleLine(args.title, 'title');
  singleLine(args.summary, 'summary');
  const atomicContract = normalizeAtomicContract(args);

  const mode = args.target_path ? 'update' : 'create';
  const filePath = mode === 'update'
    ? safeEntryPath(kbPath, args.target_path)
    : path.join(kbPath, args.category, fileNameForTitle(args.title));
  if (mode === 'update' && !fs.existsSync(filePath)) {
    throw new CaptureError(`target_path 不存在：${args.target_path}`, 'missing_target');
  }

  if (mode === 'create') {
    if (fs.existsSync(filePath)) {
      return {
        action_required: 'duplicate_decision',
        exact_match: path.relative(kbPath, filePath).split(path.sep).join('/'),
        message: '目标文件名已存在；请使用 target_path 更新，或明确采用不同概念标题。'
      };
    }
    const exactMatches = findExactDuplicates(args.title, kbPath);
    if (exactMatches.length > 0) {
      return {
        action_required: 'duplicate_decision',
        exact_match: exactMatches[0].path,
        exact_matches: exactMatches,
        message: '精确同名、H1 或 alias 已存在；请使用 target_path 更新，或明确采用不同概念标题。'
      };
    }
    if (args.check_duplicates !== false) {
      const candidates = findDuplicateCandidates(args.title, kbPath);
      if (candidates.length > 0) {
        return {
          action_required: 'review_duplicates',
          candidates,
          message: '发现疑似重复概念；请使用 target_path 更新，或复核后以不同标题再次调用。'
        };
      }
    }
  }

  const hasRelations = Object.hasOwn(args, 'relations');
  if (!hasRelations && Object.hasOwn(args, 'related_concepts')) {
    return {
      action_required: 'reciprocal_relation_decision',
      related_concepts: normalizeRelatedConcepts(args.related_concepts, { required: mode === 'create' }),
      message: 'related_concepts 缺少关系语义；请改用 relations，为每项指定 label，并至少指定一条 reciprocal_label。'
    };
  }
  if (mode === 'create' && !hasRelations) {
    return {
      action_required: 'reciprocal_relation_decision',
      related_concepts: [],
      message: '新页面需要至少 2 条有语义的 relations，并至少指定一条 reciprocal_label。'
    };
  }

  const normalizedRelations = hasRelations
    ? normalizeRelations(args.relations, {
        allowedRelations: readAllowedRelations(ontologyPath),
        required: true
      })
    : null;

  const indexPath = path.join(systemPath, 'INDEX.md');
  const coveragePath = path.join(systemPath, 'SOURCE-COVERAGE.md');
  const logPath = path.join(systemPath, 'LOG.md');
  const atomicityPath = path.join(systemPath, 'ATOMICITY-REVIEW.json');
  const releaseLock = acquireLock(systemPath);
  let snapshot;

  try {
    try {
      compilerRunner(vaultPath, 'check');
    } catch (error) {
      throw new CaptureError(
        `Vault 写前基线失败，未开始写入：${error.message}`,
        'vault_baseline_failed',
        error.details
      );
    }

    if (mode === 'create') {
      if (fs.existsSync(filePath)) {
        throw new CaptureError('锁定后发现目标文件已由另一事务创建', 'duplicate_race');
      }
      const raceMatches = findExactDuplicates(args.title, kbPath);
      if (raceMatches.length > 0) {
        throw new CaptureError(
          '锁定后发现同名页面已由另一事务创建',
          'duplicate_race',
          { exact_matches: raceMatches }
        );
      }
    } else if (!fs.existsSync(filePath)) {
      throw new CaptureError(`锁定后 target_path 不存在：${args.target_path}`, 'missing_target');
    }

    const resolvedRelations = normalizedRelations
      ? resolveRelations(normalizedRelations, kbPath, filePath)
      : [];
    const relationArgs = normalizedRelations
      ? {
          ...args,
          relations: resolvedRelations.map(({ target, label, reciprocal_label: reciprocalLabel }) => ({
            target,
            label,
            reciprocal_label: reciprocalLabel
          }))
        }
      : args;
    const fileIdentity = path.basename(filePath, '.md');
    const buildArgs = mode === 'create' && fileIdentity !== String(args.title).trim()
      ? {
          ...relationArgs,
          aliases: uniqueStrings([...(relationArgs.aliases || []), String(args.title).trim()])
        }
      : relationArgs;
    const built = mode === 'create'
      ? buildNewPage(buildArgs, { ontologyPath, vaultPath, now })
      : updateExistingPage(fs.readFileSync(filePath, 'utf8'), buildArgs, { ontologyPath, vaultPath, now });
    const relativePath = path.relative(vaultPath, filePath).split(path.sep).join('/');
    const primaryLink = relativePath.replace(/\.md$/, '');
    const reciprocal = reciprocalUpdates(resolvedRelations, primaryLink, now);
    const reciprocalPaths = [...reciprocal.keys()]
      .map(target => path.relative(vaultPath, target).split(path.sep).join('/'))
      .sort();

    snapshot = snapshotFiles([
      filePath,
      ...reciprocal.keys(),
      indexPath,
      coveragePath,
      logPath,
      atomicityPath
    ]);
    commitValidatedPage(filePath, built.markdown, vaultPath);
    for (const [targetPath, markdown] of [...reciprocal.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      // 历史 canonical 可能没有 MCP 模板的“核心摘要/内容”章节；reciprocal
      // 只维护既有关系与更新记录，完整语义正确性仍由同一事务末尾的 compiler 检查。
      commitValidatedPage(targetPath, markdown, vaultPath, { layout: 'existing' });
    }
    updateAtomicityRegistry({
      registryPath: atomicityPath,
      vaultPath,
      primaryPath: filePath,
      reciprocalPaths: [...reciprocal.keys()],
      cardForm: atomicContract.form,
      atomicScope: atomicContract.scope,
      now
    });
    const oldLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
    atomicWrite(logPath, oldLog + logEntry({
      title: args.title,
      relativePath,
      summary: built.metadata.summary,
      confidence: built.metadata.confidence,
      mode,
      sources: built.metadata.sources,
      cardForm: atomicContract.form,
      atomicScope: atomicContract.scope,
      reciprocalPaths
    }, now));
    compilerRunner(vaultPath, 'write-derived');
    compilerRunner(vaultPath, 'check');
    return {
      success: true,
      path: path.relative(kbPath, filePath),
      mode,
      reciprocal_paths: reciprocalPaths,
      confidence: built.metadata.confidence,
      card_form: atomicContract.form,
      atomic_scope: atomicContract.scope,
      warnings: built.warnings.length > 0 ? built.warnings : undefined,
      message: '页面、派生索引和日志已通过事务门禁提交'
    };
  } catch (error) {
    if (!snapshot) throw error;
    try {
      restoreFiles(snapshot);
    } catch (rollbackError) {
      throw new CaptureError(
        `事务失败且回滚不完整：${error.message}; rollback: ${rollbackError.message}`,
        'rollback_failed'
      );
    }
    throw new CaptureError(`事务失败并已回滚：${error.message}`, error.code || 'transaction_failed', error.details);
  } finally {
    releaseLock();
  }
}
