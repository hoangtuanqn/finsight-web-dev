import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MousePointerClick, Gift, Copy, CheckCircle2, 
  Clock, AlertCircle, Share2, TrendingUp, Info
} from 'lucide-react';
import { useAffiliateQuery } from '../../hooks/useAffiliateQuery';

export default function AffiliatePage() {
  const { data, isLoading } = useAffiliateQuery();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${data?.referralCode || ''}`;

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

  const statsCards = [
    { 
      label: 'Lượt nhấp link', 
      value: data?.stats?.clicks || 0, 
      icon: MousePointerClick, 
      color: 'blue',
      desc: 'Số người đã nhấn vào link của bạn' 
    },
    { 
      label: 'Đã giới thiệu', 
      value: data?.stats?.totalReferrals || 0, 
      icon: Users, 
      color: 'emerald',
      desc: 'Số người đã đăng ký tài khoản' 
    },
    { 
      label: 'Phần thưởng', 
      value: data?.stats?.completedReferrals || 0, 
      icon: Gift, 
      color: 'purple',
      desc: 'Số người đã nạp tiền & hoạt động 3 ngày' 
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-2xl shadow-blue-500/20">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Mời bạn bè, nhận Strategy Quota 🎁</h1>
          <p className="text-blue-100 font-medium">Nhận ngay 15 lượt tạo chiến lược cho mỗi người bạn mời thành công.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Mã của bạn</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black">{data?.referralCode || '------'}</span>
              <button 
                onClick={() => handleCopy(data?.referralCode || '')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[var(--color-bg-card)] p-6 rounded-[24px] border border-[var(--color-border)] shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${card.color}-500/10 text-${card.color}-500 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-[var(--color-text-muted)] opacity-50" />
            </div>
            <div className="space-y-1">
              <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest">{card.label}</p>
              <h3 className="text-3xl font-black">{card.value}</h3>
              <p className="text-[var(--color-text-muted)] text-[11px] leading-tight pt-1">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Referral Link Card */}
      <div className="bg-[var(--color-bg-card)] p-8 rounded-[32px] border border-[var(--color-border)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Share2 className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-black">Link giới thiệu của bạn</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-4 rounded-2xl font-mono text-sm break-all">
            {referralLink}
          </div>
          <button
            onClick={() => handleCopy(referralLink)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Đã copy' : 'Sao chép link'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-black text-sm text-emerald-700">Bạn nhận +15 lượt</p>
              <p className="text-xs text-emerald-600/80 leading-relaxed font-medium">Khi người bạn mời nạp tiền và hoạt động ít nhất 3 ngày trên ứng dụng.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <Gift className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="font-black text-sm text-blue-700">Bạn bè nhận +5 lượt</p>
              <p className="text-xs text-blue-600/80 leading-relaxed font-medium">Phần quà chào mừng dành cho người mới khi tham gia qua link của bạn.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="bg-[var(--color-bg-card)] rounded-[32px] border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-black">Danh sách giới thiệu</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full border border-[var(--color-border)]">
            <Info className="w-3.5 h-3.5" />
            Tự động cập nhật mỗi 5 phút
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)]">
                <th className="px-8 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Người được mời</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Nạp tiền</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">Hoạt động</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data?.referrals?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-[var(--color-text-muted)] font-medium italic">
                    Bạn chưa mời ai tham gia. Hãy bắt đầu chia sẻ link nhé!
                  </td>
                </tr>
              ) : (
                data?.referrals?.map((ref: any) => (
                  <tr key={ref.id} className="hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-sm">{ref.name}</span>
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">{ref.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        {ref.hasToppedUp ? (
                          <div className="bg-emerald-500/10 text-emerald-500 p-1 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="bg-orange-500/10 text-orange-500 p-1 rounded-lg">
                            <Clock className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-black">{ref.activeDays}/3</div>
                        <div className="w-16 h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${ref.activeDays >= 3 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((ref.activeDays / 3) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {ref.status === 'REWARDED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã nhận thưởng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-600 border border-orange-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Đang chờ
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-900 text-white p-8 rounded-[32px] space-y-4">
        <h3 className="text-lg font-black flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          Điều kiện nhận thưởng là gì?
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Hệ thống sẽ tự động quét và trao thưởng khi người bạn mời hoàn thành các bước sau:
          <br />
          1. Đăng ký tài khoản qua Link giới thiệu của bạn.
          <br />
          2. Thực hiện ít nhất 1 lần nạp tiền (nâng cấp PRO hoặc PROMAX).
          <br />
          3. Hoạt động trên ứng dụng ít nhất 3 ngày khác nhau (mỗi ngày đăng nhập ít nhất 1 lần).
        </p>
      </div>
    </div>
  );
}
