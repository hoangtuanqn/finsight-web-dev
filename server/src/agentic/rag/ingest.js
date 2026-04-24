import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import prisma from '../../lib/prisma.js';
import { getEmbeddingModel } from '../llm-provider.js';

// Cấu hình dotenv để đọc file .env từ thư mục gốc của project
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Đường dẫn tới thư mục chứa các file markdown kiến thức tài chính
const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'data/knowledge');

/**
 * Phân tích phần frontmatter (siêu dữ liệu ở đầu file) từ nội dung markdown
 * @param {string} content - Nội dung thô của file markdown
 * @returns {object} Đối tượng chứa metadata và phần thân (body) của tài liệu
 */
function parseFrontmatter(content) {
  // Regex để tìm phần nằm giữa cặp dấu ---
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const rawMeta = match[1];
  const body = match[2].trim();
  const metadata = {};

  // Tách từng dòng trong frontmatter để lấy key-value
  for (const line of rawMeta.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    
    // Loại bỏ dấu ngoặc kép nếu có
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    
    // Xử lý nếu giá trị là một mảng (dạng [item1, item2])
    if (value.startsWith('[')) {
      try { value = JSON.parse(value); } catch { /* giữ nguyên là string nếu parse lỗi */ }
    }
    metadata[key] = value;
  }

  return { metadata, body };
}

/**
 * Chia nhỏ nội dung markdown theo các tiêu đề cấp 2 (## Heading)
 * Mỗi đoạn (chunk) sẽ bao gồm tiêu đề chính của tài liệu và nội dung của phần đó.
 * @param {string} body - Phần thân của tài liệu markdown
 * @param {string} docTitle - Tiêu đề của tài liệu
 */
function chunkByHeadings(body, docTitle) {
  // Tách nội dung dựa trên regex tìm tiêu đề cấp 2 (##)
  const sections = body.split(/(?=^## )/m).filter(s => s.trim());
  const chunks = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 20) continue; // Bỏ qua các phần quá ngắn

    chunks.push({
      text: `# ${docTitle}\n\n${trimmed}`,
      // Tạo hash dựa trên nội dung để kiểm tra trùng lặp/thay đổi sau này
      hash: crypto.createHash('sha256').update(trimmed).digest('hex'),
    });
  }

  // Nếu không tìm thấy tiêu đề ## nào, coi toàn bộ nội dung là một đoạn duy nhất
  if (chunks.length === 0 && body.trim().length > 20) {
    chunks.push({
      text: body.trim(),
      hash: crypto.createHash('sha256').update(body.trim()).digest('hex'),
    });
  }

  return chunks;
}

/**
 * Hàm chính thực hiện quét thư mục kiến thức và nạp dữ liệu vào database
 */
async function ingest() {
  console.log('📂 Đang quét thư mục kiến thức:', KNOWLEDGE_DIR);

  // Kiểm tra thư mục kiến thức có tồn tại không
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error('❌ Không tìm thấy thư mục kiến thức:', KNOWLEDGE_DIR);
    process.exit(1);
  }

  // Lấy danh sách các file .md trong thư mục
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
  console.log(`📄 Tìm thấy ${files.length} tài liệu`);

  const embeddingModel = getEmbeddingModel();
  let totalChunks = 0;
  let newChunks = 0;
  let skippedChunks = 0;

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(raw);

    // Lấy tiêu đề và danh mục từ metadata hoặc mặc định
    const title = metadata.title || file.replace('.md', '');
    const category = metadata.category || 'CONCEPT';

    const chunks = chunkByHeadings(body, title);
    console.log(`\n📝 ${file}: "${title}" → ${chunks.length} đoạn nhỏ`);

    for (const chunk of chunks) {
      totalChunks++;

      // Kiểm tra xem đoạn này đã tồn tại trong DB chưa bằng cách so sánh hash nội dung
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id FROM finance_knowledge WHERE metadata->>'contentHash' = $1 LIMIT 1`,
        chunk.hash
      );

      if (existing.length > 0) {
        skippedChunks++;
        process.stdout.write('⏭️ '); // Bỏ qua nếu đã tồn tại
        continue;
      }

      // Tạo vector embedding cho đoạn văn bản
      const [embedding] = await embeddingModel.embedDocuments([chunk.text]);

      // Chèn dữ liệu vào bảng finance_knowledge sử dụng pgvector (Raw SQL)
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
      process.stdout.write('✅ '); // Đã nạp thành công
    }
  }

  console.log(`\n\n🎯 Hoàn tất quá trình nạp dữ liệu!`);
  console.log(`   Tổng số đoạn: ${totalChunks}`);
  console.log(`   Mới (đã nhúng vector): ${newChunks}`);
  console.log(`   Bỏ qua (không đổi): ${skippedChunks}`);

  await prisma.$disconnect();
  process.exit(0);
}

// Chạy quy trình ingest và bắt lỗi nếu có
ingest().catch(err => {
  console.error('❌ Lỗi nạp dữ liệu:', err);
  process.exit(1);
});
