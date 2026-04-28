/** Animation variants */
export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.055 } },
};

/** Pie/Donut chart color palette */
export const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

/** Shared Recharts tooltip style */
export const TOOLTIP_STYLE = {
  background:   '#0f172a',
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize:     '12px',
  padding:      '8px 12px',
  boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
};
