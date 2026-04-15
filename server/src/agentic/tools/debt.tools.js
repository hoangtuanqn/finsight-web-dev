import { tool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../lib/prisma.js";

export const getUserDebtsTool = tool(
  async ({ userId }) => {
    try {
      const debts = await prisma.debt.findMany({
        where: { userId, status: "ACTIVE" },
      });
      if (debts.length === 0) return JSON.stringify({ message: "Người dùng không có khoản nợ nào đang active." });

      const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
      const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
      return JSON.stringify({
        totalDebts: debts.length,
        totalBalance,
        totalMinPayment,
        debts: debts.map(d => ({
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minPayment: d.minPayment,
          dueDay: d.dueDay,
        }))
      });
    } catch (e) {
      return JSON.stringify({ error: "Lỗi kết nối cơ sở dữ liệu." });
    }
  },
  {
    name: "get_user_debts",
    description: "Sử dụng khi cần kiểm tra tình trạng các khoản nợ của người dùng hiện tại (số lượng nợ, tổng dư nợ, tổng số tiền phải thanh toán tối thiểu). Bắt buộc phải có userId.",
    schema: z.object({
      userId: z.string().describe("ID của người dùng"),
    }),
  }
);

export const parseDebtFromTextTool = tool(
  async ({ name, originalAmount, apr, termMonths, text }) => {
    // LLM extracts structured fields via the schema.
    // Return them as parsedData so the frontend can populate a confirmation modal.
    // The actual DB save only happens when the user clicks "Confirm" on the modal.
    return JSON.stringify({
      action: "FORM_POPULATION_REQUIRED",
      parsedData: { name, originalAmount, apr, termMonths, notes: text },
    });
  },
  {
    name: "parse_debt_from_text",
    description: "Sử dụng khi người dùng cung cấp thông tin khoản nợ mới (số tiền, lãi suất, ngân hàng...). Gọi tool này để extract JSON.",
    schema: z.object({
      name: z.string().describe("Tên tổ chức tín dụng hoặc ngân hàng (vd: FE Credit, Vietcombank)"),
      originalAmount: z.number().describe("Số tiền gốc vay (VNĐ)"),
      apr: z.number().describe("Lãi suất danh nghĩa hàng năm (APR) tính theo %"),
      termMonths: z.number().describe("Kỳ hạn vay (số tháng)"),
      text: z.string().describe("Ngữ cảnh thêm từ người dùng nếu có đoạn cần ghi chú"),
    }),
  }
);
