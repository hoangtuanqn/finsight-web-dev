import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Rocket, Eye, CreditCard, Drama, BrainCircuit, Zap, Snowflake,
  BarChart3, Map, Bot, AlertTriangle, Mail, Target, TrendingUp,
  ShieldCheck, Moon, FileEdit, Sparkles, Check, User, GraduationCap,
  Briefcase, BookOpen, Heart, ChevronDown
} from 'lucide-react';
import heroMockup from '../assets/hero-mockup.png';
import featureCards from '../assets/feature-cards.png';

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = '', duration = 2 }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;
    const val = { v: 0 };
    const ctrl = animate(val.v, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(typeof target === 'number' && target % 1 === 0 ? Math.round(v).toString() : v.toFixed(1)),
    });
    return () => ctrl.stop();
  }, [isInView, target, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── Section wrapper with scroll animation ─── */
function Section({ children, className = '', id, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
      className={`landing-section ${className}`}
    >
      {children}
    </motion.section>
  );
}

/* ─── Stagger children wrapper ─── */
function StaggerGroup({ children, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

/* ─── FAQ Accordion ─── */
const faqData = [
  {
    q: 'FinSight có thực sự miễn phí không?',
    a: 'Hoàn toàn miễn phí. FinSight không có gói premium, không ẩn phí, không quảng cáo. Mọi tính năng đều mở cho tất cả người dùng.',
  },
  {
    q: 'EAR là gì và tại sao nó quan trọng?',
    a: 'EAR (Effective Annual Rate) là lãi suất thực tế hàng năm, bao gồm cả phí bảo hiểm, phí quản lý, phí hồ sơ... mà các nền tảng thường không hiển thị rõ. Biết EAR giúp bạn so sánh chính xác chi phí vay giữa các nền tảng.',
  },
  {
    q: 'Avalanche và Snowball khác nhau thế nào?',
    a: 'Avalanche ưu tiên trả khoản nợ có lãi suất cao nhất trước → tiết kiệm tiền lãi nhiều hơn. Snowball ưu tiên trả khoản nợ nhỏ nhất trước → tạo động lực tâm lý khi "xoá" nhanh từng khoản. FinSight mô phỏng cả hai để bạn chọn.',
  },
  {
    q: 'Dữ liệu tài chính của tôi có an toàn không?',
    a: 'Có. Mật khẩu được mã hóa bằng bcrypt, xác thực qua JWT token. Dữ liệu lưu trên database riêng, không chia sẻ với bên thứ ba. Bạn có toàn quyền xóa tài khoản và dữ liệu bất kỳ lúc nào.',
  },
  {
    q: 'Chỉ số Fear & Greed Index hoạt động như thế nào?',
    a: 'Fear & Greed Index đo lường tâm lý thị trường từ 0 (Sợ hãi cực độ) đến 100 (Tham lam cực độ). FinSight sử dụng chỉ số này kết hợp với hồ sơ rủi ro của bạn để tự động đề xuất tỷ lệ phân bổ tài sản phù hợp.',
  },
  {
    q: 'Tôi cần kiến thức tài chính để sử dụng FinSight không?',
    a: 'Không cần. FinSight được thiết kế cho người mới bắt đầu. Chỉ cần nhập thông tin khoản nợ, hệ thống sẽ tự phân tích và gợi ý chiến lược tối ưu bằng ngôn ngữ dễ hiểu.',
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="faq-list">
      {faqData.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <motion.div
            key={i}
            className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}
            initial={false}
          >
            <button
              className="faq-question"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="faq-chevron"
              >
                <ChevronDown size={20} />
              </motion.span>
            </button>
            <motion.div
              className="faq-answer-wrapper"
              initial={false}
              animate={{
                height: isOpen ? 'auto' : 0,
                opacity: isOpen ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <p className="faq-answer">{item.a}</p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── NAVIGATION BAR ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">F</div>
            <span className="text-gradient landing-logo-text">FinSight</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Tính năng</a>
            <a href="#how-it-works" className="landing-nav-link">Hướng dẫn</a>
            <Link to="/login" className="landing-nav-link">Đăng nhập</Link>
            <Link to="/register" className="btn-primary landing-nav-cta">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════ */}
      <section className="landing-hero">
        {/* Animated background elements */}
        <div className="hero-bg-glow hero-bg-glow-1" />
        <div className="hero-bg-glow hero-bg-glow-2" />
        <div className="hero-bg-glow hero-bg-glow-3" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`hero-particle hero-particle-${i + 1}`} />
        ))}

        <div className="hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span>Miễn phí • Quản lý tài chính AI</span>
            </div>

            <h1 className="hero-headline">
              Biến <span className="text-gradient">khoản nợ của bạn </span>
              <br />thành kế hoạch.
              <br />Biến lo lắng thành <span className="text-gradient">tự tin.</span>
            </h1>

            <p className="hero-subtitle">
              FinSight giúp bạn nhìn rõ chi phí ẩn trong mỗi khoản nợ, lên chiến lược trả nợ tối ưu,
              và nhận tư vấn đầu tư dựa trên tâm lý thị trường thực tế.
            </p>

            <div className="hero-cta-group">
              <Link to="/register" className="btn-primary hero-cta-primary">
                <Rocket size={18} /> Bắt đầu miễn phí
              </Link>
              <Link to="/login" className="btn-secondary hero-cta-secondary">
                 Xem Demo
              </Link>
            </div>

            <div className="hero-trust">
              <div className="hero-trust-avatars">
                {[Briefcase, User, GraduationCap, BookOpen].map((Icon, i) => (
                  <div key={i} className="hero-trust-avatar" style={{ zIndex: 4 - i }}><Icon size={16} /></div>
                ))}
              </div>
              <span className="hero-trust-text">Được tin dùng bởi sinh viên & giới trẻ khắp Việt Nam</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="hero-mockup-wrapper">
              <img src={heroMockup} alt="FinSight Dashboard" className="hero-mockup-img" />
              <div className="hero-mockup-glow" />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="hero-scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 2 — PAIN POINTS
      ══════════════════════════════════════ */}
      <Section id="problems">
        <div className="section-header">
          <span className="section-tag">Vấn đề</span>
          <h2 className="section-title">Bạn đang gặp <span className="text-gradient">vấn đề này</span>?</h2>
          <p className="section-desc">Hàng triệu người trẻ Việt Nam đang vật lộn với nợ tiêu dùng mà không nhận ra chi phí thực sự.</p>
        </div>

        <StaggerGroup className="pain-grid">
          {[
            {
              icon: CreditCard,
              title: 'Nợ ở khắp nơi',
              desc: 'SPayLater, LazPayLater, Credit Card, MoMo... mỗi app một ngày đáo hạn, không ai theo dõi nổi.',
              color: '#ef4444',
            },
            {
              icon: Drama,
              title: 'Lãi suất quảng cáo ≠ Chi phí thật',
              desc: 'APR 18% nhưng EAR thực tế 28%+ khi cộng phí bảo hiểm, phí quản lý, phí hồ sơ ẩn.',
              color: '#f59e0b',
            },
            {
              icon: BrainCircuit,
              title: 'Muốn đầu tư nhưng sợ mất tiền',
              desc: 'Không biết phân bổ tài sản thế nào, mua vàng hay crypto, thị trường lên hay xuống?',
              color: '#8b5cf6',
            },
          ].map((item) => (
            <motion.div key={item.title} variants={fadeUp} className="pain-card">
              <div className="pain-card-icon" style={{ background: `${item.color}15`, color: item.color }}>
                <item.icon size={28} />
              </div>
              <h3 className="pain-card-title">{item.title}</h3>
              <p className="pain-card-desc">{item.desc}</p>
              <div className="pain-card-accent" style={{ background: item.color }} />
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>

      {/* ══════════════════════════════════════
          SECTION 3 — CORE FEATURES SHOWCASE
      ══════════════════════════════════════ */}
      <Section id="features">
        <div className="section-header">
          <span className="section-tag">Giải pháp</span>
          <h2 className="section-title">Tính năng <span className="text-gradient">nổi bật</span></h2>
          <p className="section-desc">FinSight mang đến bộ công cụ tài chính thông minh, giúp bạn kiểm soát mọi khoản nợ và ra quyết định đầu tư sáng suốt.</p>
        </div>

        {/* Feature 1 — EAR Analysis */}
        <div className="feature-showcase">
          <motion.div
            className="feature-showcase-visual"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-visual-card">
              <div className="feature-visual-header">
                <div className="feature-visual-dot" style={{ background: '#ef4444' }} />
                <div className="feature-visual-dot" style={{ background: '#f59e0b' }} />
                <div className="feature-visual-dot" style={{ background: '#10b981' }} />
              </div>
              <div className="feature-chart-mock">
                <div className="feature-bar-group">
                  <div className="feature-bar-label">SPayLater</div>
                  <div className="feature-bars">
                    <div className="feature-bar" style={{ width: '60%', background: '#3b82f6' }}>
                      <span>APR 18%</span>
                    </div>
                    <div className="feature-bar" style={{ width: '85%', background: '#ef4444' }}>
                      <span>EAR 28.4%</span>
                    </div>
                  </div>
                </div>
                <div className="feature-bar-group">
                  <div className="feature-bar-label">Credit Card</div>
                  <div className="feature-bars">
                    <div className="feature-bar" style={{ width: '75%', background: '#3b82f6' }}>
                      <span>APR 24%</span>
                    </div>
                    <div className="feature-bar" style={{ width: '95%', background: '#ef4444' }}>
                      <span>EAR 31.2%</span>
                    </div>
                  </div>
                </div>
                <div className="feature-bar-group">
                  <div className="feature-bar-label">MoMo Vay</div>
                  <div className="feature-bars">
                    <div className="feature-bar" style={{ width: '55%', background: '#3b82f6' }}>
                      <span>APR 15%</span>
                    </div>
                    <div className="feature-bar" style={{ width: '70%', background: '#ef4444' }}>
                      <span>EAR 22.1%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="feature-chart-legend">
                <span><i style={{ background: '#3b82f6' }} /> APR (quảng cáo)</span>
                <span><i style={{ background: '#ef4444' }} /> EAR (thực tế)</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-showcase-text"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-number">01</div>
            <h3 className="feature-title"><BarChart3 size={22} className="inline-block mr-2 -mt-1" style={{ color: '#3b82f6' }} />Phân tích EAR — Nhìn xuyên chi phí ẩn</h3>
            <p className="feature-desc">
              FinSight tính chính xác <strong>lãi suất thực tế (EAR)</strong> bao gồm phí bảo hiểm,
              phí quản lý, phí hồ sơ... cho mỗi khoản nợ. Không còn bị "đánh lừa" bởi con số APR hào nhoáng.
            </p>
            <ul className="feature-bullets">
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Tách biệt APR quảng cáo vs EAR thực tế</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Phân tích chi phí ẩn từng nền tảng</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Dashboard trực quan so sánh mọi khoản nợ</li>
            </ul>
          </motion.div>
        </div>

        {/* Feature 2 — Repayment Plan (reversed) */}
        <div className="feature-showcase feature-showcase-reverse">
          <motion.div
            className="feature-showcase-visual"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-visual-card">
              <div className="feature-visual-header">
                <div className="feature-visual-dot" style={{ background: '#ef4444' }} />
                <div className="feature-visual-dot" style={{ background: '#f59e0b' }} />
                <div className="feature-visual-dot" style={{ background: '#10b981' }} />
              </div>
              <div className="feature-repayment-mock">
                <div className="repay-method">
                  <div className="repay-method-header">
                    <span className="repay-icon"><Zap size={24} /></span>
                    <div>
                      <div className="repay-name">Avalanche</div>
                      <div className="repay-sub">Ưu tiên lãi cao nhất</div>
                    </div>
                  </div>
                  <div className="repay-stats">
                    <div><span className="repay-stat-label">Thời gian</span><span className="repay-stat-value" style={{ color: '#10b981' }}>18 tháng</span></div>
                    <div><span className="repay-stat-label">Tiết kiệm</span><span className="repay-stat-value" style={{ color: '#3b82f6' }}>2.4 triệu</span></div>
                  </div>
                </div>
                <div className="repay-vs">VS</div>
                <div className="repay-method repay-method-alt">
                  <div className="repay-method-header">
                    <span className="repay-icon"><Snowflake size={24} /></span>
                    <div>
                      <div className="repay-name">Snowball</div>
                      <div className="repay-sub">Ưu tiên số dư nhỏ</div>
                    </div>
                  </div>
                  <div className="repay-stats">
                    <div><span className="repay-stat-label">Thời gian</span><span className="repay-stat-value" style={{ color: '#f59e0b' }}>22 tháng</span></div>
                    <div><span className="repay-stat-label">Tiết kiệm</span><span className="repay-stat-value" style={{ color: '#3b82f6' }}>1.8 triệu</span></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-showcase-text"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-number">02</div>
            <h3 className="feature-title"><Map size={22} className="inline-block mr-2 -mt-1" style={{ color: '#10b981' }} />Kế hoạch trả nợ tối ưu</h3>
            <p className="feature-desc">
              So sánh hai chiến lược <strong>Avalanche</strong> (ưu tiên lãi cao) và <strong>Snowball</strong> (ưu tiên nợ nhỏ),
              xem tiết kiệm được bao nhiêu tiền lãi và rút ngắn bao nhiêu tháng trả nợ.
            </p>
            <ul className="feature-bullets">
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Mô phỏng chi tiết từng tháng</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> So sánh trực quan 2 chiến lược</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Tự động đề xuất phương án tối ưu</li>
            </ul>
          </motion.div>
        </div>

        {/* Feature 3 — AI Investment */}
        <div className="feature-showcase">
          <motion.div
            className="feature-showcase-visual"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <div className="feature-visual-card">
              <div className="feature-visual-header">
                <div className="feature-visual-dot" style={{ background: '#ef4444' }} />
                <div className="feature-visual-dot" style={{ background: '#f59e0b' }} />
                <div className="feature-visual-dot" style={{ background: '#10b981' }} />
              </div>
              <div className="feature-ai-mock">
                <div className="ai-gauge">
                  <svg viewBox="0 0 120 120" className="ai-gauge-svg">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="10"
                      strokeLinecap="round" strokeDasharray="157 314"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                  </svg>
                  <div className="ai-gauge-label">
                    <span className="ai-gauge-value">42</span>
                    <span className="ai-gauge-text">Sợ hãi</span>
                  </div>
                </div>
                <div className="ai-allocation">
                  {[
                    { label: 'Tiết kiệm', pct: 35, color: '#3b82f6' },
                    { label: 'Vàng', pct: 25, color: '#f59e0b' },
                    { label: 'Cổ phiếu', pct: 20, color: '#10b981' },
                    { label: 'Trái phiếu', pct: 15, color: '#8b5cf6' },
                    { label: 'Crypto', pct: 5, color: '#06b6d4' },
                  ].map((a) => (
                    <div key={a.label} className="ai-alloc-row">
                      <div className="ai-alloc-label">
                        <i style={{ background: a.color }} />{a.label}
                      </div>
                      <div className="ai-alloc-bar-bg">
                        <div className="ai-alloc-bar" style={{ width: `${a.pct}%`, background: a.color }} />
                      </div>
                      <span className="ai-alloc-pct">{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="feature-showcase-text"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="feature-number">03</div>
            <h3 className="feature-title"><Bot size={22} className="inline-block mr-2 -mt-1" style={{ color: '#8b5cf6' }} />Tư vấn đầu tư AI — Theo tâm lý thị trường</h3>
            <p className="feature-desc">
              Engine phân bổ tài sản <strong>tự động điều chỉnh</strong> dựa trên chỉ số Fear & Greed Index thực tế
              và hồ sơ rủi ro cá nhân của bạn.
            </p>
            <ul className="feature-bullets">
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Chỉ số tâm lý thị trường real-time</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Phân bổ 5 loại tài sản tự động</li>
              <li><Check size={16} className="shrink-0" style={{ color: '#10b981' }} /> Đánh giá khẩu vị rủi ro cá nhân</li>
            </ul>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════════════════════════════
          SECTION 4 — FEATURE GRID
      ══════════════════════════════════════ */}
      <Section>
        <div className="section-header">
          <span className="section-tag">Và còn nhiều hơn</span>
          <h2 className="section-title">Mọi thứ bạn cần, <span className="text-gradient">một nơi duy nhất</span></h2>
        </div>

        <StaggerGroup className="feature-grid">
          {[
            { icon: AlertTriangle, title: 'Cảnh báo Domino Risk', desc: 'Phát hiện nguy cơ vỡ nợ dây chuyền khi nhiều khoản đáo hạn cùng lúc.', color: '#ef4444' },
            { icon: Mail, title: 'Email tự động', desc: 'Nhắc thanh toán trước 3 ngày, không bao giờ quên trả nợ nữa.', color: '#06b6d4' },
            { icon: Target, title: 'Đánh giá rủi ro', desc: '5 câu hỏi nhanh xác định khẩu vị đầu tư phù hợp với bạn.', color: '#8b5cf6' },
            { icon: TrendingUp, title: 'Thị trường real-time', desc: 'Bitcoin, VN-Index, Vàng SJC — cập nhật liên tục.', color: '#10b981' },
            { icon: ShieldCheck, title: 'Bảo mật chặt chẽ', desc: 'JWT + bcrypt encryption, dữ liệu của bạn chỉ thuộc về bạn.', color: '#3b82f6' },
            { icon: Moon, title: 'Giao diện Premium', desc: 'Dark mode, glassmorphism, animations mượt mà — đẹp từ pixel đầu tiên.', color: '#f59e0b' },
          ].map((item) => (
            <motion.div key={item.title} variants={fadeUp} className="mini-feature-card">
              <div className="mini-feature-icon" style={{ background: `${item.color}12`, color: item.color }}>
                <item.icon size={24} />
              </div>
              <h4 className="mini-feature-title">{item.title}</h4>
              <p className="mini-feature-desc">{item.desc}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>

      {/* ══════════════════════════════════════
          SECTION — FAQ
      ══════════════════════════════════════ */}
      <Section id="faq">
        <div className="section-header">
          <span className="section-tag">Câu hỏi thường gặp</span>
          <h2 className="section-title">Bạn thắc mắc? <span className="text-gradient">Chúng tôi giải đáp</span></h2>
          <p className="section-desc">Những câu hỏi phổ biến nhất về FinSight.</p>
        </div>

        <FAQAccordion />
      </Section>

      {/* ══════════════════════════════════════
          SECTION 5 — SOCIAL PROOF / COUNTERS
      ══════════════════════════════════════ */}
      <Section className="landing-section-alt">
        <StaggerGroup className="counter-grid">
          {[
            { value: 6, suffix: '+', label: 'Nền tảng vay được hỗ trợ', sub: 'SPayLater, Lazada, Credit Card...' },
            { value: 100, suffix: '%', label: 'Miễn phí hoàn toàn', sub: 'Không ẩn phí, không premium' },
            { value: 5, suffix: ' phút', label: 'Để bắt đầu', sub: 'Đăng ký → Nhập nợ → Xong!' },
          ].map((item) => (
            <motion.div key={item.label} variants={fadeUp} className="counter-card">
              <div className="counter-value">
                <AnimatedCounter target={item.value} suffix={item.suffix} />
              </div>
              <div className="counter-label">{item.label}</div>
              <div className="counter-sub">{item.sub}</div>
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>

      {/* ══════════════════════════════════════
          SECTION 6 — HOW IT WORKS
      ══════════════════════════════════════ */}
      <Section id="how-it-works">
        <div className="section-header">
          <span className="section-tag">3 bước đơn giản</span>
          <h2 className="section-title">Bắt đầu <span className="text-gradient">dễ dàng</span></h2>
          <p className="section-desc">Không cần kiến thức tài chính, FinSight lo hết.</p>
        </div>

        <StaggerGroup className="steps-grid">
          {[
            {
              step: '01',
              icon: FileEdit,
              title: 'Nhập khoản nợ',
              desc: 'Thêm các khoản BNPL, credit card, vay tiêu dùng. FinSight tự tính toán tất cả.',
              color: '#3b82f6',
            },
            {
              step: '02',
              icon: BarChart3,
              title: 'Xem phân tích & kế hoạch',
              desc: 'Dashboard tổng quan, EAR thực tế, kế hoạch trả nợ tối ưu, tư vấn đầu tư AI.',
              color: '#10b981',
            },
            {
              step: '03',
              icon: Rocket,
              title: 'Hành động & theo dõi',
              desc: 'Trả nợ theo kế hoạch, nhận cảnh báo tự động, tái phân bổ đầu tư khi thị trường đổi.',
              color: '#8b5cf6',
            },
          ].map((item, i) => (
            <motion.div key={item.step} variants={fadeUp} className="step-card">
              <div className="step-number" style={{ color: item.color }}>{item.step}</div>
              <div className="step-icon" style={{ background: `${item.color}15`, color: item.color }}>
                <item.icon size={32} />
              </div>
              <h4 className="step-title">{item.title}</h4>
              <p className="step-desc">{item.desc}</p>
              {i < 2 && <div className="step-connector" />}
            </motion.div>
          ))}
        </StaggerGroup>
      </Section>

      {/* ══════════════════════════════════════
          SECTION 7 — FINAL CTA
      ══════════════════════════════════════ */}
      <section className="landing-cta-final">
        <div className="cta-final-bg" />
        <motion.div
          className="cta-final-content"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="cta-final-title">
            Sẵn sàng <span className="text-gradient">kiểm soát</span> tài chính?
          </h2>
          <p className="cta-final-desc">
            Đừng để nợ kiểm soát bạn. Hàng ngàn người trẻ đã bắt đầu hành trình tài chính thông minh với FinSight.
          </p>
          <div className="cta-final-buttons">
            <Link to="/register" className="btn-primary hero-cta-primary">
              <Sparkles size={18} /> Đăng ký miễn phí ngay
            </Link>
            <Link to="/login" className="btn-secondary hero-cta-secondary">
              Dùng thử với tài khoản Demo
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon">F</div>
              <span className="text-gradient landing-logo-text">FinSight</span>
            </div>
            <p className="footer-tagline">Quản lý nợ thông minh. Đầu tư tự tin.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Tính năng</a>
            <a href="#how-it-works">Cách dùng</a>
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </div>
          <div className="footer-copy">
            © 2026 FinSight — WDA2026 Contest. Made with <Heart size={14} className="inline-block mx-1" style={{ color: '#3b82f6', fill: '#3b82f6' }} /> in Vietnam.
          </div>
        </div>
      </footer>
    </div>
  );
}
