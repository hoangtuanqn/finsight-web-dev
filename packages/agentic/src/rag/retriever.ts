import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../config';
import { getEmbeddingModel } from '../llm-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeSearchResult {
  title: string;
  chunk: string;
  category: string;
  similarity: string;
  matchType?: 'vector' | 'keyword';
  lexicalScore?: number;
}

// ─── Finance term registry (expanded) ─────────────────────────────────────────

/**
 * Exact finance acronyms and key terms that get boosted scoring.
 * Lower-cased so they match after normalizeForSearch().
 */
const KNOWN_FINANCE_TERMS = new Set([
  // Core debt/loan
  'apr',
  'ear',
  'dti',
  'ltv',
  // Investment
  'dca',
  'etf',
  'roi',
  'irr',
  'npv',
  'cagr',
  'nav',
  // Market
  'fomo',
  'vix',
  'fdi',
  // Strategy
  'snowball',
  'avalanche',
  // Banking / compliance
  'kyc',
  'aml',
  // Misc
  'ebit',
  'ebitda',
]);

// ─── Stop words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'anh',
  'ban',
  'bao',
  'cac',
  'cho',
  'co',
  'cua',
  'duoc',
  'dong',
  // 'gi'  intentionally excluded: "là gì" is a meaningful definition signal
  'hay',
  'hinh',
  'lich',
  // 'la'  intentionally excluded: "là gì" pair must survive tokenization
  'minh',
  'mot',
  'nao',
  'nhu',
  'nhung',
  'su',
  'thanh',
  'tien',
  'toi',
  'trong',
  'va',
  've',
]);

// ─── RRF constant ─────────────────────────────────────────────────────────────

/** Standard RRF k-constant. Higher values reduce the impact of rank gaps. */
const K_RRF = 60;

// ─── Knowledge doc cache ──────────────────────────────────────────────────────

interface CachedKnowledgeDoc {
  title: string;
  category: string;
  tags: string[];
  chunks: string[];
  /** fs.statSync().mtimeMs at cache time — used for invalidation. */
  mtimeMs: number;
}

/** Per-file cache keyed by absolute file path. Invalidated on mtime change. */
const knowledgeDocCache = new Map<string, CachedKnowledgeDoc>();

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeQuery(query: string): string[] {
  const tokens = normalizeForSearch(query)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return [...new Set(tokens)];
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: {} as any, body: content };

  const metadata: any = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: any = line.slice(colonIdx + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }

    metadata[key] = value;
  }

  return { metadata, body: match[2].trim() };
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

function hasNonHeadingText(markdown: string): boolean {
  return markdown.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('---');
  });
}

