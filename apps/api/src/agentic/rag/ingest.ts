import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import prisma from '../../lib/prisma';
import { getEmbeddingModel } from '../llm-provider';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'data/knowledge');

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {} as any, body: content };

  const rawMeta = match[1];
  const body = match[2].trim();
  const metadata: any = {};

  for (const line of rawMeta.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);

    if (value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch {}
    }
    metadata[key] = value;
  }

  return { metadata, body };
}

function chunkByHeadings(body: string, docTitle: string) {
  const sections = body.split(/(?=^## )/m).filter((s) => s.trim());
  const chunks = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 20) continue;

    chunks.push({
      text: `# ${docTitle}\n\n${trimmed}`,
      hash: crypto.createHash('sha256').update(trimmed).digest('hex'),
    });
  }

  if (chunks.length === 0 && body.trim().length > 20) {
    chunks.push({
      text: body.trim(),
      hash: crypto.createHash('sha256').update(body.trim()).digest('hex'),
    });
  }

  return chunks;
}

async function ingest() {
  console.log('📂 Đang quét thư mục kiến thức:', KNOWLEDGE_DIR);

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error('❌ Không tìm thấy thư mục kiến thức:', KNOWLEDGE_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  console.log(`📄 Tìm thấy ${files.length} tài liệu`);

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
    console.log(`\n📝 ${file}: "${title}" → ${chunks.length} đoạn nhỏ`);

    for (const chunk of chunks) {
      totalChunks++;

      const existing: any = await (prisma as any).$queryRawUnsafe(
        `SELECT id FROM finance_knowledge WHERE metadata->>'contentHash' = $1 LIMIT 1`,
        chunk.hash,
      );

      if (existing.length > 0) {
        skippedChunks++;
        process.stdout.write('⏭️ ');
        continue;
      }

      const [embedding] = await embeddingModel.embedDocuments([chunk.text]);

      const vectorStr = `[${embedding.join(',')}]`;
      await (prisma as any).$queryRawUnsafe(
        `INSERT INTO finance_knowledge (id, title, content, chunk, category, embedding, metadata, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::vector, $6::jsonb, NOW())`,
        title,
        body,
        chunk.text,
        category,
        vectorStr,
        JSON.stringify({ contentHash: chunk.hash, source: file, tags: metadata.tags || [] }),
      );

      newChunks++;
      process.stdout.write('✅ ');
    }
  }

  console.log(`\n\n🎯 Hoàn tất quá trình nạp dữ liệu!`);
  console.log(`   Tổng số đoạn: ${totalChunks}`);
  console.log(`   Mới (đã nhúng vector): ${newChunks}`);
  console.log(`   Bỏ qua (không đổi): ${skippedChunks}`);

  await prisma.$disconnect();
  process.exit(0);
}

ingest().catch((err) => {
  console.error('❌ Lỗi nạp dữ liệu:', err);
  process.exit(1);
});
