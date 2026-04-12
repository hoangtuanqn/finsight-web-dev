import { motion } from 'framer-motion';

const COLOR_MAP = {
  green: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
  red: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  yellow: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  purple: { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
  cyan: { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4' },
  blue: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
};

export default function MetricCard({ icon, label, value, subValue, color = 'blue', delay = 0 }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.08 }}
      className="glass-card group relative overflow-hidden"
      style={{ borderColor: c.border }}
    >
      {/* Glow accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30"
        style={{ background: c.text }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: c.text }}>{value}</p>
        {subValue && (
          <p className="text-[12px] text-slate-500 mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
