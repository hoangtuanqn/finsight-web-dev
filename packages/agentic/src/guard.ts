const OFF_TOPIC_KEYWORDS = [
  'phim hay',
  'nhạc',
  'bóng đá',
  'thể thao',
  'nấu ăn',
  'giải trí',
  'truyện cười',
  'anime',
  'manga',
  'esport',
  'chính trị',
  'bầu cử',
  'đảng',
  'tình yêu',
  'người yêu',
  'hẹn hò',
  'ai đẹp hơn',
  'viết thơ',
  'viết văn',
  'viết truyện',
  'rap',
  'hát',
  'dịch sang',
  'làm bài tập',
  'giải toán',
  'vật lý',
  'hóa học',
  'thời tiết',
  'hôm nay ngày mấy',
  'kể chuyện',
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const checkIsOffTopicGuard = (message: string): boolean => {
  const lowerMsg = message.toLowerCase();

  for (let kw of OFF_TOPIC_KEYWORDS) {
    const regex = new RegExp(`(?:^|\\s|[,."'!?])${escapeRegex(kw)}(?:\\s|[,."'!?]|$)`, 'i');
    if (regex.test(lowerMsg)) return true;
  }

  return false;
};

export const OFF_TOPIC_REPLY =
  'Xin lỗi, tôi là FinSight Advisor chuyên về quản lý nợ và tài chính cá nhân. Tôi không thể hỗ trợ các chủ đề ngoài phạm vi chuyên môn được. Bạn có thắc mắc gì về tỷ lệ nợ trên thu nhập (DTI), lãi suất, hay đầu tư không?';

export const MAX_LENGTH_REPLY =
  'Tin nhắn quá dài. Vui lòng rút gọn câu hỏi (tối đa 2000 ký tự) để tôi có thể hỗ trợ bạn tốt hơn.';
