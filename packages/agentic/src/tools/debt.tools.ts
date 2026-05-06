import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getDb } from '../config';

// ─── Task 2.5: parse_debt_information (fully-nullable, new worker) ────────────

/**
 * All fields nullable so the debt-extraction worker can always emit a
 * SHOW_POPUP/DEBT_CONFIRMATION signal, even when the user's prompt is
 * missing required fields.  The modal then forces the user to fill them.
 *
 * IMPORTANT: This tool never calls debt.create.
 */
export const parseDebtInformationTool = tool(
  async ({
    loanName,
    principalAmount,
    interestRateAPR,
    borrowDate,
    termMonths,
    rateType,
    balance,
    minPayment,
    dueDay,
    feeProcessing,
    feeInsurance,
    feeManagement,
    notes,
  }) => {
    return JSON.stringify({
      loanName: loanName ?? null,
      principalAmount: principalAmount ?? null,
      interestRateAPR: interestRateAPR ?? null,
      borrowDate: borrowDate ?? null,
      termMonths: termMonths ?? null,
      rateType: rateType ?? null,
      balance: balance ?? null,
      minPayment: minPayment ?? null,
      dueDay: dueDay ?? null,
      feeProcessing: feeProcessing ?? 0,
      feeInsurance: feeInsurance ?? 0,
      feeManagement: feeManagement ?? 0,
      notes: notes ?? null,
    });
  },
  {
    name: 'parse_debt_information',
    description:
      'Trích xuất thông tin khoản nợ từ văn bản người dùng. Tất cả các trường đều nullable — hãy trích xuất chính xác những gì người dùng cung cấp, không tự điền giá trị mặc định. Gọi tool này ngay khi người dùng đề cập đến khoản vay mới.',
    schema: z.object({
      loanName: z
        .string()
        .nullable()
        .optional()
        .describe('Tên tổ chức tín dụng / ngân hàng (vd: FE Credit, Vietcombank)'),
      principalAmount: z.number().nullable().optional().describe('Số tiền gốc vay (VNĐ)'),
      interestRateAPR: z.number().nullable().optional().describe('Lãi suất danh nghĩa hàng năm APR (%)'),
      borrowDate: z.string().nullable().optional().describe('Ngày bắt đầu vay (YYYY-MM-DD); null nếu không rõ'),
      termMonths: z.number().nullable().optional().describe('Kỳ hạn vay (số tháng); null nếu không rõ'),
      rateType: z
        .enum(['FLAT', 'REDUCING'])
        .nullable()
        .optional()
        .describe('Loại lãi suất: FLAT hoặc REDUCING; null nếu không rõ'),
      balance: z.number().nullable().optional().describe('Dư nợ hiện tại (VNĐ); null nếu không rõ'),
      minPayment: z.number().nullable().optional().describe('Trả tối thiểu hàng tháng (VNĐ); null nếu không rõ'),
      dueDay: z.number().nullable().optional().describe('Ngày đáo hạn hàng tháng (1-31); null nếu không rõ'),
      feeProcessing: z.number().nullable().optional().describe('Phí xử lý hồ sơ hàng năm (%)'),
      feeInsurance: z.number().nullable().optional().describe('Phí bảo hiểm hàng năm (%)'),
      feeManagement: z.number().nullable().optional().describe('Phí quản lý hàng năm (%)'),
      notes: z.string().nullable().optional().describe('Ghi chú thêm từ người dùng'),
    }),
  },
);

export const getUserDebtsTool = tool(
  async ({ userId }) => {
    try {
      const debts = await getDb().debt.findMany({
        where: { userId, status: 'ACTIVE' },
      });
      if (debts.length === 0) return JSON.stringify({ message: 'Người dùng không có khoản nợ nào đang active.' });

      const totalBalance = debts.reduce((sum: number, d: any) => sum + d.balance, 0);
      const totalMinPayment = debts.reduce((sum: number, d: any) => sum + d.minPayment, 0);

      return JSON.stringify({
        totalDebts: debts.length,
        totalBalance,
        totalMinPayment,
        debts: debts.map((d: any) => ({
          name: d.name,
          balance: d.balance,
          apr: d.apr,
          minPayment: d.minPayment,
          dueDay: d.dueDay,
        })),
      });
    } catch (e) {
      return JSON.stringify({ error: 'Lỗi kết nối cơ sở dữ liệu.' });
    }
  },
  {
    name: 'get_user_debts',
    description:
      'Sử dụng khi cần kiểm tra tình trạng các khoản nợ của người dùng hiện tại (số lượng nợ, tổng dư nợ, tổng số tiền phải thanh toán tối thiểu). userId được hệ thống tự động cung cấp.',
    schema: z.object({
      userId: z.string().describe('ID của người dùng'),
    }),
  },
);

export const parseDebtFromTextTool = tool(
  async ({
    name,
    originalAmount,
    apr,
    termMonths,
    text,
    balance,
    minPayment,
    startDate,
    dueDay,
    feeProcessing,
    feeInsurance,
    feeManagement,
    rateType,
  }) => {
    return JSON.stringify({
      action: 'FORM_POPULATION_REQUIRED',
      parsedData: {
        name,
        originalAmount,
        apr,
        termMonths,
        rateType: rateType || 'REDUCING',
        balance: balance ?? originalAmount,
        minPayment: minPayment ?? null,
        startDate: startDate ?? null,
        dueDay: dueDay ?? 15,
        feeProcessing: feeProcessing ?? 0,
        feeInsurance: feeInsurance ?? 0,
        feeManagement: feeManagement ?? 0,
        notes: text || null,
      },
    });
  },
  {
    name: 'parse_debt_from_text',
    description:
      'Sử dụng khi người dùng cung cấp thông tin khoản nợ mới (số tiền, lãi suất, ngân hàng...). Gọi tool này để extract JSON. Chỉ gọi khi đã có đủ 4 trường bắt buộc: name, originalAmount, apr, termMonths.',
    schema: z.object({
      name: z.string().describe('Tên tổ chức tín dụng hoặc ngân hàng (vd: FE Credit, Vietcombank)'),
      originalAmount: z.number().describe('Số tiền gốc vay (VNĐ)'),
      apr: z.number().describe('Lãi suất danh nghĩa hàng năm (APR) tính theo %'),
      termMonths: z.number().describe('Kỳ hạn vay (số tháng)'),
      rateType: z
        .enum(['FLAT', 'REDUCING'])
        .optional()
        .describe('Loại lãi suất: FLAT (lãi phẳng) hoặc REDUCING (dư nợ giảm dần).'),
      text: z.string().optional().describe('Ngữ cảnh thêm từ người dùng nếu có đoạn cần ghi chú'),
      balance: z.number().optional().describe('Dư nợ hiện tại (VNĐ). Nếu không có, mặc định bằng originalAmount'),
      minPayment: z.number().optional().describe('Số tiền trả tối thiểu hàng tháng (VNĐ)'),
      startDate: z.string().optional().describe('Ngày bắt đầu vay (định dạng YYYY-MM-DD)'),
      dueDay: z.number().optional().describe('Ngày đáo hạn hàng tháng (1-31)'),
      feeProcessing: z.number().optional().describe('Phí xử lý hồ sơ hàng năm (%)'),
      feeInsurance: z.number().optional().describe('Phí bảo hiểm hàng năm (%)'),
      feeManagement: z.number().optional().describe('Phí quản lý hàng năm (%)'),
    }),
  },
);
