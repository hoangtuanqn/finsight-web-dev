import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { investmentAPI } from '../api/index.js';

const QUESTIONS = [
  {
    question: 'Nếu danh mục đầu tư giảm 20% trong 1 tháng, bạn sẽ?',
    options: [
      { text: 'Bán hết để cắt lỗ', score: 10 },
      { text: 'Bán một phần, giữ phần còn lại', score: 30 },
      { text: 'Giữ nguyên và chờ đợi', score: 60 },
      { text: 'Mua thêm vì đây là cơ hội', score: 90 },
    ],
  },
  {
    question: 'Mục tiêu đầu tư chính của bạn là gì?',
    options: [
      { text: 'Bảo toàn vốn, không muốn mất tiền', score: 15 },
      { text: 'Thu nhập ổn định hàng tháng', score: 35 },
      { text: 'Tăng trưởng vốn dài hạn', score: 65 },
      { text: 'Tối đa hóa lợi nhuận, chấp nhận biến động lớn', score: 90 },
    ],
  },
  {
    question: 'Khoảng thời gian đầu tư dự kiến?',
    options: [
      { text: 'Dưới 1 năm', score: 15 },
      { text: '1-3 năm', score: 40 },
      { text: '3-5 năm', score: 65 },
      { text: 'Trên 5 năm', score: 85 },
    ],
  },
  {
    question: 'Bạn có kinh nghiệm đầu tư tài chính không?',
    options: [
      { text: 'Chưa bao giờ đầu tư', score: 10 },
      { text: 'Chỉ gửi tiết kiệm ngân hàng', score: 30 },
      { text: 'Đã đầu tư chứng khoán/vàng', score: 60 },
      { text: 'Đầu tư đa dạng (crypto, CK, BĐS...)', score: 85 },
    ],
  },
  {
    question: 'Tỉ lệ thu nhập bạn sẵn sàng đầu tư?',
    options: [
      { text: 'Dưới 10% — chỉ dư thì mới đầu tư', score: 15 },
      { text: '10-20% — dành riêng mỗi tháng', score: 40 },
      { text: '20-40% — đầu tư là ưu tiên', score: 65 },
      { text: 'Trên 40% — all-in', score: 90 },
    ],
  },
];

export default function RiskAssessmentPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (option) => {
    const newAnswers = [...answers, { questionIndex: current, score: option.score }];
    setAnswers(newAnswers);

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      setLoading(true);
      try {
        const res = await investmentAPI.submitRiskAssessment({ answers: newAnswers });
        setResult(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRiskColor = (level) => {
    if (level === 'LOW') return '#10b981';
    if (level === 'MEDIUM') return '#f59e0b';
    return '#ef4444';
  };

  const getRiskLabel = (level) => {
    if (level === 'LOW') return 'Thận trọng';
    if (level === 'MEDIUM') return 'Cân bằng';
    return 'Mạo hiểm';
  };

  const getRiskEmoji = (level) => {
    if (level === 'LOW') return '🛡️';
    if (level === 'MEDIUM') return '⚖️';
    return '🔥';
  };

  // Result screen
  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto py-12">
        <div className="glass-card text-center">
          <span className="text-6xl block mb-5">{getRiskEmoji(result.riskLevel)}</span>
          <h2 className="text-xl font-bold text-white mb-1">Kết quả đánh giá</h2>
          <p className="text-sm text-slate-500 mb-6">Dựa trên {QUESTIONS.length} câu trả lời của bạn</p>

          <div className="bg-white/[0.03] rounded-xl p-6 mb-6">
            <p className="text-3xl font-bold mb-1" style={{ color: getRiskColor(result.riskLevel) }}>
              {getRiskLabel(result.riskLevel)}
            </p>
            <p className="text-sm text-slate-500">Điểm rủi ro: <span className="font-semibold text-white">{result.riskScore}/100</span></p>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mb-8">{result.riskDescription}</p>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/investment')} className="btn-primary">
              📈 Xem phân bổ đầu tư
            </button>
            <button onClick={() => { setCurrent(0); setAnswers([]); setResult(null); }} className="btn-secondary">
              🔄 Làm lại
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-4">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">🎯 Đánh giá mức độ rủi ro</h1>
        <p className="text-slate-500 text-sm mt-1">Trả lời {QUESTIONS.length} câu hỏi để xác định profile đầu tư phù hợp</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-[12px] text-slate-500 mb-2">
          <span>Câu {current + 1}/{QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="glass-card"
        >
          <h2 className="text-[16px] font-semibold text-white mb-6 leading-relaxed">{q.question}</h2>
          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={loading}
                className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-blue-500/8 hover:border-blue-500/20 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[12px] text-slate-500 group-hover:bg-blue-500/15 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all font-medium">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
