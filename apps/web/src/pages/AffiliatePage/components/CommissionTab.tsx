import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { referralAPI } from '../../../api';

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    EARNED: {
      label: 'Đã ghi nhận',
      className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25',
    },
    WITHDRAWN: {
      label: 'Đã rút',
      className: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    },
  };
  const c = config[status] || config['EARNED'];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.className}`}
    >
      {c.label}
    </span>
  );
}

interface CommissionTabProps {
  stats: any;
}

export default function CommissionTab({ stats }: CommissionTabProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['commission-history', page],
    queryFn: async () => {
      const res = await referralAPI.getCommissions(page);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Tổng hoa hồng đã nhận',
            value: formatVND(stats?.totalCommissionEarned || 0),
            color: '#10b981',
            desc: 'Tích lũy từ tất cả giao dịch',
          },
          {
            label: 'Số dư khả dụng',
            value: formatVND(stats?.availableBalance || 0),
            color: '#3b82f6',
            desc: 'Có thể yêu cầu rút ngay',
          },
          {
            label: 'Đang chờ rút',
            value: formatVND(stats?.pendingWithdrawalAmount || 0),
            color: '#f59e0b',
            desc: 'Yêu cầu đang xử lý',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl p-5 border overflow-hidden"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: `${card.color}25`,
            }}
          >
            <div
              className="absolute top-0 left-6 right-6 h-px"
              style={{ background: `linear-gradient(90deg,transparent,${card.color}60,transparent)` }}
            />
            <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
              {card.label}
            </p>
            <p className="text-2xl font-black" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-1">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-[var(--color-bg-card)] rounded-[24px] border border-[var(--color-border)] overflow-hidden shadow-sm">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <h3 className="font-black text-[var(--color-text-primary)]">Lịch sử hoa hồng</h3>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
            Mỗi lần người được giới thiệu gia hạn
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
          </div>
        ) : !data?.commissions?.length ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-10 h-10 text-[var(--color-text-muted)] opacity-20 mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] font-bold text-sm italic">
              Chưa có hoa hồng nào. Hãy mời bạn bè đăng ký và nâng cấp gói!
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)]">
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                      Người trả
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                      Gói
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                      Giao dịch gốc
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                      Tỉ lệ
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                      Hoa hồng
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                      Ngày
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {data.commissions.map((log: any) => (
                    <tr key={log.id} className="group hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">{log.payer.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] font-medium">{log.payer.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            log.plan === 'PROMAX' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {log.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-[var(--color-text-secondary)]">
                        {formatVND(log.originalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-500">{log.commissionRatePercent}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-500">+{formatVND(log.commissionAmount)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] text-[var(--color-text-muted)] font-medium">
                        {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
