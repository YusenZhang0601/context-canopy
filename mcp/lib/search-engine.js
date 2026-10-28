import fs from 'node:fs';
import path from 'node:path';
import { parsePage, resolveVaultPath, shanghaiClock } from './vault-writer.js';

export const CANONICAL_DOMAINS = [
  { domain: '01-Knowledge', scopeKey: 'knowledge' },
  { domain: '02-Insights', scopeKey: 'insights' },
  { domain: '03-Personal', scopeKey: 'personal' }
];

const ZH_SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
  : null;

const STOPWORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '怎么', '什么', '几个', '多久', '上次', '关于', '请问', '一下',
  '哪个', '哪些', '多少', '能否', '可以', '为什么', '如何', '还是', '以及', '或者',
  '我们', '你们', '他们', '这个', '那个', '这些', '那些', '里', '中', '与', '及',
  'the', 'and', 'for', 'with', 'how', 'what', 'is', 'are', 'to', 'in', 'of', 'on',
  'at', 'by', 'from', 'as', 'an', 'be', 'or', 'that', 'this',
  'topic', 'domain', 'status', 'source', 'privacy'
]);

const CJK_REGEX = /[\u4e00-\u9fff]/;
const CJK_RUN_REGEX = /[\u4e00-\u9fff]{2,}/g;
const ASCII_TOKEN_REGEX = /[a-z0-9]+(?:[._+-][a-z0-9]+)*/gi;

