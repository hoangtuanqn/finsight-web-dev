import { motion } from 'framer-motion';
import { BrainCircuit, ChevronLeft, ChevronRight } from 'lucide-react';

interface TermsTabProps {
  currentTerms: any[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TermsTab({ currentTerms, currentPage, totalPages, onPageChange }: TermsTabProps) {
  return (
    <motion.div
      key="terms"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {currentTerms.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTerms.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="group p-8 rounded-[32px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-indigo-500/40 transition-all duration-500 flex flex-col relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/15 transition-all duration-700" />

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <BrainCircuit size={22} />
                  </div>
                  <h3 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight group-hover:text-indigo-400 transition-colors">
                    {item.term}
                  </h3>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.definition}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-indigo-500/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    currentPage === i + 1
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-indigo-500/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-indigo-500/10 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[var(--color-text-muted)] font-medium italic">Không tìm thấy thuật ngữ nào phù hợp.</p>
        </div>
      )}
    </motion.div>
  );
}
