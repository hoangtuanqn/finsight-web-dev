import { z } from 'zod';

export const authSchemas = {
  register: z
    .object({
      fullName: z
        .string()
        .min(1, 'Họ tên không được để trống')
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(50, 'Họ tên không được vượt quá 50 ký tự'),
      email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
      password: z.string().min(1, 'Mật khẩu không được để trống').min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
      confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc').optional(),
      referralCode: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.confirmPassword && data.password !== data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
      },
    ),

  login: z.object({
    email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
  }),

  debt: z
    .object({
      name: z.string().min(1, 'Tên khoản vay không được để trống'),
      debtType: z.enum(['INSTALLMENT', 'CREDIT_CARD']).optional().default('INSTALLMENT'),
      originalAmount: z.number().min(0, 'Số tiền gốc không được âm'),
      balance: z.number().min(0, 'Dư nợ không được âm'),
      apr: z.number().min(0).max(100, 'Lãi suất APR không hợp lệ'),
      rateType: z.enum(['FLAT', 'REDUCING']),
      feeProcessing: z.number().min(0).max(20, 'Phí xử lý không quá 20%').optional(),
      feeInsurance: z.number().min(0).max(10, 'Phí bảo hiểm không quá 10%').optional(),
      feeManagement: z.number().min(0).max(5, 'Phí quản lý không quá 5%').optional(),
      minPayment: z.number().min(0, 'Số tiền trả tối thiểu không được âm'),
      termMonths: z.number().int().min(0, 'Kỳ hạn không được âm').max(360, 'Kỳ hạn không quá 360 tháng'),
      dueDay: z.number().int().min(1).max(31, 'Ngày đáo hạn không hợp lệ'),
      startDate: z.string().optional(),
      remainingTerms: z.number().int().min(0).optional(),
      platform: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      const isInstallment = data.debtType === 'INSTALLMENT';

      if (isInstallment) {
        if (data.originalAmount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Số tiền gốc phải lớn hơn 0 đối với Vay trả góp',
            path: ['originalAmount'],
          });
        }
        if (data.termMonths <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Kỳ hạn phải lớn hơn 0 đối với Vay trả góp',
            path: ['termMonths'],
          });
        }
      }

      if (data.balance > 0 && data.minPayment <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Khoản trả tối thiểu phải lớn hơn 0 khi có dư nợ',
          path: ['minPayment'],
        });
      }

      if (data.balance > data.originalAmount && data.originalAmount > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dư nợ hiện tại không được lớn hơn số tiền gốc/hạn mức ban đầu',
          path: ['balance'],
        });
      }
    }),

  profile: z.object({
    fullName: z.string().min(1, 'Họ tên không được để trống').max(50),
    monthlyIncome: z.number().min(0),
    extraBudget: z.number().min(0),
    capital: z.number().min(0).optional(),
    goal: z.enum(['GROWTH', 'INCOME', 'STABILITY', 'SPECULATION']).optional(),
    horizon: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    savingsRate: z.number().min(0).max(100).optional(),
    inflationRate: z.number().min(0).max(100).optional(),
  }),

  payment: z.object({
    amount: z.number().positive('Số tiền thanh toán phải lớn hơn 0'),
    notes: z.string().max(200).optional(),
  }),

  qrScanned: z.object({
    qrToken: z.string().uuid('Token QR không hợp lệ'),
  }),

  qrConfirm: z.object({
    qrToken: z.string().uuid('Token QR không hợp lệ'),
    action: z.enum(['approve', 'reject']),
  }),
};
