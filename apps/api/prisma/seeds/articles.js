export const ARTICLES_DATA = [
  {
    title: '7 Bước Thoát Khỏi Nợ Nần Năm 2026',
    author: 'FinSight Team',
    date: '2026-04-20',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    excerpt: 'Hướng dẫn chi tiết cách quản lý dòng tiền và ưu tiên trả nợ thông minh.',
    content: 'Nội dung chi tiết về các bước thoát nợ...',
    category: 'GUIDE',
  },
  {
    title: 'Câu Chuyện Thành Công: Từ Nợ 500 Triệu Đến Tự Do Tài Chính',
    author: 'Nguyễn Văn B',
    date: '2026-04-15',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
    excerpt: 'Hành trình 3 năm kiên trì áp dụng phương pháp Snowball.',
    content: 'Nội dung câu chuyện truyền cảm hứng...',
    category: 'STORY',
  },
  {
    title: 'Lãi Suất Ngân Hàng Tháng 5/2026: Những Diễn Biến Mới',
    author: 'Lê Minh Tâm',
    date: '2026-05-01',
    imageUrl: 'https://images.unsplash.com/photo-1611974717484-7bc7497bc391?w=800',
    excerpt: 'Cập nhật tình hình lãi suất huy động và lãi suất cho vay từ các ngân hàng lớn.',
    content: 'Phân tích thị trường tài chính tháng 5...',
    category: 'NEWS',
  },
  {
    title: 'Chiến Lược Đầu Tư Vàng Trong Thời Kỳ Lạm Phát',
    author: 'Phạm Gia Bình',
    date: '2026-05-05',
    imageUrl: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=800',
    excerpt: 'Tại sao vàng vẫn là kênh trú ẩn an toàn và cách phân bổ tỷ trọng hợp lý.',
    content: 'Đầu tư vàng không chỉ là mua và giữ...',
    category: 'GUIDE',
  },
  {
    title: 'Cách Tối Ưu Điểm Tín Dụng CIC Chỉ Trong 6 Tháng',
    author: 'Trần Đức Phúc',
    date: '2026-04-28',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
    excerpt: 'Bí quyết trả nợ và sử dụng thẻ tín dụng để nâng hạng tín nhiệm cá nhân.',
    content: 'Điểm tín dụng CIC quyết định khả năng vay vốn của bạn...',
    category: 'GUIDE',
  },
];

export async function seedArticles(prisma) {
  console.log('🌱 Seeding articles...');
  await prisma.article.deleteMany();
  await prisma.article.createMany({ data: ARTICLES_DATA });
}
