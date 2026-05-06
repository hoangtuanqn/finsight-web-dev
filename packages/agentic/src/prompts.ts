export const FINSIGHT_PERSONA = ``;

export const INTENT_ROUTER_PROMPT = `Bạn là một AI Classifier có nhiệm vụ phân loại thông điệp của người dùng thành 1 trong 7 Intent. Trả về ĐÚNG MỘT TỪ trong danh sách sau:

1. DATA_ENTRY: Người dùng đang khai báo thông tin một khoản nợ mới (ví dụ: "Tôi vừa vay 10 triệu lãi 5% trong 1 năm").
2. PERSONAL_QUERY: Hỏi về tình trạng nợ hiện tại hoặc khả năng trả nợ của chính họ (ví dụ: "Tôi đang nợ bao nhiêu", "Tháng này phải trả bao nhiêu").
3. WHAT_IF: Giả lập các tình huống thay đổi (ví dụ: "Nếu tôi vay thêm 20tr thì sao", "Dùng Snowball lợi hơn không").
4. INVESTMENT_ADVICE: Hỏi về xu hướng thị trường, giá vàng, crypto, hoặc xin tư vấn phân bổ danh mục đầu tư.
5. KNOWLEDGE: Hỏi về các khái niệm tài chính (ví dụ: "DTI là gì", "APR khác EAR thế nào").
6. GENERAL_CHAT: Tin nhắn xác nhận, cảm ơn, hoặc phản hồi đơn giản không yêu cầu hành động mới (ví dụ: "Đã xác nhận", "OK cảm ơn", "Được rồi", "Tôi đã lưu thành công").
7. OFF_TOPIC: Câu hỏi hoàn toàn không liên quan đến tài chính, quản lý nợ hay đầu tư.

Câu hỏi của người dùng: "{query}"

Intent:`;

export const DISCLAIMER_TEXT = `\n\n> ⚠️ *[Từ chối trách nhiệm: Đây chỉ là thông tin tham khảo, không phải lời khuyên đầu tư. Hãy tham khảo chuyên gia tài chính trước khi ra quyết định.]*`;

export const TOOL_LABELS: Record<string, string> = {
  knowledge_search: '🔍 Đang tìm kiếm kiến thức tài chính...',
  get_user_debts: '📋 Đang tra cứu danh sách khoản nợ...',
  parse_debt_from_text: '📝 Đang phân tích thông tin khoản nợ...',
  get_user_profile: '👤 Đang lấy hồ sơ tài chính...',
  simulate_dti: '📊 Đang mô phỏng tỷ lệ DTI...',
  get_market_sentiment: '📈 Đang kiểm tra tâm lý thị trường...',
  get_market_prices: '💹 Đang cập nhật giá thị trường...',
};
