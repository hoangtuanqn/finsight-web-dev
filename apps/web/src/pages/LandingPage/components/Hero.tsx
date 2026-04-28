import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Lock, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile, GradientText, Spotlight } from './Shared';
import heroMockup from '../../../assets/hero-mockup.png';

export default function Hero() {
  const { token } = useAuth();
  const isLoggedIn = !!token;
  const isMobile = useIsMobile() as boolean;

  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles size={14} className="animate-spin-slow" />
            Fintech Intelligence Protocol
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tighter">
            Làm chủ <GradientText from="from-blue-600" to="to-cyan-500">tài chính</GradientText>,<br /> 
            xóa tan nỗi lo <GradientText from="from-purple-500" to="to-pink-500">nợ nần.</GradientText>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">
            FinSight bóc tách mọi loại phí ẩn, tự động hóa kế hoạch trả nợ và phân bổ tài sản thông minh bằng trí tuệ nhân tạo thế hệ mới.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            {isLoggedIn ? (
              <Link to="/home" className="group relative flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all">
                Vào Dashboard <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="group relative flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all">
                  Launch App <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </Link>
                <Link to="/login" className="flex items-center gap-2 px-8 py-4 bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all">
                  Xem Demo
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-8">
            {[
              { icon: ShieldCheck, text: 'Mã hóa quân sự' },
              { icon: Lock, text: 'Bảo mật 2FA' },
              { icon: Zap, text: 'Xử lý Real-time' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <item.icon size={16} className="text-blue-500" />
                {item.text}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:h-[600px] flex items-center justify-center perspective-1000"
        >
          <div className="relative w-full max-w-lg group">
            <div className="absolute -inset-20 bg-blue-500/20 dark:bg-blue-600/30 blur-[100px] rounded-full animate-pulse" />
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/60 dark:border-white/10 shadow-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl">
              <img src={heroMockup} alt="FinSight Dashboard" className="w-full h-auto relative z-10 transition-transform duration-700 group-hover:scale-105" />
            </div>

            {/* Floating Ornaments */}
            <motion.div 
              animate={{ y: [-15, 15, -15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-20 p-5 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-white dark:border-white/10 rounded-2xl shadow-2xl hidden md:block"
            >
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">EAR Savings</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">+24.5%</div>
            </motion.div>

            <motion.div 
              animate={{ y: [15, -15, 15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-12 bottom-20 p-5 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-white dark:border-white/10 rounded-2xl shadow-2xl hidden md:block"
            >
              <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Debt Cleared</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">$12,450</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
