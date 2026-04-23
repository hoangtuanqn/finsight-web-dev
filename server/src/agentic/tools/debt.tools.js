import { tool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../lib/prisma.js";

/**
 * CÔNG CỤ: Lấy Danh Sách Khoản Nợ Của Người Dùng (getUserDebtsTool)
 * - Mục đích: Khi người dùng hỏi "Tôi đang nợ bao nhiêu?", LLM sẽ gọi công cụ này.
 * - Đầu vào: LLM tự động trích xuất `userId` từ ngữ cảnh (context) và truyền vào.
 * - Đầu ra: LLM sẽ nhận được chuỗi JSON mô tả tổng nợ, tổng số tiền cần trả mỗi tháng (minPayment).
 */
export const getUserDebtsTool = tool(
  async ({ userId }) => {
    try {
      // Truy vấn Database để tìm tất cả các khoản nợ đang hiển thị (ACTIVE)
      const debts = await prisma.debt.findMany({
        where: { userId, status: "ACTIVE" },
      });
      if (debts.length === 0) return JSON.stringify({ message: "Người dùng không có khoản nợ nào đang active." });

      // Tính tổng số tiền đang nợ và tổng số tiền phải trả tối thiểu hàng tháng
      const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
      const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
      
      // Trả dữ liệu về cho LLM (Agent) dưới dạng JSON string để nó đọc và trả lời người dùng
      return JSON.stringify({
        totalDebts: debts.length,
        totalBalance,
        totalMinPayment,
        debts: debts.map(d => ({
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minPayment: d.minPayment,
          dueDay: d.dueDay, // Ngày tới hạn
        }))
      });
    } catch (e) {
      return JSON.stringify({ error: "Lỗi kết nối cơ sở dữ liệu." });
    }
  },
  {
    // Cấu hình (Metadata) cho Tool. Quan trọng nhất là `description` và `schema`.
    // LLM sẽ dựa vào phần description này để QUYẾT ĐỊNH XEM CÓ NÊN GỌI TOOL HAY KHÔNG.
    name: "get_user_debts",
    description: "Sử dụng khi cần kiểm tra tình trạng các khoản nợ của người dùng hiện tại (số lượng nợ, tổng dư nợ, tổng số tiền phải thanh toán tối thiểu). Bắt buộc phải có userId.",
    schema: z.object({
      userId: z.string().describe("ID của người dùng"),
    }),
  }
);

/**
 * CÔNG CỤ: Trích Xuất Dữ Liệu Nợ Từ Văn Bản (parseDebtFromTextTool)
 * - Mục đích: Khi người dùng khai báo nợ mới (hoặc gửi ảnh OCR lên).
 * - Hoạt động: Thay vì lưu trực tiếp vào Database (rất nguy hiểm nếu LLM hiểu sai),
 *   công cụ này chỉ bóc tách (parse) dữ liệu thành cấu trúc chuẩn, 
 *   sau đó trả về một action là "FORM_POPULATION_REQUIRED".
 *   Client (UI) sẽ bắt action này và hiển thị Popup xác nhận (DebtConfirmModal) cho người dùng duyệt.
 */
export const parseDebtFromTextTool = tool(
  async ({ name, originalAmount, apr, termMonths, text }) => {
    // Trả về trực tiếp JSON cho Client (thông qua agent.js stream capture)
    // Lưu ý: Việc lưu Database THỰC SỰ sẽ được gọi bằng một API khác sau khi User bấm Confirm trên giao diện.
    return JSON.stringify({
      action: "FORM_POPULATION_REQUIRED",
      parsedData: { name, originalAmount, apr, termMonths, notes: text },
    });
  },
  {
    name: "parse_debt_from_text",
    description: "Sử dụng khi người dùng cung cấp thông tin khoản nợ mới (số tiền, lãi suất, ngân hàng...). Gọi tool này để extract JSON.",
    // Bắt LLM phải tự bóc tách văn bản thô ra thành các con số chuẩn xác
    schema: z.object({
      name: z.string().describe("Tên tổ chức tín dụng hoặc ngân hàng (vd: FE Credit, Vietcombank)"),
      originalAmount: z.number().describe("Số tiền gốc vay (VNĐ)"),
      apr: z.number().describe("Lãi suất danh nghĩa hàng năm (APR) tính theo %"),
      termMonths: z.number().describe("Kỳ hạn vay (số tháng)"),
      text: z.string().describe("Ngữ cảnh thêm từ người dùng nếu có đoạn cần ghi chú"),
    }),
  }
);
