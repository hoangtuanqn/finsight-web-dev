import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const parseInvestmentInformationTool = tool(
  async ({ monthlyIncome, capital, riskLevel }) => {
    return JSON.stringify({
      monthlyIncome: monthlyIncome ?? null,
      capital: capital ?? null,
      riskLevel: riskLevel ?? null,
    });
  },
  {
    name: 'parse_investment_information',
    description:
      'Trích xuất thông tin hồ sơ đầu tư từ văn bản người dùng. Tất cả các trường đều nullable — hãy trích xuất chính xác những gì người dùng cung cấp, không tự điền giá trị mặc định. Gọi tool này ngay khi người dùng đề cập đến kế hoạch đầu tư, vốn, thu nhập, hoặc khẩu vị rủi ro.',
    schema: z.object({
      monthlyIncome: z.number().nullable().optional().describe('Thu nhập hàng tháng (VNĐ)'),
      capital: z.number().nullable().optional().describe('Số vốn đầu tư ban đầu (VNĐ)'),
      riskLevel: z
        .enum(['LOW', 'MEDIUM', 'HIGH'])
        .nullable()
        .optional()
        .describe('Khẩu vị rủi ro: LOW (Thấp), MEDIUM (Trung bình), HIGH (Cao); null nếu không rõ'),
    }),
  },
);
