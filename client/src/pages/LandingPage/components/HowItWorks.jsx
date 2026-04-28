import { FileEdit, BarChart3, Rocket, ChevronRight, Zap, Globe, ShieldCheck } from 'lucide-react';
import { Section, StaggerGroup, fadeUp, AnimatedCounter, GlowCard, GradientText } from './Shared';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  return (
    <>
      {/* Stats Bar */}
      <div className="relative py-24 border-y border-slate-200 dark:border-white/5 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <StaggerGroup className="grid md:grid-cols-3 gap-16 text-center">
            {[
              { icon: Globe, value: 6, suffix: '+', label: 'Platform Supported', sub: 'Credit Cards, E-wallets, Loans' },
              { icon: ShieldCheck, value: 100, suffix: '%', label: 'Decentralized Data', sub: 'Non-custodial information storage' },
              { icon: Zap, value: 5, suffix: ' Min', label: 'Deployment Time', sub: 'From setup to optimization' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="group flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-blue-500 mb-6 transition-transform group-hover:scale-110 duration-500">
                  <item.icon size={28} />
                </div>
                <div className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                  <GradientText from="from-blue-600" to="to-purple-500">
                    <AnimatedCounter target={item.value} suffix={item.suffix} />
                  </GradientText>
                </div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-widest">{item.label}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-[200px]">{item.sub}</div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </div>

      <Section id="how-it-works" className="py-32">
        <div className="text-center max-w-4xl mx-auto mb-24 relative">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tighter leading-tight">
            Giao thức <GradientText from="from-cyan-400" to="to-blue-600">Thanh Khoản Nợ</GradientText>
          </h2>
          <p className="text-2xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
            Hệ thống phân tích tự động chuẩn Web3, hoạt động minh bạch và bảo mật tuyệt đối.
          </p>
        </div>

        <StaggerGroup className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent -translate-y-1/2" />
          
          {[
            { step: '01', icon: FileEdit, title: 'Input Protocol', desc: 'Đồng bộ hóa dữ liệu tài chính qua giao diện trực quan. Nhập thông tin các khoản nợ với vài thao tác cơ bản.', glow: 'rgba(37, 99, 235, 0.2)', color: 'text-blue-500' },
            { step: '02', icon: BarChart3, title: 'Core Analysis', desc: 'Engine của FinSight bóc tách cấu trúc nợ, chi phí ẩn và trả về kịch bản tối ưu hóa dòng tiền.', glow: 'rgba(16, 185, 129, 0.2)', color: 'text-emerald-500' },
            { step: '03', icon: Rocket, title: 'Growth Staking', desc: 'Thực thi lộ trình thoát nợ và dịch chuyển dòng tiền sang tích lũy tài sản theo hướng dẫn từ AI.', glow: 'rgba(139, 92, 246, 0.2)', color: 'text-purple-500' },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="relative z-10">
              <GlowCard glowColor={item.glow} className="h-full text-center group">
                <div className="absolute top-6 right-8 text-7xl font-black text-slate-200 dark:text-white/5 pointer-events-none select-none tracking-tighter transition-all group-hover:scale-110 group-hover:text-blue-500/10">
                  {item.step}
                </div>
                
                <div className={`relative w-24 h-24 mx-auto rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 ${item.color} flex items-center justify-center mb-10 shadow-2xl transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500`}>
                  <div className={`absolute inset-0 ${item.glow} blur-xl rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <item.icon size={44} className="relative z-10" />
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">{item.title}</h4>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8">{item.desc}</p>
                
                <button className="flex items-center gap-2 mx-auto text-sm font-black uppercase tracking-widest text-blue-500 hover:gap-4 transition-all">
                  Chi tiết bước này <ChevronRight size={16} />
                </button>
              </GlowCard>
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>
    </>
  );
}
