import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function SentimentGauge({ value = 50, size = 200 }) {
  const { angle, color, label } = useMemo(() => {
    // Map 0-100 to -90 to +90 degrees (semicircle)
    const a = -90 + (value / 100) * 180;
    let c, l;
    if (value <= 24) {
      c = '#dc2626';
      l = 'Sợ hãi cực độ';
    } else if (value <= 49) {
      c = '#f97316';
      l = 'Sợ hãi';
    } else if (value === 50) {
      c = '#eab308';
      l = 'Trung lập';
    } else if (value <= 74) {
      c = '#22c55e';
      l = 'Tham lam';
    } else {
      c = '#15803d';
      l = 'Tham lam cực độ';
    }
    return { angle: a, color: c, label: l };
  }, [value]);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const radius = size / 2 - 20;

  // Semicircle arc segments
  const segments = [
    { start: -90, end: -54, color: '#dc2626' },
    { start: -54, end: -18, color: '#f97316' },
    { start: -18, end: 18, color: '#eab308' },
    { start: 18, end: 54, color: '#22c55e' },
    { start: 54, end: 90, color: '#15803d' },
  ];

  const toRad = (deg) => (deg * Math.PI) / 180;

  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Needle endpoint
  const needleLen = radius - 15;
  const needleX = cx + needleLen * Math.cos(toRad(angle));
  const needleY = cy + needleLen * Math.sin(toRad(angle));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Arc segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.start, seg.end, radius)}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />
        ))}

        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ x2: cx, y2: cy - needleLen }}
          animate={{ x2: needleX, y2: needleY }}
          transition={{ type: 'spring', damping: 15, stiffness: 60 }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="6" fill={color} />
      </svg>

      {/* Value & label below gauge - separated from SVG to avoid overlap */}
      <div className="text-center mt-1">
        <p className="text-3xl font-bold leading-none" style={{ color }}>
          {value}
        </p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  );
}
