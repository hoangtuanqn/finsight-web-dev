import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from './Shared';
import heroMockup from '../../../assets/hero-mockup.png';

export default function Hero() {
  const { token } = useAuth();
  const isLoggedIn = !!token;
  const isMobile = useIsMobile();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6 border border-blue-100 dark:border-blue-500/20">
            Giải pháp tài chính thông minh
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.15] mb-6 tracking-tight">
            Làm chủ <span className="text-blue-600 dark:text-blue-500">tài chính</span>,<br /> 
            xóa tan nỗi lo <span className="text-blue-600 dark:text-blue-500">nợ nần.</span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">
            FinSight bóc tách mọi loại phí ẩn, tự động hóa kế hoạch trả nợ và phân bổ tài sản thông minh bằng trí tuệ nhân tạo.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            {isLoggedIn ? (
              <Link to="/home" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                Vào Dashboard <ChevronRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
                  Bắt đầu miễn phí <ChevronRight size={18} />
                </Link>
                <Link to="/login" className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Xem Demo
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { icon: ShieldCheck, text: 'An toàn' },
              { icon: Lock, text: 'Bảo mật' },
              { icon: Zap, text: 'Nhanh chóng' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <item.icon size={16} className="text-emerald-500" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative lg:h-[500px] flex items-center justify-center"
        >
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 blur-3xl rounded-full" />
            
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <img src={heroMockup} alt="FinSight Dashboard" className="w-full h-auto relative z-10" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
