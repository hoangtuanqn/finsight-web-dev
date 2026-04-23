/**
 * Danh sách các từ khóa không liên quan đến tài chính (Off-topic).
 * Dùng để rào cản người dùng hỏi các câu hỏi tốn token AI vô ích.
 */
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

/**
 * Hàm kiểm tra an toàn (Guard) đầu vào của người dùng.
 * @param {string} message - Tin nhắn người dùng.
 * @returns {boolean} - Trả về true nếu tin nhắn vi phạm, false nếu an toàn.
 */
export const checkIsOffTopicGuard = (message) => {
  // Lớp bảo vệ 0: Chặn tin nhắn quá dài (chống tràn bộ nhớ / spam API)
  if (message.length > MAX_MESSAGE_LENGTH) return true;

  const lowerMsg = message.toLowerCase();
  
  // Lớp bảo vệ 1: So khớp từ khóa (Quét siêu tốc ~1ms)
  for (let kw of OFF_TOPIC_KEYWORDS) {
    if (lowerMsg.includes(kw)) return true;
  }
  
  return false;
};

// Câu trả lời mặc định khi phát hiện người dùng hỏi lạc đề
export const OFF_TOPIC_REPLY = "Xin lỗi, tôi là FinSight Advisor chuyên về quản lý nợ và tài chính cá nhân. Tôi không thể hỗ trợ các chủ đề ngoài phạm vi chuyên môn được. Bạn có thắc mắc gì về tỷ lệ nợ trên thu nhập (DTI), lãi suất, hay đầu tư không?";

// Câu trả lời mặc định khi tin nhắn vượt quá giới hạn ký tự
export const MAX_LENGTH_REPLY = "Tin nhắn quá dài. Vui lòng rút gọn câu hỏi (tối đa 2000 ký tự) để tôi có thể hỗ trợ bạn tốt hơn.";
