import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Section, GradientText } from './Shared';
import { motion, AnimatePresence } from 'framer-motion';

const faqData = [
  { q: 'Hệ thống có an toàn để lưu trữ dữ liệu tài chính không?', a: 'FinSight hoạt động trên nguyên tắc mã hóa đầu cuối. Chúng tôi sử dụng tiêu chuẩn mã hóa quân sự (bcrypt, JWT) và không chia sẻ dữ liệu cho bất kỳ bên thứ ba nào.' },
  { q: 'Web 3.0 và tài chính cá nhân có liên quan gì?', a: 'Giao diện Web3 mang lại trải nghiệm minh bạch, nhanh chóng và mượt mà. Tuy FinSight không phải Dapp, nhưng tư duy thiết kế và luồng xử lý được lấy cảm hứng từ các nền tảng DeFi hàng đầu.' },
  { q: 'Làm thế nào để thuật toán chọn ra chiến lược trả nợ tốt nhất?', a: 'Engine của chúng tôi mô phỏng dòng tiền khả dụng của bạn đối với mọi cấu trúc trả nợ (Avalanche, Snowball). Lộ trình nào giảm thiểu tổng chi phí lãi suất (Total Interest Paid) cao nhất sẽ được đề xuất.' },
  { q: 'Tôi có bị tính phí Ẩn không?', a: 'Không. Nền tảng miễn phí 100%. Nhiệm vụ của chúng tôi là minh bạch hóa các khoản phí ẩn từ ngân hàng, chứ không phải tạo thêm phí ẩn cho người dùng.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <Section id="faq" className="max-w-4xl py-32">
      <div className="text-center mb-20 relative">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 relative z-10 tracking-tight">
          Hệ Thống <GradientText from="from-purple-500" to="to-pink-500">Giải Đáp</GradientText>
        </h2>
      </div>

      <div className="space-y-4">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div 
              key={i} 
              className={`border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 backdrop-blur-md ${isOpen ? 'bg-white/60 dark:bg-slate-800/60 shadow-[0_0_30px_rgba(139,92,246,0.15)]' : 'bg-white/20 dark:bg-slate-900/40 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
            >
              <button
                className="w-full text-left px-8 py-6 flex items-center justify-between font-bold text-slate-900 dark:text-white text-lg"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <motion.div 
                  animate={{ rotate: isOpen ? 180 : 0 }} 
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${isOpen ? 'bg-purple-500/20 border-purple-500/50 text-purple-500' : 'bg-transparent border-white/20 text-slate-400'}`}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-8 pb-8 text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      {item.a}
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