export function normalizeComparable(text) {
  return String(text || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\-_,.，。、：:;；!！?？()（）[\]【】《》"'“”‘’`/\\|]+/g, '');
}

function splitCamelAndSymbols(raw) {
  const expanded = String(raw || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
  const parts = expanded.split(/[^a-z0-9]+/).filter(Boolean);
  return parts;
}

export function tokenizeQuery(rawQuery) {
  const text = String(rawQuery || '').normalize('NFC').trim();
  if (!text) return { primary: [], bigrams: [], all: [] };

  const primaryMap = new Map();
  const addPrimary = (token, weight = 1.0) => {
    const clean = token.trim().toLowerCase();
    if (!clean || STOPWORDS.has(clean)) return;
    if (!CJK_REGEX.test(clean) && clean.length < 2) return;
    const prev = primaryMap.get(clean) || 0;
    if (weight > prev) primaryMap.set(clean, weight);
  };

  for (const match of text.matchAll(ASCII_TOKEN_REGEX)) {
    const full = match[0].toLowerCase();
    addPrimary(full, 1.0);
    for (const sub of splitCamelAndSymbols(match[0])) {
      if (sub !== full && sub.length >= 2) addPrimary(sub, 0.85);
    }
  }

  if (ZH_SEGMENTER) {
    let singleCharBuffer = '';
    const flushSingleCharBuffer = () => {
      if (singleCharBuffer.length >= 2) {
        addPrimary(singleCharBuffer, 0.95);
      } else if (singleCharBuffer.length === 1 && text.length <= 4) {
        addPrimary(singleCharBuffer, 0.8);
      }
      singleCharBuffer = '';
    };
    for (const seg of ZH_SEGMENTER.segment(text)) {
      if (!seg.isWordLike) {
        flushSingleCharBuffer();
        continue;
      }
      const word = seg.segment.trim().toLowerCase();
      if (!word || STOPWORDS.has(word)) {
        flushSingleCharBuffer();
        continue;
      }
      if (CJK_REGEX.test(word)) {
        if (word.length >= 2) {
          flushSingleCharBuffer();
          addPrimary(word, 1.0);
        } else {
          singleCharBuffer += word;
        }
      } else {
        flushSingleCharBuffer();
        if (word.length >= 2) {
          addPrimary(word, 1.0);
        }
      }
    }
    flushSingleCharBuffer();
  } else {
    for (const run of text.matchAll(CJK_RUN_REGEX)) {
      addPrimary(run[0], 1.0);
    }
  }

  const bigramMap = new Map();
  for (const runMatch of text.matchAll(CJK_RUN_REGEX)) {
    const run = runMatch[0];
    if (run.length === 2 && !STOPWORDS.has(run)) {
      addPrimary(run, 1.0);
      continue;
    }
    for (let i = 0; i + 2 <= run.length; i += 1) {
      const bi = run.slice(i, i + 2);
      if (!STOPWORDS.has(bi) && !primaryMap.has(bi)) {
        bigramMap.set(bi, 0.35);
      }
    }
  }

  if (primaryMap.size === 0 && bigramMap.size === 0) {
    for (const word of text.toLowerCase().split(/\s+/).filter(w => w.length > 0)) {
      primaryMap.set(word, 1.0);
    }
  }

  const primary = [...primaryMap.entries()].map(([term, weight]) => ({ term, weight, kind: 'primary' }));
  const bigrams = [...bigramMap.entries()].map(([term, weight]) => ({ term, weight, kind: 'bigram' }));
  return {
    primary,
    bigrams,
    all: [...primary, ...bigrams]
  };
}

function stripFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  return match ? markdown.slice(match[0].length) : markdown;
}

function parseSections(body) {
  const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)];
  if (headings.length === 0) {
    return {
      substantiveBody: body.replace(/^#\s+.+$/m, '').trim(),
      relationsText: '',
      sourceLinksText: '',
      changelogText: ''
    };
  }
  const sections = new Map();
  const preamble = body.slice(0, headings[0].index).replace(/^#\s+.+$/m, '').trim();
  for (let i = 0; i < headings.length; i += 1) {
    const name = headings[i][1].trim();
    const start = headings[i].index + headings[i][0].length;
    const end = i + 1 < headings.length ? headings[i + 1].index : body.length;
    sections.set(name, body.slice(start, end).trim());
  }

  const substantiveParts = [];
  if (preamble) substantiveParts.push(preamble);
  for (const [name, content] of sections.entries()) {
    if (name === '关系' || name === '来源双链' || name === '更新记录') continue;
    if (content) substantiveParts.push(`## ${name}\n${content}`);
  }

  return {
    substantiveBody: substantiveParts.join('\n\n').trim(),
    relationsText: sections.get('关系') || '',
    sourceLinksText: sections.get('来源双链') || '',
    changelogText: sections.get('更新记录') || ''
  };
}

function parseRelationSectionLinks(relationsText) {
  if (!relationsText) return [];
  const items = [];
  for (const line of relationsText.split(/\r?\n/)) {
    const labelMatch = line.match(/^-\s+\*\*(.+?)\*\*\s*[：:]/);
    const label = labelMatch ? labelMatch[1].trim() : '关联';
    for (const wikilink of line.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
      const raw = wikilink[1].trim();
      const [targetPart, displayPart] = raw.split('|').map(s => s.trim());
      if (!targetPart || targetPart.startsWith('04-Sources/')) continue;
      items.push({
        label,
        rawTarget: targetPart.replace(/\.md$/i, ''),
        display: displayPart || targetPart.split('/').pop()
      });
    }
  }
  return items;
}

export function buildCleanExcerpt(substantiveBody, summary, tokens, maxLength = 180) {
  const cleanBody = String(substantiveBody || '')
    .replace(/^##\s+核心摘要\s*$/gm, '')
    .replace(/^##\s+内容\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sourceText = cleanBody || String(summary || '').trim();
  if (!sourceText) return '';

  const lower = sourceText.toLowerCase();
  const terms = (tokens || []).map(t => (typeof t === 'string' ? t : t.term)).filter(Boolean);
  if (terms.length === 0 || sourceText.length <= maxLength) {
    return sourceText.slice(0, maxLength) + (sourceText.length > maxLength ? '…' : '');
  }

  const hitPositions = [];
  for (const term of terms) {
    let pos = lower.indexOf(term);
    while (pos !== -1) {
      hitPositions.push({ pos, term });
      pos = lower.indexOf(term, pos + term.length);
    }
  }

  if (hitPositions.length === 0) {
    return sourceText.slice(0, maxLength) + (sourceText.length > maxLength ? '…' : '');
  }

  hitPositions.sort((a, b) => a.pos - b.pos);
  let bestStart = Math.max(0, hitPositions[0].pos - 30);
  let bestScore = -1;

  for (const anchor of hitPositions) {
    const windowStart = Math.max(0, anchor.pos - 35);
    const windowEnd = Math.min(sourceText.length, windowStart + maxLength);
    const matchedTerms = new Set();
    let totalHits = 0;
    for (const candidate of hitPositions) {
      if (candidate.pos >= windowStart && candidate.pos < windowEnd) {
        matchedTerms.add(candidate.term);
        totalHits += 1;
      }
    }
    const windowScore = matchedTerms.size * 10 + totalHits;
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestStart = windowStart;
    }
  }

  const end = Math.min(sourceText.length, bestStart + maxLength);
  const snippet = sourceText.slice(bestStart, end).replace(/\s+/g, ' ').trim();
  return `${bestStart > 0 ? '…' : ''}${snippet}${end < sourceText.length ? '…' : ''}`;
}

function countOccurrences(haystack, needle) {
  if (!haystack || !needle) return 0;
  let count = 0;
  let pos = haystack.indexOf(needle);
  while (pos !== -1) {
    count += 1;
    pos = haystack.indexOf(needle, pos + needle.length);
  }
  return count;
}

function walkSafeMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  let realRoot;
  try {
    realRoot = fs.realpathSync(rootDir);
    if (!fs.statSync(realRoot).isDirectory()) return [];
  } catch {
    return [];
  }

  const files = [];
  const stack = [realRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      try {
        const realEntry = fs.realpathSync(fullPath);
        if (realEntry !== realRoot && !realEntry.startsWith(`${realRoot}${path.sep}`)) {
          continue;
        }
        const stat = fs.statSync(realEntry);
        if (stat.isDirectory()) {
          stack.push(realEntry);
        } else if (stat.isFile() && entry.name.endsWith('.md')) {
          files.push({ filePath: realEntry, realRoot, mtimeMs: stat.mtimeMs, size: stat.size });
        }
      } catch {
        // Ignore broken or escaping symlinks
      }
    }
  }
  return files.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

function detectVaultLayout(basePath) {
  const resolved = path.resolve(basePath);
  if (path.basename(resolved) === '01-Knowledge') {
    const parent = path.dirname(resolved);
    const hasInsights = fs.existsSync(path.join(parent, '02-Insights'));
    const hasPersonal = fs.existsSync(path.join(parent, '03-Personal'));
    if (hasInsights || hasPersonal) {
      return {
        isVault: true,
        vaultRoot: parent,
        knowledgeRoot: resolved
      };
    }
  }
  if (fs.existsSync(path.join(resolved, '01-Knowledge'))) {
    return {
      isVault: true,
      vaultRoot: resolved,
      knowledgeRoot: path.join(resolved, '01-Knowledge')
    };
  }
  return {
    isVault: false,
    vaultRoot: null,
    knowledgeRoot: resolved
  };
}

class GraphIndexCache {
  constructor() {
    this.fileCache = new Map();
  }

  parseRecord({ filePath, realRoot, domain, mtimeMs, size }, today) {
    const cached = this.fileCache.get(filePath);
    if (cached && cached.mtimeMs === mtimeMs && cached.size === size && cached.today === today) {
      return cached.record;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let metadata = {};
    let body = content;
    try {
      const parsed = parsePage(content);
      metadata = parsed.metadata || {};
      body = parsed.body;
    } catch {
      body = stripFrontmatter(content);
    }

    const fileStem = path.basename(filePath, '.md');
    const title = body.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim() || fileStem;
    const relToDomain = path.relative(realRoot, filePath).split(path.sep).join('/');
    const canonicalPath = domain ? `${domain}/${relToDomain}` : relToDomain;
    const toolPath = domain === '01-Knowledge' || !domain ? relToDomain : canonicalPath;
    const category = relToDomain.includes('/') ? relToDomain.split('/')[0] : (domain || 'general');
    const aliases = Array.isArray(metadata.aliases)
      ? metadata.aliases.map(a => String(a).trim()).filter(Boolean)
      : [];
    const tags = Array.isArray(metadata.tags)
      ? metadata.tags.map(t => String(t).trim()).filter(Boolean)
      : [];
    const summary = String(metadata.summary || '').trim();
    const freshness = String(metadata.freshness || 'unknown');
    const confidence = String(metadata.confidence || 'unknown');
    const status = String(metadata.status || 'unknown');
    const privacy = metadata.privacy ? String(metadata.privacy) : null;
    const updated = metadata.updated ? String(metadata.updated) : '';
    const created = metadata.created ? String(metadata.created) : '';
    const reviewAfter = metadata.review_after ? String(metadata.review_after) : null;
    const isExpired = freshness === 'current' && Boolean(reviewAfter) && reviewAfter < today;

    const { substantiveBody, relationsText } = parseSections(body);
    const rawRelations = parseRelationSectionLinks(relationsText);
    const allWikilinks = [...new Set([...content.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1]))];

    const record = {
      filePath,
      domain: domain || '01-Knowledge',
      relToDomain,
      canonicalPath,
      toolPath,
      category,
      fileStem,
      title,
      aliases,
      tags,
      summary,
      freshness,
      confidence,
      status,
      privacy,
      updated,
      created,
      reviewAfter,
      isExpired,
      metadata,
      content,
      substantiveBody,
      relationsText,
      rawRelations,
      allWikilinks,
      titleLower: `${title} ${fileStem}`.toLowerCase(),
      titleNorm: normalizeComparable(title),
      stemNorm: normalizeComparable(fileStem),
      aliasesLower: aliases.join(' ').toLowerCase(),
      aliasesNorm: aliases.map(normalizeComparable).filter(Boolean),
      summaryLower: summary.toLowerCase(),
      tagsLower: `${tags.map(t => t.replace(/^(?:domain|status|source|privacy|topic)\//i, '')).join(' ')} ${category}`.toLowerCase(),
      bodyLower: substantiveBody.toLowerCase(),
      relationsLower: relationsText.toLowerCase(),
      bodyLength: Math.max(1, substantiveBody.length)
    };

    this.fileCache.set(filePath, { mtimeMs, size, today, record });
    return record;
  }

  loadRecords(basePath, { scope = 'all', allowVaultUpgrade = false } = {}) {
    const today = shanghaiClock().day;
    const layout = detectVaultLayout(basePath);
    const useMultiDomain = layout.isVault && (allowVaultUpgrade || path.resolve(basePath) === layout.vaultRoot);

    const domainSpecs = [];
    if (useMultiDomain) {
      for (const spec of CANONICAL_DOMAINS) {
        if (scope === 'all' || scope === spec.scopeKey || scope === spec.domain) {
          domainSpecs.push({
            domain: spec.domain,
            rootDir: path.join(layout.vaultRoot, spec.domain)
          });
        }
      }
    } else {
      domainSpecs.push({
        domain: '01-Knowledge',
        rootDir: path.resolve(basePath)
      });
    }

    const records = [];
    for (const { domain, rootDir } of domainSpecs) {
      for (const fileInfo of walkSafeMarkdownFiles(rootDir)) {
        try {
          records.push(this.parseRecord({ ...fileInfo, domain }, today));
        } catch {
          // Skip unreadable files
        }
      }
    }

    return { records, layout, useMultiDomain, today };
  }

  buildGraph(records) {
    const byIdentity = new Map();
    const addKey = (key, record) => {
      const norm = String(key || '').normalize('NFC').trim().toLowerCase();
      if (!norm) return;
      if (!byIdentity.has(norm)) byIdentity.set(norm, []);
      const list = byIdentity.get(norm);
      if (!list.includes(record)) list.push(record);
    };

    for (const record of records) {
      addKey(record.canonicalPath.replace(/\.md$/i, ''), record);
      addKey(record.toolPath.replace(/\.md$/i, ''), record);
      addKey(record.relToDomain.replace(/\.md$/i, ''), record);
      addKey(record.fileStem, record);
      addKey(record.title, record);
      for (const alias of record.aliases) addKey(alias, record);
    }

    const resolveTarget = rawTarget => {
      const clean = String(rawTarget || '').replace(/\.md$/i, '').trim().toLowerCase();
      const candidates = byIdentity.get(clean) || [];
      return candidates.length === 1 ? candidates[0] : candidates[0] || null;
    };

    const outboundMap = new Map();
    const inboundMap = new Map();
    for (const record of records) {
      outboundMap.set(record.canonicalPath, []);
      inboundMap.set(record.canonicalPath, []);
    }

    for (const record of records) {
      const seenOutbound = new Set();
      for (const rel of record.rawRelations) {
        const targetRecord = resolveTarget(rel.rawTarget);
        if (targetRecord && targetRecord.canonicalPath !== record.canonicalPath) {
          const dedupKey = `${rel.label}:${targetRecord.canonicalPath}`;
          if (seenOutbound.has(dedupKey)) continue;
          seenOutbound.add(dedupKey);
          outboundMap.get(record.canonicalPath).push({
            label: rel.label,
            title: targetRecord.title,
            path: targetRecord.toolPath,
            canonical_path: targetRecord.canonicalPath,
            domain: targetRecord.domain,
            summary: targetRecord.summary,
            freshness: targetRecord.freshness
          });
          inboundMap.get(targetRecord.canonicalPath).push({
            label: rel.label,
            title: record.title,
            path: record.toolPath,
            canonical_path: record.canonicalPath,
            domain: record.domain,
            summary: record.summary,
            freshness: record.freshness
          });
        } else {
          outboundMap.get(record.canonicalPath).push({
            label: rel.label,
            title: rel.display,
            path: rel.rawTarget,
            canonical_path: null,
            domain: null,
            summary: '',
            freshness: 'unknown'
          });
        }
      }
    }

    return { outboundMap, inboundMap, resolveTarget };
  }
}

export const sharedGraphCache = new GraphIndexCache();

export function searchCanonicalGraph(rawInput, basePath = resolveVaultPath(), options = {}) {
  const args = typeof rawInput === 'string' ? { query: rawInput } : (rawInput || {});
  const rawQuery = String(args.query || '').replace(/[;&|`$()]/g, '').replace(/\.\./g, '').slice(0, 200).trim();
  if (!rawQuery) {
    return { error: 'invalid_query', message: '查询不能为空' };
  }

  const scope = args.scope || 'all';
  const validScopes = new Set(['all', 'knowledge', 'insights', 'personal', '01-Knowledge', '02-Insights', '03-Personal']);
  if (!validScopes.has(scope)) {
    return { error: 'invalid_scope', scope };
  }

  const { records } = sharedGraphCache.loadRecords(basePath, {
    scope,
    allowVaultUpgrade: options.allowVaultUpgrade ?? true
  });
  const { outboundMap } = sharedGraphCache.buildGraph(records);

  const filteredRecords = records.filter(record => {
    if (args.category && record.category.toLowerCase() !== String(args.category).toLowerCase() && record.domain.toLowerCase() !== String(args.category).toLowerCase()) {
      return false;
    }
    if (args.tag_filter && !record.tags.some(tag => tag.toLowerCase().includes(String(args.tag_filter).toLowerCase()))) {
      return false;
    }
    if (args.freshness && record.freshness !== args.freshness) {
      return false;
    }
    return true;
  });

  const { primary, all: tokens } = tokenizeQuery(rawQuery);
  const queryNorm = normalizeComparable(rawQuery);
  const totalDocs = Math.max(1, filteredRecords.length);
  const avgBodyLength = filteredRecords.reduce((sum, r) => sum + r.bodyLength, 0) / totalDocs;

  const docFreq = new Map();
  for (const token of tokens) {
    let df = 0;
    for (const record of filteredRecords) {
      if (
        record.titleLower.includes(token.term) ||
        record.aliasesLower.includes(token.term) ||
        record.summaryLower.includes(token.term) ||
        record.tagsLower.includes(token.term) ||
        record.bodyLower.includes(token.term)
      ) {
        df += 1;
      }
    }
    docFreq.set(token.term, df);
  }

  const k1 = 1.2;
  const b = 0.75;
  const ranked = [];

  for (const record of filteredRecords) {
    let score = 0;
    const matchedFields = new Set();
    let matchedPrimaryCount = 0;
    let matchedBigramCount = 0;
    let maxMatchedPrimaryIdf = 0;

    // 1. Exact or phrase-level title / alias boost
    if (queryNorm.length >= 2) {
      if (record.titleNorm === queryNorm || record.stemNorm === queryNorm || record.aliasesNorm.includes(queryNorm)) {
        score += 50;
        matchedFields.add('exact_title');
      } else if (
        record.titleNorm.includes(queryNorm) ||
        record.stemNorm.includes(queryNorm) ||
        record.aliasesNorm.some(a => a.includes(queryNorm))
      ) {
        score += 28;
        matchedFields.add('title');
      } else if (
        queryNorm.length >= 4 &&
        ((record.titleNorm.length >= 4 && queryNorm.includes(record.titleNorm)) ||
          record.aliasesNorm.some(a => a.length >= 4 && queryNorm.includes(a)))
      ) {
        score += 22;
        matchedFields.add('title');
      }
    }

    // 2. Per-token BM25F multi-field scoring
    for (const token of tokens) {
      const df = docFreq.get(token.term) || 0;
      const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
      const baseWeight = token.weight * Math.max(0.4, idf);

      let tokenHitMain = false;

      if (record.titleLower.includes(token.term)) {
        score += baseWeight * 8.5;
        matchedFields.add('title');
        tokenHitMain = true;
      }
      if (record.aliasesLower.includes(token.term)) {
        score += baseWeight * 7.0;
        matchedFields.add('aliases');
        tokenHitMain = true;
      }
      if (record.summaryLower.includes(token.term)) {
        score += baseWeight * 4.5;
        matchedFields.add('summary');
        tokenHitMain = true;
      }
      if (record.tagsLower.includes(token.term)) {
        score += baseWeight * 3.5;
        matchedFields.add('tags');
        tokenHitMain = true;
      }

      const bodyTf = countOccurrences(record.bodyLower, token.term);
      if (bodyTf > 0) {
        const tfNorm = (bodyTf * (k1 + 1)) / (bodyTf + k1 * (1 - b + b * (record.bodyLength / avgBodyLength)));
        score += baseWeight * 2.5 * tfNorm;
        matchedFields.add('body');
        tokenHitMain = true;
      }

      if (!tokenHitMain && record.relationsLower.includes(token.term)) {
        score += baseWeight * 0.25;
        matchedFields.add('relations');
      }

      const tokenMatchedAny = tokenHitMain || record.relationsLower.includes(token.term);
      if (tokenMatchedAny) {
        if (token.kind === 'primary') {
          matchedPrimaryCount += 1;
          if (idf > maxMatchedPrimaryIdf) maxMatchedPrimaryIdf = idf;
        } else {
          matchedBigramCount += 1;
        }
      }
    }

    if (score <= 0) continue;

    const hasTitleOrAliasMatch =
      matchedFields.has('exact_title') || matchedFields.has('title') || matchedFields.has('aliases');
    if (primary.length > 0 && matchedPrimaryCount === 0 && !hasTitleOrAliasMatch && matchedBigramCount < 2) {
      continue;
    }
    if (primary.length >= 3 && matchedPrimaryCount === 1 && !hasTitleOrAliasMatch && maxMatchedPrimaryIdf < 3.0) {
      continue;
    }
    if (primary.length >= 2 && matchedFields.size === 1 && matchedFields.has('relations') && matchedPrimaryCount < 2) {
      continue;
    }

    // 3. Query coverage multiplier for multi-keyword queries
    if (primary.length > 1) {
      const coverage = matchedPrimaryCount / primary.length;
      const coverageFactor = 0.55 + 0.45 * coverage;
      score *= coverageFactor * coverageFactor;
      if (matchedPrimaryCount === primary.length) {
        score += 6.0;
      }
    }

    // 4. Subtle freshness tie-breaker
    if (record.freshness === 'current' && !record.isExpired) score += 0.15;
    else if (record.freshness === 'timeless') score += 0.12;
    else if (record.freshness === 'stale') score += 0.04;

    ranked.push({
      record,
      score: Number(score.toFixed(2)),
      matchedIn: [...matchedFields]
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.record.canonicalPath.localeCompare(b.record.canonicalPath, 'zh-CN'));

  const topScore = ranked.length > 0 ? ranked[0].score : 0;
  const prunedRanked =
    primary.length >= 2 && topScore >= 30
      ? ranked.filter(
          item =>
            item.score >= topScore * 0.12 ||
            item.matchedIn.includes('exact_title') ||
            item.matchedIn.includes('title') ||
            item.matchedIn.includes('aliases')
        )
      : ranked;

  const limit = Math.max(1, Math.min(Number(args.limit) || 10, 50));
  const results = prunedRanked.slice(0, limit).map(({ record, score, matchedIn }, index) => {
    const outbound = (outboundMap.get(record.canonicalPath) || []).slice(0, 6).map(rel => ({
      label: rel.label,
      target: rel.title,
      path: rel.path
    }));
    return {
      rank: index + 1,
      score,
      title: record.title,
      path: record.toolPath,
      canonical_path: record.canonicalPath,
      domain: record.domain,
      category: record.category,
      summary: record.summary,
      freshness: record.freshness,
      ...(record.reviewAfter ? { review_after: record.reviewAfter, is_expired: record.isExpired } : {}),
      confidence: record.confidence,
      ...(record.privacy ? { privacy: record.privacy } : {}),
      updated: record.updated,
      matched_in: matchedIn,
      excerpt: buildCleanExcerpt(record.substantiveBody, record.summary, primary.length > 0 ? primary : tokens),
      relations: outbound
    };
  });

  return {
    query: rawQuery,
    tokens: primary.map(t => t.term),
    scope,
    totalResults: prunedRanked.length,
    showing: results.length,
    results
  };
}
