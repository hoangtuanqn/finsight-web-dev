import { motion } from 'framer-motion';
import { ArrowRight, Ban, CheckCircle2, Clock, Crown, Loader2, Receipt, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../api/index';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Chờ TT',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: Clock,
  },
  PAID: {
    label: 'Đã TT',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: CheckCircle2,
  },
  EXPIRED: { label: 'Hết hạn', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    icon: Ban,
  },
};

const PLAN_ICONS = {
  PRO: Zap,
  PROMAX: Crown,
};

const FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ TT' },
  { key: 'PAID', label: 'Đã TT' },
  { key: 'EXPIRED', label: 'Hết hạn' },
];

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    (subscriptionAPI as any)
      .getTransactions()
      .then((res: any) => {
        setTransactions(res.data?.data?.transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? transactions : transactions.filter((tx: any) => tx.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black mb-1">Lịch sử giao dịch</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{transactions.length} giao dịch</p>
          </div>
          <button onClick={() => navigate('/upgrade')} className="btn-primary text-sm">
            <Zap size={16} /> Nâng cấp
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-16">
            <Receipt size={48} className="text-[var(--color-text-muted)] mx-auto mb-4 opacity-30" />
            <p className="text-[var(--color-text-muted)] text-sm">
              {filter === 'ALL'
                ? 'Chưa có giao dịch nào'
                : `Không có giao dịch "${FILTERS.find((f) => f.key === filter)?.label}"`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx, i) => {
              const status = STATUS_CONFIG[tx.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;
              const PlanIcon = PLAN_ICONS[tx.plan] || Zap;

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/invoice/${tx.id}`)}
                  className="glass-card flex items-center gap-4 cursor-pointer hover:border-blue-500/30 transition-all group"
                >
                  {/* Plan Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.plan === 'PROMAX' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    <PlanIcon size={20} className={tx.plan === 'PROMAX' ? 'text-amber-400' : 'text-blue-400'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold truncate">Gói {tx.plan === 'PROMAX' ? 'Pro Max' : 'Pro'}</p>
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${status.bg} border ${status.border}`}
                      >
                        <StatusIcon size={10} className={status.color} />
                        <span className={`text-[10px] font-bold ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-400">{tx.amount.toLocaleString('vi-VN')}đ</p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    size={16}
                    className="text-[var(--color-text-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
