import { BarChart3, Map, Bot, Check } from 'lucide-react';
import { Section, useIsMobile, GradientText } from './Shared';
import { motion } from 'framer-motion';

export default function Features() {
  const isMobile = useIsMobile();

  const FeatureRow = ({ num, title, icon: Icon, iconColor, glowColor, desc, bullets, isReversed, children }) => (
    <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 mb-32 last:mb-0 relative z-10`}>
      <motion.div 
        className="w-full lg:w-1/2"
        initial={!isMobile ? { opacity: 0, x: isReversed ? 30 : -30 } : false}
        whileInView={!isMobile ? { opacity: 1, x: 0 } : false}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative group">
          <div className={`absolute -inset-1 ${glowColor} blur-2xl opacity-30 dark:opacity-50 group-hover:opacity-60 transition-opacity duration-700 rounded-[2.5rem]`} />
          <div className="relative bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-8 lg:p-10 border border-white/60 dark:border-white/10 shadow-2xl overflow-hidden">
            {/* Ambient inner glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 ${glowColor} blur-3xl opacity-20`} />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div 
        className="w-full lg:w-1/2 flex flex-col"
        initial={!isMobile ? { opacity: 0, x: isReversed ? -30 : 30 } : false}
        whileInView={!isMobile ? { opacity: 1, x: 0 } : false}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 ${iconColor} mb-8 shadow-xl`}>
          <Icon size={32} />
        </div>
        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{title}</h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 font-medium leading-relaxed">
          {desc}
        </p>
        <ul className="space-y-4">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-bold text-sm bg-white/30 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/5 p-4 rounded-xl">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${glowColor.replace('/20', '/30')} ${iconColor}`}>
                <Check size={14} strokeWidth={3} />
              </div>
              {bullet}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );

  return (
    <Section id="features" className="py-32">
      <div className="text-center max-w-4xl mx-auto mb-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-400/20 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tight">
          Tính năng <GradientText>Vượt Trội</GradientText>
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
          Kết hợp sức mạnh phân tích dữ liệu và thuật toán tối ưu hóa danh mục đầu tư.
        </p>
      </div>

      <FeatureRow 
        num="01" 
        title="Phân tích lãi suất thực (EAR)" 
        icon={BarChart3} 
        iconColor="text-cyan-500"
        glowColor="bg-cyan-500/20"
        desc="Bóc tách hoàn toàn lớp vỏ bọc quảng cáo. FinSight tính toán chính xác chi phí ẩn và trả về con số EAR minh bạch nhất cho mọi khoản vay."
        bullets={[
          "Nhận diện phí hồ sơ & bảo hiểm tự động",
          "Mô phỏng chi phí lũy kế theo thời gian thực",
          "Biểu đồ so sánh rủi ro trực quan"
        ]}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs">AI</div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data Analytics Model</div>
          </div>
          {[
            { name: 'Thẻ tín dụng', ear: 32.4, color: 'from-purple-500 to-pink-500', w: '100%' },
            { name: 'Ví trả sau', ear: 28.1, color: 'from-amber-400 to-orange-500', w: '85%' },
            { name: 'Khuyên dùng', ear: 18.5, color: 'from-cyan-400 to-blue-500', w: '55%' },
          ].map(item => (
            <div key={item.name} className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <span>{item.name}</span>
                <span className="font-black text-slate-900 dark:text-white">{item.ear}%</span>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden border border-white/20 dark:border-white/5">
                <motion.div initial={{ width: 0 }} whileInView={{ width: item.w }} transition={{ duration: 1.2, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${item.color} rounded-full relative`}>
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40" />
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </FeatureRow>

      <FeatureRow 
        num="02" 
        title="Định tuyến trả nợ thông minh" 
        icon={Map} 
        iconColor="text-purple-500"
        glowColor="bg-purple-500/20"
        isReversed
        desc="Công cụ tự động giả lập hàng ngàn lộ trình trả nợ bằng thuật toán Avalanche và Snowball để tìm ra con đường tiết kiệm và nhanh nhất cho bạn."
        bullets={[
          "So sánh song song các kịch bản",
          "Tối ưu dòng tiền khả dụng mỗi tháng",
          "Lộ trình trực quan, dễ dàng theo dõi"
        ]}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-500"><Map size={64} /></div>
            <div className="text-xs font-black text-purple-500 uppercase tracking-widest mb-4">Avalanche AI</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">+$2.5k</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Tiết kiệm tiền lãi</div>
            <div className="mt-6 text-xs font-bold text-slate-600 dark:text-slate-300">Hoàn thành trong 12 tháng</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 backdrop-blur-sm opacity-60">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Snowball</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">+$1.2k</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Tiết kiệm tiền lãi</div>
            <div className="mt-6 text-xs font-bold text-slate-600 dark:text-slate-300">Hoàn thành trong 18 tháng</div>
          </div>
        </div>
      </FeatureRow>

      <FeatureRow 
        num="03" 
        title="Trợ lý đầu tư AI (Wealth Guide)" 
        icon={Bot} 
        iconColor="text-blue-500"
        glowColor="bg-blue-500/20"
        desc="Không chỉ xóa nợ, hệ thống hướng dẫn bạn tích lũy tài sản bằng cách phân bổ vốn đầu tư dựa trên chỉ số tâm lý thị trường (Fear & Greed Index)."
        bullets={[
          "Đồng bộ chỉ số Fear & Greed thời gian thực",
          "Khuyến nghị rổ tài sản theo biến động",
          "Tái cân bằng tự động"
        ]}
      >
        <div className="relative">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Market Sentiment</div>
              <div className="text-5xl font-black text-blue-500 tracking-tighter">FEAR</div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">42<span className="text-lg text-slate-400">/100</span></div>
          </div>
          
          <div className="relative h-4 rounded-full bg-slate-200 dark:bg-slate-800/80 border border-white/20 dark:border-white/5 mb-8">
            <div className="absolute left-0 top-0 bottom-0 w-[42%] bg-gradient-to-r from-red-500 to-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-amber-500 translate-x-1/2" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-xs mr-2">Gợi ý AI:</span>
            Thị trường đang sợ hãi. Đây là thời điểm tốt để tăng tỷ trọng tích lũy các tài sản an toàn (Vàng, Gửi tiết kiệm) và DCA nhẹ vào cổ phiếu.
          </div>
        </div>
      </FeatureRow>
    </Section>
  );
}