function chunkMarkdownBody(body: string, docTitle: string): string[] {
  const sections = body.split(/(?=^## )/m).map((section) => section.trim());
  const chunks = sections
    .filter((section) => section.length > 20 && hasNonHeadingText(section))
    .map((section) => `# ${docTitle}\n\n${section}`);

  if (chunks.length > 0) return chunks;
  return body.trim().length > 20 ? [`# ${docTitle}\n\n${body.trim()}`] : [];
}

// ─── Knowledge dir resolution ─────────────────────────────────────────────────

function knowledgeDirCandidates(): string[] {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.resolve(process.cwd(), 'data/knowledge'),
    path.resolve(process.cwd(), 'apps/api/data/knowledge'),
    path.resolve(moduleDir, '../../../../apps/api/data/knowledge'),
    path.resolve(moduleDir, '../../../../../apps/api/data/knowledge'),
  ];
}

function resolveKnowledgeDir(): string | null {
  return knowledgeDirCandidates().find((candidate) => fs.existsSync(candidate)) ?? null;
}

// ─── Cached doc loader ────────────────────────────────────────────────────────

/**
 * Load and parse a knowledge doc from disk, using an in-memory cache
 * keyed by the file's modification time. Cache is automatically invalidated
 * when the underlying .md file changes.
 */
function loadDocCached(filePath: string): CachedKnowledgeDoc {
  const stat = fs.statSync(filePath);
  const cached = knowledgeDocCache.get(filePath);

  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { metadata, body } = parseFrontmatter(raw);
  const title = metadata.title || path.basename(filePath).replace(/\.md$/, '');

  const doc: CachedKnowledgeDoc = {
    title,
    category: metadata.category || 'CONCEPT',
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    chunks: chunkMarkdownBody(body, title),
    mtimeMs: stat.mtimeMs,
  };

  knowledgeDocCache.set(filePath, doc);
  return doc;
}

// ─── Keyword scoring ──────────────────────────────────────────────────────────

function scoreKeywordMatch(query: string, title: string, chunk: string, tags: string[]): number {
  const queryTokens = tokenizeQuery(query);
  if (queryTokens.length === 0) return 0;

  const exactTerms = queryTokens.filter((token) => KNOWN_FINANCE_TERMS.has(token));
  const normalizedTitle = normalizeForSearch(title);
  const normalizedTags = normalizeForSearch(tags.join(' '));
  const normalizedChunk = normalizeForSearch(chunk);
  const definitionQuery = /\b(la gi|dinh nghia|khai niem|giai thich)\b/.test(normalizeForSearch(query));

  let score = 0;
  const matchedQueryTokens = new Set<string>();

  for (const term of exactTerms) {
    if (normalizedTitle.includes(term)) {
      score += 14;
      matchedQueryTokens.add(term);
    }
    if (normalizedTags.includes(term)) {
      score += 12;
      matchedQueryTokens.add(term);
    }
    if (normalizedChunk.includes(term)) {
      score += 7;
      matchedQueryTokens.add(term);
    }
  }

  for (const token of queryTokens) {
    if (normalizedTitle.includes(token)) {
      score += 4;
      matchedQueryTokens.add(token);
    }
    if (normalizedTags.includes(token)) {
      score += 3;
      matchedQueryTokens.add(token);
    }
    if (normalizedChunk.includes(token)) {
      score += 1;
      matchedQueryTokens.add(token);
    }
  }

  if (definitionQuery && /(^|\n)##\s*(Định nghĩa|Dinh nghia)/i.test(chunk)) score += 5;

  const minimumScore = exactTerms.length > 0 ? 8 : Math.max(3, Math.ceil(queryTokens.length * 0.45));
  if (queryTokens.length === 1 && exactTerms.length === 0) return 0;
  if (exactTerms.length === 0 && matchedQueryTokens.size < Math.min(2, queryTokens.length)) return 0;

  return score >= minimumScore ? score : 0;
}

function keywordSimilarity(score: number): string {
  return Math.min(0.99, 0.72 + score / 100).toFixed(4);
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function dedupeResults(results: KnowledgeSearchResult[]): KnowledgeSearchResult[] {
  const seen = new Set<string>();
  const deduped: KnowledgeSearchResult[] = [];

  for (const result of results) {
    const key = `${result.title}\n${result.chunk.slice(0, 160)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(result);
  }

  return deduped;
}

// ─── RRF helpers ──────────────────────────────────────────────────────────────

/** Stable identity key for a chunk across keyword and vector result sets. */
function chunkKey(r: KnowledgeSearchResult): string {
  return `${r.title}::${r.chunk.slice(0, 100)}`;
}

/**
 * Reciprocal Rank Fusion.
 * score(d) = Σ  1 / (K_RRF + rank_i(d))
 *
 * Chunks that rank highly in BOTH keyword and vector search float to the top.
 * Chunks absent from one source are penalised but not eliminated.
 */
function applyRRF(
  keywordResults: KnowledgeSearchResult[],
  vectorResults: KnowledgeSearchResult[],
  topK: number,
): KnowledgeSearchResult[] {
  const keywordRank = new Map<string, number>();
  keywordResults.forEach((r, i) => keywordRank.set(chunkKey(r), i + 1));

  const vectorRank = new Map<string, number>();
  vectorResults.forEach((r, i) => vectorRank.set(chunkKey(r), i + 1));

  const allChunks = dedupeResults([...keywordResults, ...vectorResults]);

  return allChunks
    .map((chunk) => {
      const key = chunkKey(chunk);
      // Missing from a list → penalise as if ranked after the last position
      const kRank = keywordRank.get(key) ?? keywordResults.length + K_RRF;
      const vRank = vectorRank.get(key) ?? vectorResults.length + K_RRF;
      const rrfScore = 1 / (K_RRF + kRank) + 1 / (K_RRF + vRank);
      return { chunk, rrfScore };
    })
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK)
    .map((item) => item.chunk);
}

// ─── Keyword search (local .md files) ────────────────────────────────────────

export function searchLocalKnowledge(
  query: string,
  topK: number = 5,
  category: string | null = null,
): KnowledgeSearchResult[] {
  const knowledgeDir = resolveKnowledgeDir();
  if (!knowledgeDir) return [];

  const matches: KnowledgeSearchResult[] = [];
  const files = fs.readdirSync(knowledgeDir).filter((file) => file.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(knowledgeDir, file);
    const doc = loadDocCached(filePath); // mtime-invalidated cache

    if (category && doc.category !== category) continue;

    for (const chunk of doc.chunks) {
      const lexicalScore = scoreKeywordMatch(query, doc.title, chunk, doc.tags);
      if (lexicalScore <= 0) continue;

      matches.push({
        title: doc.title,
        chunk,
        category: doc.category,
        similarity: keywordSimilarity(lexicalScore),
        matchType: 'keyword',
        lexicalScore,
      });
    }
  }

  return matches.sort((a, b) => (b.lexicalScore ?? 0) - (a.lexicalScore ?? 0)).slice(0, topK);
}

// ─── Vector search (pgvector) ─────────────────────────────────────────────────

async function searchVector(query: string, topK: number, category: string | null): Promise<KnowledgeSearchResult[]> {
  try {
    const embeddingModel = getEmbeddingModel();
    const queryEmbedding = await embeddingModel.embedQuery(query);
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    let sql: string;
    let params: any[];

    if (category) {
      sql = `
        SELECT id, title, chunk, category,
               1 - (embedding <=> $1::vector) AS similarity
        FROM finance_knowledge
        WHERE embedding IS NOT NULL AND category = $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `;
      params = [vectorStr, category, topK];
    } else {
      sql = `
        SELECT id, title, chunk, category,
               1 - (embedding <=> $1::vector) AS similarity
        FROM finance_knowledge
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;
      params = [vectorStr, topK];
    }

    const results: any = await getDb().$queryRawUnsafe(sql, ...params);

    return results.map((r: any) => ({
      title: r.title,
      chunk: r.chunk,
      category: r.category,
      similarity: parseFloat(r.similarity).toFixed(4),
      matchType: 'vector' as const,
    }));
  } catch (err: any) {
    console.warn('[searchKnowledge] Vector search unavailable, using keyword fallback:', err.message);
    return [];
  }
}

// ─── Hybrid search with RRF ───────────────────────────────────────────────────

/**
 * Hybrid knowledge search using Reciprocal Rank Fusion.
 *
 * Pipeline:
 * 1. Run keyword and vector searches in parallel (no early return).
 * 2. If only one source available, fall back gracefully.
 * 3. Both available → apply RRF to merge rankings.
 *
 * This replaces the old "similarity ≥ 0.9 → skip vector" early-return logic,
 * which caused the system to miss semantically relevant documents.
 */
export async function searchKnowledge(
  query: string,
  topK: number = 5,
  category: string | null = null,
): Promise<KnowledgeSearchResult[]> {
  // Fetch K candidates from each source (more input = better RRF quality)
  const candidateK = topK * 2;

  const [keywordResults, vectorResults] = await Promise.all([
    Promise.resolve(searchLocalKnowledge(query, candidateK, category)),
    searchVector(query, candidateK, category),
  ]);

  // Both empty → nothing found
  if (keywordResults.length === 0 && vectorResults.length === 0) return [];

  // One source unavailable → graceful degradation
  if (vectorResults.length === 0) return keywordResults.slice(0, topK);
  if (keywordResults.length === 0) return vectorResults.slice(0, topK);

  // Both available → RRF fusion
  return applyRRF(keywordResults, vectorResults, topK);
}
