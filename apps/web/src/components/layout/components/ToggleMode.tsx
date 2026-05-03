import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export const ToggleMode = ({ setDark, dark, ...props }: any) => {
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      title={dark ? 'Chuyển Sang Sáng' : 'Chuyển Sang Tối'}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={dark ? 'moon' : 'sun'}
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ duration: 0.2 }}
        >
          {dark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};
