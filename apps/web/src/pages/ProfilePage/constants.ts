import { Flame, Shield, Target } from 'lucide-react';
import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(50),
  monthlyIncome: z.number().min(0),
  extraBudget: z.number().min(0),
  capital: z.number().min(0).optional(),
  goal: z.enum(['GROWTH', 'INCOME', 'STABILITY', 'SPECULATION']).optional(),
  horizon: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  savingsRate: z.number().min(0).max(100).optional(),
  inflationRate: z.number().min(0).max(100).optional(),
});

export const HORIZON_OPTIONS = [
  { value: 'SHORT', label: 'Ngắn hạn - dưới 1 năm' },
  { value: 'MEDIUM', label: 'Trung hạn - 1 đến 3 năm' },
  { value: 'LONG', label: 'Dài hạn - trên 3 năm' },
];

export const HORIZON_LABEL: Record<string, string> = {
  SHORT: 'Ngắn hạn',
  MEDIUM: 'Trung hạn',
  LONG: 'Dài hạn',
};

export const GOAL_LABEL: Record<string, string> = {
  GROWTH: 'Tăng trưởng tài sản',
  INCOME: 'Dòng tiền thụ động',
  STABILITY: 'Bảo toàn vốn',
  SPECULATION: 'Đầu cơ mạo hiểm',
};

export const RISK_META = {
  LOW: {
    label: 'Thấp - An toàn',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
    Icon: Shield,
  },
  MEDIUM: {
    label: 'Vừa phải - Cân bằng',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-400',
    Icon: Target,
  },
  HIGH: {
    label: 'Cao - Mạo hiểm',
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-400',
    Icon: Flame,
  },
};

export const INPUT_CLASSES =
  'w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] text-sm outline-none focus:border-blue-500/60 transition-colors';
export const SELECT_CLASSES = INPUT_CLASSES + ' cursor-pointer';
export const LABEL_CLASSES =
  'block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5';
