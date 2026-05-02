import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { UseFormRegister } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { HORIZON_OPTIONS, LABEL_CLASSES, RISK_META, SELECT_CLASSES } from '../constants';

interface InvestmentSectionProps {
  register: UseFormRegister<any>;
  user: any;
  hasCompletedQuiz: boolean;
}

export default function InvestmentSection({ register, user, hasCompletedQuiz }: InvestmentSectionProps) {
  const riskLevel = user?.investorProfile?.riskLevel || 'MEDIUM';
  const riskMeta = RISK_META[riskLevel as keyof typeof RISK_META];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className={LABEL_CLASSES}>Mục tiêu tài chính</label>
          <select className={SELECT_CLASSES} {...register('goal')}>
            <option value="GROWTH">Tăng trưởng tài sản</option>
            <option value="INCOME">Tạo dòng tiền thụ động</option>
            <option value="STABILITY">Bảo toàn vốn</option>
            <option value="SPECULATION">Đầu cơ mạo hiểm</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSES}>Thời hạn đầu tư</label>
          <select className={SELECT_CLASSES} {...register('horizon')}>
            {HORIZON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASSES}>
            Khẩu vị rủi ro{' '}
            {hasCompletedQuiz && <span className="normal-case font-medium text-emerald-500 ml-1">(Từ Quiz)</span>}
          </label>
          <select className={SELECT_CLASSES} {...register('riskLevel')}>
            <option value="LOW">Thấp - An toàn</option>
            <option value="MEDIUM">Vừa phải - Cân bằng</option>
            <option value="HIGH">Cao - Mạo hiểm</option>
          </select>
          {hasCompletedQuiz && (
            <p className="text-[10px] mt-2 font-bold tracking-tight uppercase" style={{ color: riskMeta.color }}>
              AI gợi ý: {riskMeta.label}
            </p>
          )}
        </div>
      </div>
      {!hasCompletedQuiz && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-inner"
        >
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[13px] text-amber-200 font-bold">Chưa hoàn thành đánh giá rủi ro</p>
            <p className="text-[12px] text-amber-300/80 font-medium">
              Hãy làm bài kiểm tra 10 câu hỏi để AI thấu hiểu phong cách đầu tư của bạn hơn.{' '}
              <Link
                to="/risk-assessment"
                className="font-black text-amber-400 underline decoration-2 underline-offset-4 hover:text-amber-200 transition-all"
              >
                Làm ngay →
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
