import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { investmentAPI, userAPI } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, RefreshCw, Target, Flame, Shield } from 'lucide-react';

const QUESTIONS = [
  { id: 'reaction_drop', category: 'Phản ứng thị trường', question: 'Nếu danh mục đầu tư giảm 20% trong 1 tháng, bạn sẽ?',
    options: [{ text: 'Bán hết để cắt lỗ', score: 10 }, { text: 'Bán một phần, giữ phần còn lại', score: 30 }, { text: 'Giữ nguyên và chờ đợi', score: 60 }, { text: 'Mua thêm vì đây là cơ hội', score: 90 }] },
  { id: 'goal', category: 'Mục tiêu', question: 'Mục tiêu đầu tư chính của bạn là gì?',
    options: [{ text: 'Bảo toàn vốn, không muốn mất tiền', score: 15 }, { text: 'Thu nhập ổn định hàng tháng', score: 35 }, { text: 'Tăng trưởng vốn dài hạn', score: 65 }, { text: 'Tối đa hóa lợi nhuận, chấp nhận biến động lớn', score: 90 }] },
  { id: 'horizon', category: 'Thời gian', question: 'Khoảng thời gian đầu tư dự kiến?',
    options: [{ text: 'Dưới 1 năm', score: 15 }, { text: '1-3 năm', score: 40 }, { text: '3-5 năm', score: 65 }, { text: 'Trên 5 năm', score: 85 }] },
  { id: 'experience', category: 'Kinh nghiệm', question: 'Bạn có kinh nghiệm đầu tư tài chính không?',
    options: [{ text: 'Chưa bao giờ đầu tư', score: 10 }, { text: 'Chỉ gửi tiết kiệm ngân hàng', score: 30 }, { text: 'Đã đầu tư chứng khoán/vàng', score: 60 }, { text: 'Đầu tư đa dạng (crypto, CK, BĐS...)', score: 85 }] },
  { id: 'allocation', category: 'Tỉ lệ đầu tư', question: 'Tỉ lệ thu nhập bạn sẵn sàng đầu tư?',
    options: [{ text: 'Dưới 10% — chỉ dư thì mới đầu tư', score: 15 }, { text: '10-20% — dành riêng mỗi tháng', score: 40 }, { text: '20-40% — đầu tư là ưu tiên', score: 65 }, { text: 'Trên 40% — all-in', score: 90 }] },
  { id: 'emergency_fund', category: 'Quỹ khẩn cấp', question: 'Quỹ khẩn cấp hiện tại của bạn đủ cho bao nhiêu tháng chi tiêu?',
    options: [{ text: 'Không có quỹ khẩn cấp', score: 10 }, { text: 'Dưới 3 tháng', score: 30 }, { text: '3-6 tháng', score: 65 }, { text: 'Trên 6 tháng', score: 90 }] },
  { id: 'income_stability', category: 'Thu nhập', question: 'Mức độ ổn định của thu nhập hàng tháng?',
    options: [{ text: 'Không ổn định, thường xuyên biến động', score: 15 }, { text: 'Tương đối ổn định nhưng đôi khi thay đổi', score: 35 }, { text: 'Khá ổn định (lương cứng + thưởng)', score: 65 }, { text: 'Rất ổn định, có thêm thu nhập thụ động', score: 90 }] },
  { id: 'loss_experience', category: 'Kinh nghiệm thua lỗ', question: 'Bạn đã từng thua lỗ khi đầu tư chưa? Cảm giác như thế nào?',
    options: [{ text: 'Chưa, và tôi rất lo sợ điều đó', score: 10 }, { text: 'Chưa, nhưng tôi nghĩ mình sẽ bình tĩnh', score: 35 }, { text: 'Rồi, tôi hoảng loạn và bán ngay', score: 20 }, { text: 'Rồi, tôi giữ bình tĩnh và học từ sai lầm', score: 80 }] },
  { id: 'debt_situation', category: 'Tình trạng nợ', question: 'Tình trạng nợ hiện tại của bạn?',
    options: [{ text: 'Đang có nhiều nợ lãi cao (>30%/năm)', score: 10 }, { text: 'Có nợ vừa phải, đang trả đều', score: 35 }, { text: 'Chỉ còn khoản nợ nhỏ hoặc lãi thấp', score: 65 }, { text: 'Không có nợ', score: 90 }] },
  { id: 'news_reaction', category: 'Tâm lý', question: 'Khi đọc tin "thị trường sắp sụp đổ", bạn phản ứng thế nào?',
    options: [{ text: 'Bán hết tài sản ngay lập tức', score: 10 }, { text: 'Lo lắng và giảm tỉ trọng đầu tư', score: 30 }, { text: 'Theo dõi thêm, không hành động vội', score: 65 }, { text: 'Bỏ qua, tập trung vào chiến lược dài hạn', score: 90 }] },
];

