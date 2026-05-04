import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface StatsCard {
  label: string;
  value: string | number;
  color: string;
  gradient: string;
  icon: LucideIcon;
}

interface StatsCardsProps {
  cards: StatsCard[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {cards.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="group relative p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden"
        >
          {/* Subtle hover gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`}
          />

          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{item.value}</h3>
            </div>
            <div
              className="p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl"
              style={{
                backgroundColor: `${item.color}15`,
                color: item.color,
                boxShadow: `0 8px 20px -6px ${item.color}30`,
              }}
            >
              <item.icon size={22} strokeWidth={2.5} />
            </div>
          </div>

          {/* Bottom highlight bar */}
          <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-slate-800 to-transparent group-hover:via-emerald-500/50 transition-all duration-700" />
        </motion.div>
      ))}
    </div>
  );
};
