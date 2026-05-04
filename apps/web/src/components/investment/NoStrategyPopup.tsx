import { motion } from 'framer-motion';
import { Bot, Sparkles, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NoStrategyPopupProps {
  quota: number;
  onGenerate: () => void;
  generating: boolean;
  onClose: () => void;
}

export default function NoStrategyPopup({ quota, onGenerate, generating, onClose }: NoStrategyPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bot size={32} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Bạn chưa có chiến lược đầu tư nào</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Hệ thống sẽ phân tích thị trường hiện tại và hồ sơ rủi ro của bạn để đưa ra chiến lược phân bổ danh mục tối
            ưu.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8">
            <Zap size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">
              Bạn còn <span className="font-black text-amber-400">{quota}</span> lượt tạo chiến lược
            </span>
          </div>

          <button
            onClick={onGenerate}
            disabled={generating || quota <= 0}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang phân tích thị trường...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Tạo chiến lược theo thị trường hiện tại
              </>
            )}
          </button>

          {quota <= 0 && (
            <p className="mt-3 text-xs text-red-400">
              Hết lượt.{' '}
              <Link to="/upgrade" className="underline text-blue-400">
                Nâng cấp tài khoản
              </Link>{' '}
              để nhận thêm lượt.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
