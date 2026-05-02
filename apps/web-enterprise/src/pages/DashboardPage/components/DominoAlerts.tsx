import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle } from 'lucide-react';

export default function DominoAlerts({ alerts = [] }: { alerts?: any[] }) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2.5">
      {alerts.map((alert, i) => {
        const isDanger = alert.severity === 'DANGER';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-[13px] font-bold relative overflow-hidden"
            style={{
              background: isDanger ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
              borderColor: isDanger ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)',
              boxShadow: isDanger ? '0 0 20px rgba(239,68,68,0.1)' : '0 0 20px rgba(245,158,11,0.08)',
            }}
          >
            {/* Accent left bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{
                background: isDanger
                  ? 'linear-gradient(180deg, #ef4444, #f87171)'
                  : 'linear-gradient(180deg, #f59e0b, #fbbf24)',
              }}
            />
            <span className="shrink-0 ml-1" style={{ color: isDanger ? '#f87171' : '#fbbf24' }}>
              {isDanger ? <AlertOctagon size={17} /> : <AlertTriangle size={17} />}
            </span>
            <span style={{ color: isDanger ? '#fca5a5' : '#fde68a' }}>{alert.message}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
