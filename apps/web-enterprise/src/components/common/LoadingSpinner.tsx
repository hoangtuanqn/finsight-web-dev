import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-[3px] border-blue-500/20 border-t-blue-500 rounded-full"
      />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function PageSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-4 w-72" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card-static">
            <div className="skeleton h-3 w-20 mb-3" />
            <div className="skeleton h-7 w-32 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(rows > 2 ? 2 : rows)].map((_, i) => (
          <div key={i} className="glass-card-static space-y-4">
            <div className="skeleton h-5 w-40" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
