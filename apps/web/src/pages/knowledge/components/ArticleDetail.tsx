import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Calendar, Clock, Share2, User, X } from 'lucide-react';
import type { Article } from '../types';
import { getReadingTime } from '../utils';

interface ArticleDetailProps {
  article: Article | null;
  onClose: () => void;
}

export function ArticleDetail({ article, onClose }: ArticleDetailProps) {
  return (
    <AnimatePresence>
      {article && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-primary)] rounded-[48px] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto custom-scrollbar">
              <div className="relative h-80 md:h-96">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-transparent to-transparent z-10" />
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-10 left-10 right-10 z-20">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <span className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-400" /> {article.date}
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-indigo-600/80 backdrop-blur-xl border border-indigo-400/20 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                      <User size={14} /> {article.author}
                    </span>
                    <span className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} className="text-indigo-400" /> {getReadingTime(article.content)}
                    </span>
                    {article.tags &&
                      article.tags.length > 0 &&
                      article.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-4 py-2 rounded-2xl bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 text-blue-300 text-[11px] font-black uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none pr-12">
                    {article.title}
                  </h2>
                </div>
              </div>

              <div className="p-10 md:p-16 space-y-10">
                <div className="p-8 rounded-[32px] bg-indigo-500/5 border border-indigo-500/20 border-l-4 border-l-indigo-500 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 text-indigo-500/10">
                    <Bookmark size={80} />
                  </div>
                  <p className="text-xl font-bold text-[var(--color-text-primary)] italic relative z-10 leading-relaxed">
                    "{article.excerpt}"
                  </p>
                </div>

                <div className="prose prose-invert max-w-none">
                  <div className="text-[var(--color-text-secondary)] text-lg leading-[1.8] font-medium whitespace-pre-line space-y-6">
                    {article.content}
                  </div>
                </div>

                <div className="pt-10 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-indigo-400 font-bold text-sm transition-colors">
                      <Share2 size={18} /> Chia sẻ bài viết
                    </button>
                    <button className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-indigo-400 font-bold text-sm transition-colors">
                      <Bookmark size={18} /> Lưu bài viết
                    </button>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-black text-sm tracking-widest uppercase hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Đóng bài viết
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
