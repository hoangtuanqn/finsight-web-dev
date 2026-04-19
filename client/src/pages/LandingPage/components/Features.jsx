import { BarChart3, Map, Bot, Check, ArrowUpRight } from 'lucide-react';
import { Section, useIsMobile, GradientText, GlowCard } from './Shared';
import { motion } from 'framer-motion';

export default function Features() {
  const isMobile = useIsMobile();

  const FeatureRow = ({ title, icon: Icon, iconColor, glowColor, desc, bullets, isReversed, children }) => (
    <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 mb-32 last:mb-0 relative z-10`}>
      <motion.div 
        className="w-full lg:w-1/2"
        initial={!isMobile ? { opacity: 0, scale: 0.95, x: isReversed ? 30 : -30 } : false}
        whileInView={!isMobile ? { opacity: 1, scale: 1, x: 0 } : false}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlowCard glowColor={glowColor} className="!p-0 border-none bg-transparent">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 border border-white/60 dark:border-white/10 shadow-2xl relative overflow-hidden group">
            <div className={`absolute -top-24 -right-24 w-64 h-64 ${glowColor.replace('0.2', '0.1')} blur-[100px] rounded-full transition-transform duration-1000 group-hover:scale-150`} />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </GlowCard>
      </motion.div>
      <motion.div 
        className="w-full lg:w-1/2 flex flex-col"
        initial={!isMobile ? { opacity: 0, x: isReversed ? -30 : 30 } : false}
        whileInView={!isMobile ? { opacity: 1, x: 0 } : false}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={`w-16 h-16 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 ${iconColor} flex items-center justify-center mb-8 shadow-2xl`}>
          <Icon size={32} />
        </div>
        <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">{title}</h3>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 font-medium leading-relaxed">
          {desc}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold text-sm bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 p-4 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-colors">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Check className="text-blue-500" size={14} strokeWidth={4} />
              </div>
              {bullet}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <Section id="features" className="py-32">
      <div className="text-center max-w-4xl mx-auto mb-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-400/20 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tighter leading-tight">
          Giải pháp <GradientText from="from-blue-600" to="to-cyan-400">Tài chính</GradientText><br /> công nghệ cao
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
          Hệ sinh thái bóc tách dữ liệu và hỗ trợ ra quyết định thông minh.
        </p>
      </div>

      <FeatureRow 
        title="Phân tích lãi suất thực (EAR)" 
        icon={BarChart3} 
        iconColor="text-blue-600 dark:text-blue-400"
        glowColor="rgba(37, 99, 235, 0.2)"
        desc="Bóc tách hoàn toàn lớp vỏ bọc quảng cáo. FinSight tính toán chính xác chi phí ẩn và trả về con số EAR minh bạch nhất cho mọi khoản vay của bạn."
        bullets={[
          "Nhận diện phí ẩn tự động",
          "Mô phỏng chi phí lũy kế",
          "Biểu đồ so sánh thời gian thực"
        ]}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg"><BarChart3 size={20}/></div>
              <div className="font-black text-slate-900 dark:text-white tracking-wide uppercase text-xs">Risk Matrix Analyzer</div>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">Active Mode</div>
          </div>
          {[
            { name: 'Thẻ tín dụng', ear: 32.4, color: 'from-red-500 to-orange-500', w: '100%', trend: '+2.1%' },
            { name: 'Ví trả sau', ear: 28.1, color: 'from-amber-400 to-yellow-500', w: '85%', trend: '-0.5%' },
            { name: 'Khuyên dùng', ear: 18.5, color: 'from-emerald-400 to-cyan-500', w: '55%', trend: 'OPTIMAL' },
          ].map(item => (
            <div key={item.name} className="space-y-3 group">
              <div className="flex justify-between items-end">
                <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-500">{item.trend}</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{item.ear}%</span>
                </div>
              </div>
              <div className="h-4 bg-slate-200/50 dark:bg-white/5 rounded-full overflow-hidden border border-white/20 dark:border-white/5 relative">
                <motion.div initial={{ width: 0 }} whileInView={{ width: item.w }} transition={{ duration: 1.5, ease: "circOut" }} className={`h-full bg-gradient-to-r ${item.color} rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]`} />
              </div>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow 
        title="Định tuyến trả nợ thông minh" 
        icon={Map} 
        iconColor="text-emerald-600 dark:text-emerald-400"
        glowColor="rgba(16, 185, 129, 0.2)"
        isReversed
        desc="Công cụ tự động giả lập hàng ngàn kịch bản bằng thuật toán Avalanche và Snowball để tìm ra con đường tiết kiệm và nhanh nhất cho bạn."
        bullets={[
          "So sánh song song kịch bản",
          "Tối ưu dòng tiền khả dụng",
          "Lộ trình trực quan, dễ hiểu"
        ]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform"><Map size={100} /></div>
            <div className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-6">Avalanche AI</div>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">+$2.5k</div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Savings Potential</div>
            <div className="mt-8 inline-flex items-center gap-2 text-xs font-black text-emerald-600 bg-white dark:bg-emerald-950 px-4 py-2 rounded-xl shadow-lg">
              12 Months <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-md opacity-60 grayscale group-hover:grayscale-0 transition-all">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Snowball</div>
            <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">+$1.2k</div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Savings Potential</div>
            <div className="mt-8 text-xs font-bold text-slate-400">18 Months Plan</div>
          </div>
        </div>
      </FeatureRow>

      <FeatureRow 
        title="Trợ lý đầu tư AI (Wealth Guide)" 
        icon={Bot} 
        iconColor="text-purple-600 dark:text-purple-400"
        glowColor="rgba(167, 139, 250, 0.2)"
        desc="Không chỉ xóa nợ, hệ thống hướng dẫn bạn tích lũy tài sản bằng cách phân bổ vốn đầu tư dựa trên chỉ số tâm lý thị trường (Fear & Greed Index)."
        bullets={[
          "Chỉ số Fear & Greed Real-time",
          "Khuyến nghị rổ tài sản mượt",
          "Cân bằng dòng tiền tự động"
        ]}
      >
        <div className="relative">
          <div className="flex justify-between items-end mb-10">
            <div>
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Market Sentiment Index</div>
              <div className="text-6xl font-black text-purple-600 tracking-tighter drop-shadow-[0_0_20px_rgba(167,139,250,0.4)]">FEAR</div>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">42<span className="text-xl text-slate-400 font-bold ml-1">/100</span></div>
          </div>
          
          <div className="relative h-4 rounded-full bg-slate-200 dark:bg-white/5 border border-white/20 dark:border-white/5 mb-10 overflow-hidden shadow-inner">
            <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-gradient-to-r from-red-500 via-amber-500 to-purple-500 rounded-full">
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[2px]" />
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-purple-600/10 border border-purple-600/20 text-md font-bold text-purple-800 dark:text-purple-200 leading-relaxed shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white"><Bot size={18}/></div>
              <div className="text-xs font-black uppercase tracking-widest">AI Intelligence Suggestion</div>
            </div>
            Thị trường đang trong giai đoạn sợ hãi. Đây là thời điểm tối ưu để gia tăng tỷ trọng tài sản an toàn (Vàng, Tiền gửi) và DCA kỷ luật vào các mã blue-chip.
          </div>
        </div>
      </FeatureRow>
    </Section>
  );
}
