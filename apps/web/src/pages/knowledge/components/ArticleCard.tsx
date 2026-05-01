import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ChevronRight, Clock, User } from 'lucide-react';
import type { Article } from '../types';
import { getReadingTime } from '../utils';

interface ArticleCardProps {
  article: Article;
  index: number;
  viewMode: string;
  onClick: (article: Article) => void;
}

export function ArticleCard({ article, index, viewMode, onClick }: ArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      key={article.id}
      onClick={() => onClick(article)}
      className={`group cursor-pointer bg-[var(--color-bg-secondary)] border border-[var(--color-border)] overflow-hidden hover:border-indigo-500/30 hover:translate-y-[-4px] transition-all duration-500 ${
        viewMode === 'grid'
          ? 'rounded-[40px] flex flex-col'
          : 'rounded-[28px] flex flex-col md:flex-row md:items-stretch'
      }`}
      style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
    >
      <div
        className={`${viewMode === 'grid' ? 'h-64' : 'h-52 md:h-64 md:w-72 lg:w-80'} overflow-hidden relative shrink-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-wider">
            <Calendar size={12} className="text-indigo-400" /> {article.date}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/80 backdrop-blur-xl border border-indigo-400/20 text-white text-[10px] font-black uppercase tracking-wider">
            <User size={12} /> {article.author}
          </span>
        </div>
      </div>

      <div className={`${viewMode === 'grid' ? 'p-8' : 'p-6 md:p-7'} flex flex-col flex-1 relative`}>
        <div className="flex justify-between items-start mb-4">
          <h3
            className={`${viewMode === 'grid' ? 'text-2xl' : 'text-xl md:text-2xl'} font-black text-[var(--color-text-primary)] leading-tight tracking-tighter group-hover:text-indigo-400 transition-colors flex-1 pr-4`}
          >
            {article.title}
          </h3>
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shrink-0">
            <ArrowRight size={20} />
          </div>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p
          className={`text-[var(--color-text-secondary)] text-sm leading-relaxed ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'} mb-6 font-medium`}
        >
          {article.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-5">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-[11px] font-bold">
            <Clock size={13} /> {getReadingTime(article.content)}
          </div>
          <span className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Đọc ngay <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
