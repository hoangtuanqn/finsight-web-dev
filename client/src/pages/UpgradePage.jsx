import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Check, X, Zap, Crown, Sparkles, 
  ArrowRight, ShieldCheck, ZapOff, 
  MessageSquare, BarChart3, Headphones, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../api/index.js';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    subtitle: 'Khởi đầu tài chính',
    price: '0đ',
    priceNum: 0,
    period: '/ tháng',
    description: 'Dành cho cá nhân mới bắt đầu quản lý nợ cơ bản.',
    icon: ZapOff,
    color: 'var(--color-text-muted)',
    gradient: 'from-slate-500/20 to-slate-400/10',
    features: [
      { text: 'Toàn bộ Debt Management (CRUD)', included: true },
      { text: 'Dashboard tổng quan (EAR, DTI)', included: true },
      { text: 'Payment Tracking & Notifications', included: true },
      { text: 'Chiến lược Avalanche / Snowball', included: true },
      { text: 'Chỉ số Fear & Greed thị trường', included: true },
      { text: 'Gợi ý phân bổ đầu tư', included: false },
      { text: 'AI Chatbot hỗ trợ', included: false },
      { text: 'OCR nhận diện chứng từ', included: false },
      { text: 'Xuất báo cáo PDF / Excel', included: false },
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    subtitle: 'Đầu tư thông minh',
    price: '49.000đ',
    priceNum: 49000,
    period: '/ tháng',
    description: 'Tối ưu danh mục và AI hỗ trợ hàng ngày.',
    icon: Zap,
    color: '#3b82f6',
    gradient: 'from-blue-600/30 to-cyan-500/10',
    popular: true,
    features: [
      { text: 'Toàn bộ tính năng gói Basic', included: true },
      { text: 'Gợi ý phân bổ danh mục đầu tư', included: true },
      { text: 'Market Alert cá nhân hóa', included: true },
      { text: 'AI Chatbot (10 câu / 5 tiếng)', included: true, highlight: '10 câu / 5h' },
      { text: 'OCR nhận diện (5 ảnh / tháng)', included: true, highlight: '5 ảnh / tháng' },
      { text: 'Ưu tiên cập nhật tính năng mới', included: true },
      { text: 'Xuất báo cáo PDF / Excel', included: false },
      { text: 'Hỗ trợ ưu tiên (Priority)', included: false },
    ],
  },
  {
    id: 'PROMAX',
    name: 'Pro Max',
    subtitle: 'Tự do tài chính',
    price: '99.000đ',
    priceNum: 99000,
    period: '/ tháng',
    description: 'Giải pháp toàn diện nhất cho nhà đầu tư chuyên nghiệp.',
    icon: Crown,
    color: '#f59e0b',
    gradient: 'from-amber-500/30 to-orange-400/10',
    features: [
      { text: 'Toàn bộ tính năng gói Pro', included: true },
      { text: 'AI Chatbot không giới hạn', included: true, highlight: 'Vô hạn' },
      { text: 'OCR nhận diện không giới hạn', included: true, highlight: 'Vô hạn' },
      { text: 'Xuất báo cáo PDF / Excel (Full)', included: true },
      { text: 'Hỗ trợ ưu tiên 24/7', included: true },
      { text: 'Tư vấn 1-1 với chuyên gia AI', included: true },
      { text: 'Tính năng Beta độc quyền', included: true },
    ],
  },
];

const LEVEL_RANKS = {
  BASIC: 0,
  PRO: 1,
  PROMAX: 2
};

