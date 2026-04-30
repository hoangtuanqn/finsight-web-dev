import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MousePointerClick, Gift, Copy, CheckCircle2, 
  Clock, Share2, Info, ChevronRight, Sparkles, Target
} from 'lucide-react';
import { useAffiliateQuery } from '../../hooks/useAffiliateQuery';

const SUMMARY_CARDS = (stats: any) => [
  { 
    label: 'Lượt nhấp link', 
    value: stats?.clicks || 0, 
    icon: MousePointerClick, 
    color: '#3b82f6', 
    gradient: 'from-blue-500 to-cyan-400',
    desc: 'Số người đã nhấn vào link'
  },
  { 
    label: 'Đã giới thiệu', 
    value: stats?.totalReferrals || 0, 
    icon: Users, 
    color: '#10b981', 
    gradient: 'from-emerald-500 to-teal-400',
    desc: 'Số người đã đăng ký tài khoản'
  },
  { 
    label: 'Phần thưởng', 
    value: stats?.completedReferrals || 0, 
    icon: Gift, 
    color: '#8b5cf6', 
    gradient: 'from-purple-500 to-violet-400',
    desc: 'Số người đủ điều kiện nhận thưởng'
  },
  { 
    label: 'Tỷ lệ chuyển đổi', 
    value: stats?.clicks > 0 ? ((stats.totalReferrals / stats.clicks) * 100).toFixed(1) + '%' : '0%', 
    icon: Target, 
    color: '#f59e0b', 
    gradient: 'from-amber-500 to-orange-400',
    desc: 'Hiệu quả của link giới thiệu'
  }
];

export default function AffiliatePage() {
  const { data, isLoading, error } = useAffiliateQuery();
  const [copied, setCopied] = useState(false);

  // Debug client-side
  if (data) {
    console.log('[AffiliatePage] Render with data:', data);
  }
  if (error) {
    console.error('[AffiliatePage] Query error:', error);
  }

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-8 space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles size={14} /> Hệ thống Affiliate
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Giới thiệu bạn bè
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] text-base mt-2">Mời bạn bè tham gia FinSight để nhận thêm lượt sử dụng Strategy AI.</p>
        </div>
        
      
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {SUMMARY_CARDS(data?.stats).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-3xl p-6 border overflow-hidden cursor-default transition-all duration-300 hover:shadow-xl"
            style={{ 
              background: 'var(--color-bg-card)', 
              borderColor: `${item.color}25`, 
              boxShadow: `0 4px 24px ${item.color}08` 
            }}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-25" style={{ background: item.color }} />

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                {item.label}
              </p>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <p className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-tight`}>
              {item.value}
            </p>
            <p className="text-[10px] mt-2 font-semibold text-[var(--color-text-muted)] italic">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Referral Link & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-bg-card)] p-7 rounded-[32px] border border-[var(--color-border)] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Share2 className="w-5 h-5 text-blue-500" />
              </div>
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
                {copied ? 'Đã copy' : 'Sao chép link'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Gift size={20} />
                </div>
                <div>
                  <p className="font-black text-sm text-[var(--color-text-primary)]">Bạn nhận +15 lượt</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium leading-relaxed">Khi bạn bè hoạt động ít nhất 3 ngày trên hệ thống.</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-black text-sm text-[var(--color-text-primary)]">Bạn bè nhận +5 lượt</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium leading-relaxed">Quà tặng chào mừng cho người mới.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-7 rounded-[32px] shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <h3 className="text-lg font-black flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              Điều kiện nhận thưởng
            </h3>
            <ul className="space-y-3">
              {[
                'Người được mời phải dùng link của bạn',
                'Hoạt động ít nhất 3 ngày khác nhau',
                'Đăng nhập ít nhất 1 lần/ngày',
                'Hệ thống tự động quét mỗi 5 phút'
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-400 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Chi tiết người được mời</h2>
          <div className="flex items-center gap-2 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest bg-[var(--color-bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
            <Clock size={12} className="text-blue-500" /> Tự động cập nhật
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-[24px] border border-[var(--color-border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)]">
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Người dùng</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Hoạt động</th>
                  <th className="px-8 py-5 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {data?.referrals?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-10 h-10 text-[var(--color-text-muted)] opacity-20" />
                        <p className="text-[var(--color-text-muted)] font-bold text-sm italic">Bạn chưa mời ai tham gia. Hãy bắt đầu chia sẻ link nhé!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.referrals?.map((ref: any, idx: number) => (
                    <tr key={ref.id} className="group hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/10">
                            {ref.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors">{ref.name}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">{ref.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center gap-1.5 min-w-[150px] max-w-[250px] mx-auto">
                          <div className="flex justify-between w-full text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider">
                            <span>Đăng nhập tích lũy</span>
                            <span className={ref.activeDays >= 3 ? 'text-emerald-500' : 'text-blue-500'}>{ref.activeDays}/3 ngày</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden border border-[var(--color-border)]/50">
                            <div 
                              className={`h-full transition-all duration-700 ${ref.activeDays >= 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'}`}
                              style={{ width: `${Math.min((ref.activeDays / 3) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {ref.status === 'REWARDED' ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                            <Gift className="w-3.5 h-3.5" />
                            Đã nhận quà
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest italic group-hover:text-blue-400 transition-colors">
                            Chờ hoạt động đủ 3 ngày <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                          </div>
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
    </motion.div>
  );
}
