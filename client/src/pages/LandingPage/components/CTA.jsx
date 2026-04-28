import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Section, GradientText } from './Shared';

export default function CTA() {
  return (
    <Section className="py-32">
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 px-8 py-24 md:px-16 text-center shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-white/10">
        {/* Web3 Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full animate-pulse [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-20" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-8">
              <Zap size={14} /> Ready for the next level?
            </div>
            
            <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight">
              Bắt đầu hành trình <br />
              <GradientText from="from-blue-400" to="to-cyan-300">Tự do Tài chính</GradientText>
            </h2>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
              Gia nhập cộng đồng người dùng thông minh đang tối ưu hóa dòng tiền và xóa nợ mỗi ngày cùng FinSight.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register" className="group relative flex items-center gap-3 px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_80px_rgba(37,99,235,0.6)] transition-all hover:scale-105 active:scale-95">
                Bắt đầu miễn phí <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              </Link>
              <Link to="/contact" className="flex items-center gap-2 px-10 py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
                Liên hệ tư vấn
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-10">
              {[
                { label: 'Uptime', val: '99.9%' },
                { label: 'Security', val: 'Military' },
                { label: 'Support', val: '24/7' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-white">{stat.val}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
