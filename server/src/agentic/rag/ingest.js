import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import prisma from '../../lib/prisma.js';
import { getEmbeddingModel } from '../llm-provider.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'data/knowledge');

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const rawMeta = match[1];
  const body = match[2].trim();
  const metadata = {};

  for (const line of rawMeta.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip quotes
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    // Parse array
    if (value.startsWith('[')) {
      try { value = JSON.parse(value); } catch { /* keep as string */ }
    }
    metadata[key] = value;
  }

  return { metadata, body };
}

/**
 * Chunk markdown content by ## headings.
 * Each chunk includes the main title + one section.
 */
function chunkByHeadings(body, docTitle) {
  const sections = body.split(/(?=^## )/m).filter(s => s.trim());
  const chunks = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 20) continue; // Skip very short sections

    chunks.push({
      text: `# ${docTitle}\n\n${trimmed}`,
      hash: crypto.createHash('sha256').update(trimmed).digest('hex'),
    });
  }

  // If no ## headings found, treat entire body as one chunk
  if (chunks.length === 0 && body.trim().length > 20) {
    chunks.push({
      text: body.trim(),
      hash: crypto.createHash('sha256').update(body.trim()).digest('hex'),
    });
  }

  return chunks;
}

async function ingest() {
  console.log('📂 Scanning knowledge directory:', KNOWLEDGE_DIR);

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error('❌ Knowledge directory not found:', KNOWLEDGE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
  console.log(`📄 Found ${files.length} documents`);

  const embeddingModel = getEmbeddingModel();
  let totalChunks = 0;
  let newChunks = 0;
  let skippedChunks = 0;

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(raw);

    const title = metadata.title || file.replace('.md', '');
    const category = metadata.category || 'CONCEPT';

    const chunks = chunkByHeadings(body, title);
    console.log(`\n📝 ${file}: "${title}" → ${chunks.length} chunks`);

    for (const chunk of chunks) {
      totalChunks++;

      // Check if chunk already exists (by hash)
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id FROM finance_knowledge WHERE metadata->>'contentHash' = $1 LIMIT 1`,
        chunk.hash
      );

      if (existing.length > 0) {
        skippedChunks++;
        process.stdout.write('⏭️ ');
        continue;
      }

      // Embed the chunk
      const [embedding] = await embeddingModel.embedDocuments([chunk.text]);

      // Insert into pgvector via raw SQL
      const vectorStr = `[${embedding.join(',')}]`;
      await prisma.$queryRawUnsafe(
        `INSERT INTO finance_knowledge (id, title, content, chunk, category, embedding, metadata, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector, $6::jsonb, NOW())`,
        title,
        body,
        chunk.text,
        category,
        vectorStr,
        JSON.stringify({ contentHash: chunk.hash, source: file, tags: metadata.tags || [] })
      );

      newChunks++;
      process.stdout.write('✅ ');
    }
  }

  console.log(`\n\n🎯 Ingestion complete!`);
  console.log(`   Total chunks: ${totalChunks}`);
  console.log(`   New (embedded): ${newChunks}`);
  console.log(`   Skipped (unchanged): ${skippedChunks}`);

  await prisma.$disconnect();
  process.exit(0);
}

ingest().catch(err => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});
