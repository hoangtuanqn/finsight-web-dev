import { CreditCard, Drama, BrainCircuit } from 'lucide-react';
import { Section, StaggerGroup, fadeUp, GlowCard, GradientText } from './Shared';
import { motion } from 'framer-motion';

export default function Problems() {
  return (
    <Section id="problems" className="py-32">
      <div className="text-center max-w-3xl mx-auto mb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tighter">
          Tại sao bạn cần <GradientText from="from-blue-600" to="to-indigo-500">FinSight</GradientText>?
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
          Trong kỷ nguyên nợ nần phân mảnh, chúng tôi mang lại sự minh bạch tuyệt đối.
        </p>
      </div>

      <StaggerGroup className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: CreditCard,
            title: 'Nợ phân mảnh',
            desc: 'Dễ dàng mất kiểm soát khi có nhiều khoản nợ từ SPayLater, ví trả sau đến thẻ tín dụng rải rác khắp nơi.',
            glow: 'rgba(59, 130, 246, 0.2)',
            iconColor: 'bg-blue-500'
          },
          {
            icon: Drama,
            title: 'Lãi suất ẩn',
            desc: 'Chi phí thực tế thường cao hơn nhiều so với quảng cáo do các khoản phí hồ sơ và bảo hiểm "vô hình".',
            glow: 'rgba(139, 92, 246, 0.2)',
            iconColor: 'bg-purple-500'
          },
          {
            icon: BrainCircuit,
            title: 'Thiếu định hướng',
            desc: 'Không biết phương pháp thoát nợ nào là tối ưu và loay hoay trong việc phân bổ tài sản an toàn.',
            glow: 'rgba(236, 72, 153, 0.2)',
            iconColor: 'bg-pink-500'
          },
        ].map((item) => (
          <motion.div key={item.title} variants={fadeUp}>
            <GlowCard glowColor={item.glow} className="h-full group">
              <div className={`w-16 h-16 rounded-2xl ${item.iconColor} text-white flex items-center justify-center mb-8 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{item.title}</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {item.desc}
              </p>
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 text-sm font-bold text-blue-500">
                Tìm hiểu thêm <ChevronRight size={16} />
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </StaggerGroup>
    </Section>
  );
}
import { ChevronRight } from 'lucide-react';
