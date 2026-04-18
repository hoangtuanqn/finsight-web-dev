import { CreditCard, Drama, BrainCircuit } from 'lucide-react';
import { Section, StaggerGroup, fadeUp, Web3Card, GradientText } from './Shared';
import { motion } from 'framer-motion';

export default function Problems() {
  return (
    <Section id="problems" className="py-32">
      <div className="text-center max-w-3xl mx-auto mb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tight">
          Tại sao bạn cần <GradientText>FinSight</GradientText>?
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium relative z-10">
          Quản lý tài chính cá nhân không nên phức tạp. Hãy để công nghệ giải quyết những khó khăn của bạn.
        </p>
      </div>

      <StaggerGroup className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: CreditCard,
            title: 'Nợ phân mảnh',
            desc: 'Mất kiểm soát với vô số khoản nợ rải rác trên SPayLater, thẻ tín dụng và các ứng dụng ví trả sau.',
            glowColor: 'bg-blue-500/20',
            iconColor: 'text-blue-500'
          },
          {
            icon: Drama,
            title: 'Lãi suất ẩn',
            desc: 'Bị đánh lừa bởi quảng cáo lãi suất thấp, trong khi chi phí thực (EAR) đội lên cao vì các loại phí ẩn.',
            glowColor: 'bg-purple-500/20',
            iconColor: 'text-purple-500'
          },
          {
            icon: BrainCircuit,
            title: 'Thiếu định hướng',
            desc: 'Không biết phương pháp thoát nợ nào hiệu quả nhất và gặp khó khăn trong việc phân bổ tài sản.',
            glowColor: 'bg-cyan-500/20',
            iconColor: 'text-cyan-500'
          },
        ].map((item) => (
          <motion.div key={item.title} variants={fadeUp}>
            <Web3Card glowColor={item.glowColor} className="h-full">
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/60 dark:border-white/10 ${item.iconColor} flex items-center justify-center mb-8 shadow-lg`}>
                  <item.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </Web3Card>
          </motion.div>
        ))}
      </StaggerGroup>
    </Section>
  );
}
