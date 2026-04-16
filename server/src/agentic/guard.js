const OFF_TOPIC_KEYWORDS = [
  // Giải trí
  "phim hay", "nhạc", "bóng đá", "thể thao", "nấu ăn", "giải trí",
  "truyện cười", "anime", "manga", "game", "esport",
  // Chính trị / xã hội
  "chính trị", "bầu cử", "đảng",
  // Cá nhân / tình cảm
  "tình yêu", "người yêu", "crush", "hẹn hò", "ai đẹp hơn",
  // Lập trình / kỹ thuật (không liên quan tài chính)
  "mã code", "lập trình", "debug", "python", "javascript",
  // Sáng tạo nội dung
  "viết thơ", "viết văn", "viết truyện", "rap", "hát",
  "dịch giúp", "dịch sang",
  // Học tập không liên quan
  "làm bài tập", "giải toán", "vật lý", "hóa học",
  // Thời tiết / thông tin chung
  "thời tiết", "mấy giờ", "hôm nay ngày mấy",
  // Troll
  "kể chuyện", "bạn là ai", "bạn có thật không",
];

const MAX_MESSAGE_LENGTH = 2000;

export const checkIsOffTopicGuard = (message) => {
  // Layer 0: Max length check
  if (message.length > MAX_MESSAGE_LENGTH) return true;

  const lowerMsg = message.toLowerCase();
  
  // Layer 1: Keyword matching (Fast rejection ~1ms)
  for (let kw of OFF_TOPIC_KEYWORDS) {
    if (lowerMsg.includes(kw)) return true;
  }
  
  return false;
};

export const OFF_TOPIC_REPLY = "Xin lỗi, tôi là FinSight Advisor chuyên về quản lý nợ và tài chính cá nhân. Tôi không thể hỗ trợ các chủ đề ngoài phạm vi chuyên môn được. Bạn có thắc mắc gì về tỷ lệ nợ trên thu nhập (DTI), lãi suất, hay đầu tư không?";

export const MAX_LENGTH_REPLY = "Tin nhắn quá dài. Vui lòng rút gọn câu hỏi (tối đa 2000 ký tự) để tôi có thể hỗ trợ bạn tốt hơn.";