export default function UpgradePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState('BASIC');
  const [levelExpiresAt, setLevelExpiresAt] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    subscriptionAPI.getMyPlan().then(res => {
      const data = res.data?.data;
      if (data) {
        setCurrentLevel(data.level || 'BASIC');
        setLevelExpiresAt(data.levelExpiresAt);
      }
    }).catch(() => {});
  }, []);

  const handleUpgrade = async (planId) => {
    // Block if same level or lower level
    if (LEVEL_RANKS[planId] <= LEVEL_RANKS[currentLevel]) {
      toast.error('Bạn đã ở cấp độ này hoặc cao hơn.');
      return;
    }
    
    setLoadingPlan(planId);
    try {
      const res = await subscriptionAPI.createInvoice(planId);
      const tx = res.data?.data?.transaction;
      if (tx) {
        navigate(`/invoice/${tx.id}`);
      }
    } catch (err) {
      toast.error('Không thể tạo hóa đơn. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonConfig = (plan) => {
    if (plan.id === currentLevel) {
      return { text: 'Gói hiện tại', disabled: true, className: 'bg-emerald-500/10 text-emerald-500 cursor-not-allowed border-emerald-500/20' };
    }
    
    if (LEVEL_RANKS[plan.id] < LEVEL_RANKS[currentLevel]) {
      return { text: 'Cấp độ thấp hơn', disabled: true, className: 'bg-slate-800/50 text-slate-400 cursor-not-allowed' };
    }

    if (plan.id === 'BASIC') {
      return { text: 'Gói miễn phí', disabled: true, className: 'bg-slate-800/50 text-slate-400 cursor-not-allowed' };
    }
    
    if (plan.id === 'PROMAX') {
      return { text: 'Trải nghiệm tối đa', disabled: false, className: 'btn-primary bg-gradient-to-r from-amber-500 to-orange-600 border-none' };
    }
    return { text: 'Nâng cấp ngay', disabled: false, className: 'btn-primary' };
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6"
          >
            <Sparkles size={14} />
            <span>MỞ KHÓA SỨC MẠNH TÀI CHÍNH</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
          >
            Chọn gói <span className="text-gradient">phù hợp</span> với bạn
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto"
          >
            Đầu tư vào kiến thức và công cụ là cách ngắn nhất để thoát khỏi gánh nặng nợ nần. 
            Nâng cấp để nhận được sự hỗ trợ từ trí tuệ nhân tạo.
          </motion.p>

          {currentLevel !== 'BASIC' && levelExpiresAt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold"
            >
              <Crown size={14} />
              <span>Đang dùng {currentLevel} · Hết hạn {new Date(levelExpiresAt).toLocaleDateString('vi-VN')}</span>
            </motion.div>
          )}
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {PLANS.map((plan, index) => {
            const btn = getButtonConfig(plan);
            const isLoading = loadingPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 3) }}
                whileHover={{ y: -8 }}
                className={`relative glass-card flex flex-col h-full border-2 ${
                  plan.popular ? 'border-blue-500/40' : plan.id === currentLevel ? 'border-emerald-500/40' : 'border-[var(--color-border)]'
                }`}
              >
                {plan.popular && plan.id !== currentLevel && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/40">
                    Phổ biến nhất
                  </div>
                )}
                {plan.id === currentLevel && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/40">
                    Đang sử dụng
                  </div>
                )}

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6`}>
                  <plan.icon size={28} style={{ color: plan.color }} />
                </div>

                <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-6 font-medium">{plan.subtitle}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-[var(--color-text-muted)] text-sm">{plan.period}</span>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] mb-8 h-10 overflow-hidden leading-relaxed">
                  {plan.description}
                </p>

                <div className="flex-1 space-y-4 mb-10">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                      ) : (
                        <X size={18} className="text-rose-500/40 mt-0.5 shrink-0" />
                      )}
                      <p className={`text-sm ${feature.included ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)] italic'}`}>
                        {feature.text}
                        {feature.highlight && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                            {feature.highlight}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 group ${btn.className}`}
                  disabled={btn.disabled || isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : btn.text}
                  {!btn.disabled && !isLoading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'Bảo mật tuyệt đối', desc: 'Dữ liệu của bạn được mã hóa chuẩn ngân hàng.' },
            { icon: BarChart3, title: 'Phân tích đa chiều', desc: 'Nhìn thấu mọi ngóc ngách của dòng tiền.' },
            { icon: MessageSquare, title: 'AI đồng hành', desc: 'Có chuyên gia tài chính bên cạnh 24/7.' },
            { icon: Headphones, title: 'Hỗ trợ tận tâm', desc: 'Chúng tôi luôn sẵn sàng khi bạn cần.' },
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
            >
              <benefit.icon size={24} className="text-blue-500 mb-4" />
              <h3 className="font-bold text-sm mb-2">{benefit.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
