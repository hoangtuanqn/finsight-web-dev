import { AgentIntent } from '../graph-state.js';

export interface RouterFixture {
  input: string;
  expectedIntent: AgentIntent;
  note: string;
}

/**
 * Fixtures for Task 2.3: Router node and intent taxonomy
 * Ensure at least 2 test cases (sentences) per main intent.
 */
export const ROUTER_FIXTURES: RouterFixture[] = [
  // 1. DEBT_EXTRACTION
  {
    input: 'Tôi vừa vay FE Credit 10 triệu, lãi suất 22%/năm, kỳ hạn 12 tháng.',
    expectedIntent: AgentIntent.DEBT_EXTRACTION,
    note: 'Khai báo nợ mới, đầy đủ thông tin.',
  },
  {
    input: 'Thêm khoản nợ ngân hàng Vietcombank 50 triệu.',
    expectedIntent: AgentIntent.DEBT_EXTRACTION,
    note: 'Khai báo nợ mới, thiếu thông tin.',
  },

  // 2. REPAYMENT_SETUP
  {
    input: 'Tôi muốn trả thêm 2 triệu mỗi tháng để nhanh hết nợ.',
    expectedIntent: AgentIntent.REPAYMENT_SETUP,
    note: 'Thiết lập kế hoạch trả nợ thêm.',
  },
  {
    input: 'Làm sao để tất toán sớm khoản vay Home Credit trước năm 2026?',
    expectedIntent: AgentIntent.REPAYMENT_SETUP,
    note: 'Mục tiêu trả nợ sớm.',
  },

  // 3. INVESTMENT_ADVICE
  {
    input: 'Tôi muốn được tư vấn phân bổ danh mục đầu tư, thu nhập 20 triệu.',
    expectedIntent: AgentIntent.INVESTMENT_ADVICE,
    note: 'Xin tư vấn danh mục đầu tư.',
  },
  {
    input: 'Với 50 triệu nhàn rỗi thì nên đầu tư vào đâu an toàn?',
    expectedIntent: AgentIntent.INVESTMENT_ADVICE,
    note: 'Câu hỏi phân bổ vốn.',
  },

  // 4. DEBT_SUMMARY
  {
    input: 'Tình trạng nợ của tôi hiện nay thế nào?',
    expectedIntent: AgentIntent.DEBT_SUMMARY,
    note: 'Hỏi tổng quan tình hình nợ.',
  },
  {
    input: 'Tính giúp tôi chỉ số sức khỏe tài chính và tổng dư nợ.',
    expectedIntent: AgentIntent.DEBT_SUMMARY,
    note: 'Hỏi về DTI và tổng nợ.',
  },

  // 5. DEBT_LIST_QUERY
  {
    input: 'Liệt kê chi tiết từng khoản nợ của tôi.',
    expectedIntent: AgentIntent.DEBT_LIST_QUERY,
    note: 'Hỏi danh sách nợ cụ thể.',
  },
  {
    input: 'Tôi đang có bao nhiêu khoản vay tất cả?',
    expectedIntent: AgentIntent.DEBT_LIST_QUERY,
    note: 'Hỏi số lượng và chi tiết các khoản vay.',
  },

  // 6. SIMULATION
  {
    input: 'Nếu tôi vay thêm 100 triệu lãi 10%, DTI của tôi sẽ là bao nhiêu?',
    expectedIntent: AgentIntent.SIMULATION,
    note: 'Giả lập tình huống vay thêm.',
  },
  {
    input: 'Giả sử tháng sau tôi bị giảm 30% thu nhập thì có bị quá hạn không?',
    expectedIntent: AgentIntent.SIMULATION,
    note: 'Giả lập cú sốc thu nhập.',
  },

  // 7. MARKET_OVERVIEW
  {
    input: 'Tình hình thị trường hiện tại như thế nào?',
    expectedIntent: AgentIntent.MARKET_OVERVIEW,
    note: 'Hỏi tổng quan thị trường.',
  },
  {
    input: 'Chỉ số sợ hãi và tham lam hôm nay ra sao?',
    expectedIntent: AgentIntent.MARKET_OVERVIEW,
    note: 'Hỏi sentiment thị trường chung.',
  },

  // 8. MARKET_SPECIFIC
  {
    input: 'Giá vàng hôm nay là bao nhiêu?',
    expectedIntent: AgentIntent.MARKET_SPECIFIC,
    note: 'Hỏi giá vàng.',
  },
  {
    input: 'Giá Bitcoin (BTC) hiện tại đang ở mức nào?',
    expectedIntent: AgentIntent.MARKET_SPECIFIC,
    note: 'Hỏi giá Crypto cụ thể.',
  },

  // 9. KNOWLEDGE
  {
    input: 'DTI là gì và tôi nên duy trì ở mức nào?',
    expectedIntent: AgentIntent.KNOWLEDGE,
    note: 'Hỏi định nghĩa DTI.',
  },
  {
    input: 'Phương pháp trả nợ Snowball khác gì Avalanche?',
    expectedIntent: AgentIntent.KNOWLEDGE,
    note: 'Hỏi kiến thức quản lý nợ.',
  },

  // 10. GENERAL_CHAT
  {
    input: 'Tôi đã xác nhận và lưu thành công.',
    expectedIntent: AgentIntent.GENERAL_CHAT,
    note: 'Câu xác nhận.',
  },
  {
    input: 'Cảm ơn bạn, thông tin rất hữu ích.',
    expectedIntent: AgentIntent.GENERAL_CHAT,
    note: 'Câu cảm ơn.',
  },

  // 11. Out-of-scope / soft fallback → GENERAL_CHAT
  {
    input: 'Bạn có thể giới thiệu phim hay cho tôi không?',
    expectedIntent: AgentIntent.GENERAL_CHAT,
    note: 'Câu ngoài luồng nghiệp vụ được chuyển cho General worker phản hồi mềm.',
  },
  {
    input: 'Đội nào vô địch C1 năm 2023?',
    expectedIntent: AgentIntent.GENERAL_CHAT,
    note: 'Câu ngoài luồng nghiệp vụ được chuyển cho General worker phản hồi mềm.',
  },
];
