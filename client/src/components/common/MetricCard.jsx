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
      className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: 'var(--color-bg-card)', 
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Decorative Glow - Subtle in light mode */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-[0.15] transition-opacity group-hover:opacity-[0.25]"
        style={{ background: c.text }}
      />

      <div className="relative z-10 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ background: c.bg }}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{label}</span>
        </div>
        
        <div className="space-y-1">
          <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{value}</p>
          {subValue && (
            <p className="text-[12px] text-[var(--color-text-muted)] font-medium">{subValue}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
