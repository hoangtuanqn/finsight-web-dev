import { tool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../lib/prisma.js";

/**
 * CÔNG CỤ: Lấy Hồ Sơ Tài Chính Người Dùng (getUserProfileTool)
 * - Mục đích: Cung cấp cho LLM thông tin cơ bản về thu nhập và khẩu vị rủi ro để AI tư vấn chuẩn xác.
 * - Khi nào dùng: Khi người dùng hỏi về đầu tư, hỏi xem có nên vay thêm không, hoặc kiểm tra thu nhập dư.
 */
export const getUserProfileTool = tool(
  async ({ userId }) => {
    try {
      // Tìm thông tin user bao gồm cả hồ sơ nhà đầu tư (investorProfile)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { investorProfile: true },
      });
      if (!user) return JSON.stringify({ error: "Không tìm thấy người dùng." });

      // Gói thông tin trả về cho LLM
      return JSON.stringify({
        fullName: user.fullName,
        monthlyIncome: user.monthlyIncome,
        extraBudget: user.extraBudget,
        investorProfile: user.investorProfile ? {
          riskLevel: user.investorProfile.riskLevel, // Mức độ chịu rủi ro (Low, Medium, High)
          goal: user.investorProfile.goal,           // Mục tiêu (Ví dụ: Mua nhà, Nghỉ hưu)
          capital: user.investorProfile.capital,     // Vốn hiện có
        } : null
      });
    } catch (e) {
      return JSON.stringify({ error: "Lỗi kết nối cơ sở dữ liệu." });
    }
  },
  {
    name: "get_user_profile",
    description: "Sử dụng khi cần lấy thông tin thu nhập (income), ngân sách dư (extraBudget) và hồ sơ rủi ro (risk level) của người dùng hiện tại.",
    schema: z.object({
      userId: z.string().describe("ID của người dùng"),
    }),
  }
);

/**
 * CÔNG CỤ: Giả Lập Tỷ Lệ DTI (simulateDtiTool)
 * - Mục đích: Tính toán tỷ lệ "Nợ trên Thu nhập" (Debt-to-Income) khi người dùng muốn vay thêm.
 * - Khi nào dùng: Thuộc nhóm Intent "WHAT_IF" (Giả sử tôi vay thêm 50 triệu mỗi tháng trả 2 triệu thì DTI ra sao?)
 */
export const simulateDtiTool = tool(
  async ({ userId, additionalDebt, additionalPayment }) => {
    // Agent sẽ truyền vào số tiền vay thêm (additionalDebt) và số tiền trả góp hàng tháng dự kiến (additionalPayment)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }});
      if (!user) return "User not found";
      
      const debts = await prisma.debt.findMany({ where: { userId, status: "ACTIVE" }});
      
      // Tính tổng nợ phải trả hàng tháng HIỆN TẠI
      let currentMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
      
      // Cộng dồn với nợ MỚI dự kiến
      const newTotalPayment = currentMinPayment + (additionalPayment || 0);
      
      // Tính DTI (%)
      const dtiStr = user.monthlyIncome > 0 ? (newTotalPayment / user.monthlyIncome) * 100 : 0;
      const dti = parseFloat(dtiStr).toFixed(2);
      
      // Gán nhãn cảnh báo rủi ro dựa trên chuẩn tài chính
      let alertLevel = "SAFE";
      if (dti > 50) alertLevel = "DANGER"; // Nguy hiểm: Nợ chiếm hơn 50% thu nhập
      else if (dti > 35) alertLevel = "WARNING"; // Cảnh báo: Nguy cơ áp lực dòng tiền

      return JSON.stringify({
        newDTI: dti + "%",
        alertLevel: alertLevel,
        currentIncome: user.monthlyIncome,
        newTotalPayment: newTotalPayment
      });
    } catch(e) {
      return JSON.stringify({ error: "Error simulating DTI" });
    }
  },
  {
    name: "simulate_dti",
    description: "Sử dụng khi tính toán (What-If) xem nếu thêm một khoản vay thì tỷ lệ nợ trên thu nhập (DTI) cảnh báo ở mức nào.",
    schema: z.object({
      userId: z.string(),
      additionalDebt: z.number().optional().describe("Dư nợ vay thêm (VNĐ)"),
      additionalPayment: z.number().optional().describe("Số tiền phải trả hàng tháng tăng thêm (VNĐ)"),
    })
  }
);
