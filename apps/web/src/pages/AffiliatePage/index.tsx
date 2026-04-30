import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, MousePointerClick, Gift, Copy, CheckCircle2,
  Clock, Share2, Sparkles, Target, TrendingUp, Banknote,
} from 'lucide-react';
import { useAffiliateQuery } from '../../hooks/useAffiliateQuery';
import CommissionTab from './components/CommissionTab';
import WithdrawalTab from './components/WithdrawalTab';

const SUMMARY_CARDS = (stats: any) => [
  {
    label: 'Lượt nhấp link',
    value: stats?.clicks || 0,
    icon: MousePointerClick,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-400',
    desc: 'Số người đã nhấn vào link',
  },
  {
    label: 'Đã giới thiệu',
    value: stats?.totalReferrals || 0,
    icon: Users,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
    desc: 'Số người đã đăng ký tài khoản',
  },
  {
    label: 'Đã nhận thưởng',
    value: stats?.completedReferrals || 0,
    icon: Gift,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-400',
    desc: 'Số người đủ điều kiện nhận thưởng',
  },
  {
    label: 'Tỷ lệ chuyển đổi',
    value:
      stats?.clicks > 0
        ? ((stats.totalReferrals / stats.clicks) * 100).toFixed(1) + '%'
        : '0%',
    icon: Target,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-400',
    desc: 'Hiệu quả của link giới thiệu',
  },
];

const TABS = [
  { id: 'overview',    label: 'Tổng quan',   icon: Share2,     color: '#3b82f6' },
  { id: 'commissions', label: 'Hoa hồng',    icon: TrendingUp, color: '#10b981' },
  { id: 'withdrawal',  label: 'Rút tiền',    icon: Banknote,   color: '#f59e0b' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AffiliatePage() {
  const { data, isLoading } = useAffiliateQuery();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const referralCode = data?.referralCode;
  const referralLink = `${window.location.origin}/register?ref=${referralCode || ''}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-8">

      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} /> Hệ thống Affiliate
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
          Giới thiệu bạn bè
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base mt-2">
          Nhận <strong className="text-emerald-500">{parseFloat(import.meta.env.VITE_COMMISSION_RATE || '10')}% hoa hồng vĩnh viễn</strong> mỗi lần người được giới thiệu nâng cấp gói.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS(data?.stats).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-3xl p-6 border overflow-hidden hover:shadow-xl transition-all duration-300"
            style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}25`, boxShadow: `0 4px 24px ${item.color}08` }}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: item.color }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{item.label}</p>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <p className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-tight`}>
              {item.value}
            </p>
            <p className="text-[10px] mt-2 font-semibold text-[var(--color-text-muted)] italic">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-6 border-b border-[var(--color-border)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 flex items-center gap-2 text-[15px] font-bold transition-all ${
                isActive ? '' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              style={{ color: isActive ? tab.color : undefined }}
            >
              <tab.icon size={18} />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="affiliate-tab-underline"
                  className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full"
                  style={{ backgroundColor: tab.color }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-bg-card)] p-7 rounded-[32px] border border-[var(--color-border)] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl"><Share2 className="w-5 h-5 text-blue-500" /></div>
                <h2 className="text-lg font-black text-[var(--color-text-primary)]">Link giới thiệu cá nhân</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-4 rounded-2xl font-mono text-sm break-all text-[var(--color-text-primary)] font-bold">
                  {referralLink}
                </div>
                <button
                  onClick={() => handleCopy(referralLink)}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Đã copy' : 'Sao chép'}
                </button>
              </div>

              <div className="mt-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><TrendingUp size={20} /></div>
                <div>
                  <p className="font-black text-sm text-[var(--color-text-primary)]">Hoa hồng vĩnh viễn 10%</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium leading-relaxed">
                    Mỗi khi người bạn giới thiệu nâng cấp hoặc gia hạn gói PRO / Pro Max, bạn sẽ nhận ngay 10% giá trị giao dịch. Không giới hạn số lần, vĩnh viễn.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-[24px] border border-[var(--color-border)] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)]">Chi tiết người được mời</h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest bg-[var(--color-bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                  <Clock size={12} className="text-blue-500" /> Tự động cập nhật
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)]">
                      <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Người dùng</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Hoạt động</th>
                      <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {!data?.referrals?.length ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-16 text-center">
                          <Users className="w-10 h-10 text-[var(--color-text-muted)] opacity-20 mx-auto mb-3" />
                          <p className="text-[var(--color-text-muted)] font-bold text-sm italic">Bạn chưa mời ai tham gia.</p>
                        </td>
                      </tr>
                    ) : (
                      data.referrals.map((ref: any) => (
                        <tr key={ref.id} className="group hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/10">
                                {ref.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-black text-sm text-[var(--color-text-primary)]">{ref.name}</span>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">{ref.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5 min-w-[130px] mx-auto">
                              <div className="flex justify-between w-full text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">
                                <span>Tích lũy</span>
                                <span className={ref.activeDays >= 3 ? 'text-emerald-500' : 'text-blue-500'}>{ref.activeDays}/3 ngày</span>
                              </div>
                              <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-700 ${ref.activeDays >= 3 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min((ref.activeDays / 3) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {ref.status === 'REWARDED' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
                                <Gift className="w-3.5 h-3.5" /> Đã nhận quà
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[var(--color-text-muted)] italic">Chờ đủ điều kiện</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-7 rounded-[32px] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              <h3 className="text-base font-black flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Cơ chế hoa hồng
              </h3>
              <div className="space-y-4">
                {[
                  { plan: 'PRO', price: '49.000đ', commission: '4.900đ', color: '#3b82f6' },
                  { plan: 'Pro Max', price: '99.000đ', commission: '9.900đ', color: '#f59e0b' },
                ].map((item) => (
                  <div key={item.plan} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-black" style={{ color: item.color }}>{item.plan}</p>
                      <p className="text-[11px] text-slate-400">{item.price} / tháng</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-400">+{item.commission}</p>
                      <p className="text-[10px] text-slate-500">10% hoa hồng</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-medium">
                Hoa hồng được cộng <strong className="text-white">vĩnh viễn</strong> sau mỗi lần người được giới thiệu thanh toán, kể cả khi gia hạn.
              </p>
            </div>

            <div className="bg-[var(--color-bg-card)] p-6 rounded-[24px] border border-[var(--color-border)]">
              <h3 className="font-black text-sm text-[var(--color-text-primary)] mb-4">Điều kiện nhận thưởng (lượt AI)</h3>
              <ul className="space-y-2.5">
                {[
                  'Người được mời dùng link của bạn',
                  'Hoạt động ít nhất 3 ngày khác nhau',
                  'Hệ thống tự động quét mỗi 5 phút',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)] font-medium">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'commissions' && (
        <motion.div key="commissions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <CommissionTab stats={data} />
        </motion.div>
      )}

      {activeTab === 'withdrawal' && (
        <motion.div key="withdrawal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <WithdrawalTab stats={data} />
        </motion.div>
      )}
    </motion.div>
  );
}
