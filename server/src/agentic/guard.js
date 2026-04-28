/**
 * Danh sách các từ khóa không liên quan đến tài chính (Off-topic).
 * Dùng để rào cản người dùng hỏi các câu hỏi tốn token AI vô ích.
 * 
 * LƯU Ý: Đã loại bỏ các từ khóa gây false positive cao:
 * - "crush" (có thể là "crush khoản nợ")
 * - "game" (có thể là "game plan trả nợ")
 * - "bạn là ai" (user có quyền hỏi chatbot)
 * - "javascript", "python" (có thể hỏi về fintech tool)
 */
const OFF_TOPIC_KEYWORDS = [
  // Giải trí
  "phim hay", "nhạc", "bóng đá", "thể thao", "nấu ăn", "giải trí",
  "truyện cười", "anime", "manga", "esport",
  // Chính trị / xã hội
  "chính trị", "bầu cử", "đảng",
  // Cá nhân / tình cảm
  "tình yêu", "người yêu", "hẹn hò", "ai đẹp hơn",
  // Sáng tạo nội dung
  "viết thơ", "viết văn", "viết truyện", "rap", "hát",
  "dịch sang",
  // Học tập không liên quan
  "làm bài tập", "giải toán", "vật lý", "hóa học",
  // Thời tiết / thông tin chung
  "thời tiết", "hôm nay ngày mấy",
  // Troll
  "kể chuyện",
];

/**
 * Escape các ký tự đặc biệt trong regex để tránh lỗi khi tạo RegExp động.
 * @param {string} str - Chuỗi cần escape.
 * @returns {string} - Chuỗi đã được escape.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Hàm kiểm tra an toàn (Guard) đầu vào của người dùng.
 * Sử dụng word-boundary matching thay vì includes() để giảm false positive.
 * VD: "crush khoản nợ" sẽ KHÔNG bị chặn bởi "crush" nếu "crush" nằm giữa câu.
 * 
 * @param {string} message - Tin nhắn người dùng.
 * @returns {boolean} - Trả về true nếu tin nhắn vi phạm, false nếu an toàn.
 */
export const checkIsOffTopicGuard = (message) => {
  const lowerMsg = message.toLowerCase();
  
  // So khớp từ khóa với word boundary để tránh match giữa từ
  // VD: "game" sẽ match "game online" nhưng KHÔNG match "gameplay tài chính"
  for (let kw of OFF_TOPIC_KEYWORDS) {
    const regex = new RegExp(`(?:^|\\s|[,."'!?])${escapeRegex(kw)}(?:\\s|[,."'!?]|$)`, 'i');
    if (regex.test(lowerMsg)) return true;
  }
  
  return false;
};

// Câu trả lời mặc định khi phát hiện người dùng hỏi lạc đề
export const OFF_TOPIC_REPLY = "Xin lỗi, tôi là FinSight Advisor chuyên về quản lý nợ và tài chính cá nhân. Tôi không thể hỗ trợ các chủ đề ngoài phạm vi chuyên môn được. Bạn có thắc mắc gì về tỷ lệ nợ trên thu nhập (DTI), lãi suất, hay đầu tư không?";

// Câu trả lời mặc định khi tin nhắn vượt quá giới hạn ký tự
export const MAX_LENGTH_REPLY = "Tin nhắn quá dài. Vui lòng rút gọn câu hỏi (tối đa 2000 ký tự) để tôi có thể hỗ trợ bạn tốt hơn.";
