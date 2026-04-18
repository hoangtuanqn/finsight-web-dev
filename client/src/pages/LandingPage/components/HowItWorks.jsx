import { FileEdit, BarChart3, Rocket } from 'lucide-react';
import { Section, StaggerGroup, fadeUp, AnimatedCounter, Web3Card, GradientText } from './Shared';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  return (
    <>
      <div className="relative py-24 border-y border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <StaggerGroup className="grid md:grid-cols-3 gap-16 text-center">
            {[
              { value: 6, suffix: '+', label: 'Nền tảng hỗ trợ', sub: 'Tích hợp sẵn thẻ tín dụng, ví điện tử' },
              { value: 100, suffix: '%', label: 'Giao thức mở', sub: 'Không lưu trữ thông tin định danh' },
              { value: 5, suffix: ' Phút', label: 'Tối ưu luồng', sub: 'Khởi tạo tài khoản phi tập trung' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center">
                <div className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">
                  <GradientText from="from-blue-500" to="to-purple-500">
                    <AnimatedCounter target={item.value} suffix={item.suffix} />
                  </GradientText>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-widest">{item.label}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[200px]">{item.sub}</div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </div>

      <Section id="how-it-works" className="pt-32 pb-16">
        <div className="text-center max-w-4xl mx-auto mb-24 relative">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tight">
            Giao thức <GradientText from="from-cyan-400" to="to-blue-500">Xử Lý Nợ</GradientText>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
            Hệ thống phân tích tự động chuẩn Web3, hoạt động minh bạch và bảo mật.
          </p>
        </div>

        <StaggerGroup className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-24 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-500/20 via-cyan-400/50 to-purple-500/20" />
          
          {[
            { step: '01', icon: FileEdit, title: 'Input Data', desc: 'Đồng bộ hóa dữ liệu tài chính (Dapp-like experience). Nhập thông tin các khoản nợ với vài thao tác cơ bản.', glow: 'bg-blue-500/20', color: 'text-blue-500' },
            { step: '02', icon: BarChart3, title: 'Smart Contract Analysis', desc: 'FinSight Engine hoạt động như một Smart Contract, bóc tách cấu trúc nợ và trả về bản đồ tối ưu.', glow: 'bg-cyan-500/20', color: 'text-cyan-500' },
            { step: '03', icon: Rocket, title: 'Wealth Staking', desc: 'Thực thi lộ trình thoát nợ và dịch chuyển dần dòng tiền sang tích lũy tài sản theo hướng dẫn của AI.', glow: 'bg-purple-500/20', color: 'text-purple-500' },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="relative z-10 flex flex-col items-center">
              <Web3Card glowColor={item.glow} className="w-full text-center h-full">
                <div className="absolute top-6 right-6 text-6xl font-black text-slate-200 dark:text-white/5 pointer-events-none select-none tracking-tighter">
                  {item.step}
                </div>
                
                <div className={`relative w-20 h-20 mx-auto rounded-2xl bg-white/50 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-white/10 ${item.color} flex items-center justify-center mb-10 shadow-2xl`}>
                  <div className={`absolute inset-0 ${item.glow} blur-md rounded-2xl`} />
                  <item.icon size={36} className="relative z-10" />
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">{item.title}</h4>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
              </Web3Card>
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>
    </>
  );
}
