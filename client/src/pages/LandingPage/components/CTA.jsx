import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import { GradientText } from './Shared';

export default function CTA() {
  const { token } = useAuth();
  const isLoggedIn = !!token;

  return (
    <section className="py-32 px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto rounded-[3rem] bg-slate-900/80 backdrop-blur-2xl p-12 lg:p-24 text-center relative overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.15)] group"
      >
        {/* Web3 Ambient Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-[100px] rounded-[100%] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8 relative z-10">
          <Zap size={14} /> Future of Finance
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[1.1] relative z-10 tracking-tight">
          Sẵn sàng bắt đầu hành trình <br className="hidden md:block"/> <GradientText from="from-blue-400" to="to-cyan-300">Tự do tài chính</GradientText>?
        </h2>
        <p className="text-xl text-slate-300 mb-12 font-medium relative z-10 max-w-2xl mx-auto leading-relaxed">
          Đừng để lãi suất kiểm soát cuộc sống của bạn. Tham gia giao thức quản lý tài chính thế hệ mới ngay hôm nay.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
          {isLoggedIn ? (
            <Link to="/home" className="group relative flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all">
              Vào Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="group relative flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all">
                Đăng ký ngay <Sparkles size={20} />
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-2 px-10 py-5 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 backdrop-blur-md transition-all">
                Dùng thử Demo
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