const RISK_META = {
  LOW:    { color: '#10b981', gradient: 'from-emerald-500 to-teal-400', icon: Shield,  label: 'Thận trọng'  },
  MEDIUM: { color: '#f59e0b', gradient: 'from-amber-500 to-orange-400', icon: Target,  label: 'Cân bằng'   },
  HIGH:   { color: '#ef4444', gradient: 'from-red-500 to-rose-400',     icon: Flame,   label: 'Mạo hiểm'   },
};

export default function RiskAssessmentPage() {
  const navigate     = useNavigate();
  const { setUser }  = useAuth() as any;
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<any[]>([]);
  const [result,  setResult]    = useState<any>(null);
  const [loading, setLoading]   = useState(false);

  const handleAnswer = async (option: any) => {
    const newAnswers = [...answers, { questionIndex: current, score: option.score }];
    setAnswers(newAnswers);
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      setLoading(true);
      try {
        const res = await investmentAPI.submitRiskAssessment({ answers: newAnswers });
        setResult(res.data.data);
        const profileRes = await userAPI.getProfile();
        setUser((prev: any) => ({ ...prev, ...profileRes.data.data.user }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  // ── Result Screen ──
  if (result) {
    const meta = RISK_META[result.riskLevel] || RISK_META.MEDIUM;
    const RiskIcon = meta.icon;
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto py-12">
        <div className="relative rounded-3xl p-8 border overflow-hidden text-center" style={{ background: 'var(--color-bg-card)', borderColor: `${meta.color}25`, boxShadow: `0 4px 40px ${meta.color}10` }}>
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: `linear-gradient(90deg,transparent,${meta.color}60,transparent)` }} />
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: `${meta.color}15`, boxShadow: `0 0 30px ${meta.color}30` }}>
            <RiskIcon size={40} style={{ color: meta.color }} />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-1">Kết quả đánh giá</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Dựa trên {QUESTIONS.length} câu trả lời của bạn</p>

          <div className="p-5 rounded-2xl mb-6" style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}>
            <p className={`text-4xl font-black bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent mb-2`}>{meta.label}</p>
            <p className="text-sm text-[var(--color-text-muted)]">Điểm rủi ro: <span className="font-black text-[var(--color-text-primary)]">{result.riskScore}/100</span></p>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">{result.riskDescription}</p>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/investment')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer">
              <TrendingUp size={15} /> Xem phân bổ đầu tư
            </button>
            <button onClick={() => { setCurrent(0); setAnswers([]); setResult(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-black text-sm hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer">
              <RefreshCw size={15} /> Làm lại
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const q        = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-4 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/8 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Target size={11} /> Đánh giá rủi ro
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Đánh giá mức độ rủi ro</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Trả lời {QUESTIONS.length} câu hỏi để xác định profile đầu tư phù hợp</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-[12px] font-bold mb-2">
          <span className="text-[var(--color-text-muted)]">Câu {current + 1}/{QUESTIONS.length}</span>
          <span className="text-blue-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.22 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          {q.category && (
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              {q.category}
            </span>
          )}
          <h2 className="text-[16px] font-black text-[var(--color-text-primary)] mb-6 leading-relaxed">{q.question}</h2>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={loading}
                className="w-full text-left p-4 rounded-2xl border transition-all group cursor-pointer hover:-translate-y-0.5"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center text-[12px] font-black text-[var(--color-text-muted)] shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)] font-medium">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
