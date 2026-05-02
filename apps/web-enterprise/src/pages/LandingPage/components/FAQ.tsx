import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { GradientText, Section } from './Shared';

const faqData = [
  {
    q: 'Hệ thống có an toàn để lưu trữ dữ liệu tài chính không?',
    a: 'FinSight ưu tiên bảo mật lên hàng đầu. Chúng tôi sử dụng tiêu chuẩn mã hóa quân sự (Military-grade) và không bao giờ lưu trữ thông tin định danh nhạy cảm của bạn.',
  },
  {
    q: 'Làm thế nào để thuật toán chọn ra chiến lược trả nợ tốt nhất?',
    a: 'Hệ thống giả lập hàng ngàn kịch bản dựa trên dòng tiền của bạn với các phương pháp Avalanche và Snowball. Kịch bản nào giúp giảm thiểu tổng chi phí lãi suất (EAR) nhiều nhất sẽ được ưu tiên đề xuất.',
  },
  {
    q: 'Tôi có bị tính phí ẩn khi sử dụng không?',
    a: 'Không. FinSight là một giao thức mở và hoàn toàn miễn phí cho người dùng cá nhân. Mục tiêu của chúng tôi là giúp bạn nhận diện các khoản phí ẩn từ ngân hàng, chứ không tạo thêm gánh nặng cho bạn.',
  },
  {
    q: 'Tôi có cần kiến thức tài chính để sử dụng không?',
    a: 'Hoàn toàn không. FinSight được thiết kế để đơn giản hóa những khái niệm phức tạp. Các báo cáo và chỉ dẫn AI được trình bày bằng ngôn ngữ tự nhiên, dễ hiểu cho tất cả mọi người.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Section id="faq" className="max-w-4xl py-32">
      <div className="text-center mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 text-xs font-black uppercase tracking-widest mb-6">
          <HelpCircle size={14} /> Knowledge Protocol
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tighter">
          Hệ Thống{' '}
          <GradientText from="from-purple-500" to="to-pink-500">
            Giải Đáp
          </GradientText>
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium relative z-10">
          Mọi thắc mắc của bạn về lộ trình tự do tài chính đều được giải đáp tại đây.
        </p>
      </div>

      <div className="space-y-6">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`group relative rounded-[2rem] border transition-all duration-500 ${isOpen ? 'bg-white dark:bg-slate-900 border-blue-500/50 shadow-2xl scale-[1.02]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-500/30'}`}
            >
              <button
                className="w-full text-left px-8 py-8 flex items-center justify-between font-black text-xl text-slate-900 dark:text-white tracking-tight"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="max-w-[85%]">{item.q}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: 'backOut' }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400 group-hover:text-blue-500'}`}
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="px-8 pb-8 text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      <div className="pt-4 border-t border-slate-100 dark:border-white/5">{item.a}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
