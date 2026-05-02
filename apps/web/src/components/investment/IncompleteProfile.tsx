import { motion } from 'framer-motion';
import { ArrowRight, Lock, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IncompleteProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 relative overflow-hidden">
      {/* Soft Ambient Background patterns */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 max-w-xl w-full p-12 text-center relative z-10 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
      >
        <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 rounded-full shadow-inner">
          <Lock size={32} className="text-slate-400" />
        </div>

        <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Dữ liệu đang được khóa</h2>

        <p className="text-base font-medium text-slate-400 mb-10 leading-relaxed">
          Hệ thống AI cần thông tin <span className="text-white font-semibold">Thu nhập</span> và{' '}
          <span className="text-white font-semibold">Số vốn</span> của bạn để khởi chạy mô hình phân bổ tài sản thông
          minh.
        </p>

        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-full transition-all duration-300 group shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
        >
          <UserPlus size={18} />
          Hoàn thiện Hồ sơ ngay
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-4 opacity-50 grayscale">
          <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight" className="h-6 w-auto" />
          <span className="text-[10px] font-semibold tracking-widest text-slate-500">Secure Protocol</span>
        </div>
      </motion.div>
    </div>
  );
}
