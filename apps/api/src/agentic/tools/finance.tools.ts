import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '../../lib/prisma';

export const getUserProfileTool = tool(
  async ({ userId }) => {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        include: { investorProfile: true },
      });
      if (!user) return JSON.stringify({ error: 'Không tìm thấy người dùng.' });

      return JSON.stringify({
        fullName: user.fullName,
        monthlyIncome: user.monthlyIncome,
        extraBudget: user.extraBudget,
        investorProfile: user.investorProfile
          ? {
              riskLevel: user.investorProfile.riskLevel,
              goal: user.investorProfile.goal,
              capital: user.investorProfile.capital,
            }
          : null,
      });
    } catch (e) {
      return JSON.stringify({ error: 'Lỗi kết nối cơ sở dữ liệu.' });
    }
  },
  {
    name: 'get_user_profile',
    description:
      'Sử dụng khi cần lấy thông tin thu nhập (income), ngân sách dư (extraBudget) và hồ sơ rủi ro (risk level) của người dùng hiện tại. userId được hệ thống tự động cung cấp.',
    schema: z.object({
      userId: z.string().describe('ID của người dùng'),
    }),
  },
);

export const simulateDtiTool = tool(
  async ({ userId, additionalDebt, additionalPayment }) => {
    try {
      const user = await (prisma as any).user.findUnique({ where: { id: userId } });
      if (!user) return 'User not found';

      const debts = await (prisma as any).debt.findMany({ where: { userId, status: 'ACTIVE' } });

      let currentMinPayment = debts.reduce((sum: number, d: any) => sum + d.minPayment, 0);
      const newTotalPayment = currentMinPayment + (additionalPayment || 0);

      const dtiValue = user.monthlyIncome > 0 ? (newTotalPayment / user.monthlyIncome) * 100 : 0;
      const dti = parseFloat(dtiValue.toString()).toFixed(2);

      let alertLevel = 'SAFE';
      if (Number(dti) > 50) alertLevel = 'DANGER';
      else if (Number(dti) > 35) alertLevel = 'WARNING';

      return JSON.stringify({
        newDTI: dti + '%',
        alertLevel: alertLevel,
        currentIncome: user.monthlyIncome,
        newTotalPayment: newTotalPayment,
      });
    } catch (e) {
      return JSON.stringify({ error: 'Error simulating DTI' });
    }
  },
  {
    name: 'simulate_dti',
    description:
      'Sử dụng khi tính toán (What-If) xem nếu thêm một khoản vay thì tỷ lệ nợ trên thu nhập (DTI) cảnh báo ở mức nào. userId được hệ thống tự động cung cấp.',
    schema: z.object({
      userId: z.string(),
      additionalDebt: z.number().optional().describe('Dư nợ vay thêm (VNĐ)'),
      additionalPayment: z.number().optional().describe('Số tiền phải trả hàng tháng tăng thêm (VNĐ)'),
    }),
  },
);
