import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { CardHeader } from './Card';
import { formatVND, formatPercent } from '../../../utils/calculations';

const RANK_GRADIENTS = [
  'from-amber-500 to-yellow-400',
  'from-slate-400 to-slate-300',
  'from-orange-600 to-orange-400',
  'from-blue-500 to-blue-400',
  'from-purple-500 to-purple-400',
];

const RANK_GLOWS = ['#f59e0b', '#94a3b8', '#ea580c', '#3b82f6', '#8b5cf6'];

export default function TopDebts({ debts = [] }) {
  const sorted = [...debts].sort((a, b) => b.balance - a.balance).slice(0, 5);

  return (
    <div
      className="relative rounded-3xl p-6 h-full flex flex-col overflow-hidden border"
      style={{
        background:  'var(--color-bg-card)',
        borderColor: 'rgba(239,68,68,0.12)',
        boxShadow:   '0 4px 30px rgba(239,68,68,0.06), 0 1px 0 rgba(239,68,68,0.15) inset',
      }}
    >
      {/* Accents */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-red-600/8 blur-3xl pointer-events-none" />

      <CardHeader icon={<Flame size={16} />} title="Top nợ lớn nhất" subtitle="Sắp xếp theo số dư giảm dần" />

      {sorted.length > 0 ? (
        <div className="space-y-1.5 flex-1">
          {sorted.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ x: 3 }}
            >
              <Link
                to={`/debts/${d.id}`}
                className="flex items-center gap-3 py-2.5 px-3 rounded-2xl transition-all group cursor-pointer hover:bg-white/4"
              >
                {/* Rank badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0 bg-gradient-to-br ${RANK_GRADIENTS[i]}`}
                  style={{ boxShadow: `0 3px 10px ${RANK_GLOWS[i]}50` }}
                >
                  {i + 1}
                </div>

                {/* Name + platform */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate group-hover:text-blue-400 transition-colors">
                    {d.name}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">{d.platform}</p>
                </div>

                {/* Balance + EAR */}
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-black bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
                    {formatVND(d.balance)}
                  </p>
                  <p className="text-[10px] text-purple-400 font-bold">EAR {formatPercent(d.ear)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có khoản nợ nào</p>
        </div>
      )}
    </div>
  );
}
