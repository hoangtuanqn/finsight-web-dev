import { motion } from 'framer-motion';
import { BookOpen, Loader2 } from 'lucide-react';
import type { Article } from '../types';
import { ArticleCard } from './ArticleCard';

interface ArticlesTabProps {
  isLoading: boolean;
  articles: Article[];
  viewMode: string;
  onArticleClick: (article: Article) => void;
}

export function ArticlesTab({ isLoading, articles, viewMode, onArticleClick }: ArticlesTabProps) {
  return (
    <motion.div
      key="stories"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-[400px]"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-5">
          <div className="relative">
            <Loader2 size={48} className="animate-spin text-indigo-500" />
            <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
          </div>
          <p className="text-[var(--color-text-muted)] font-bold tracking-tight text-lg">Đang tải tri thức...</p>
        </div>
      ) : articles.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'flex flex-col gap-5'}>
          {articles.map((story, index) => (
            <ArticleCard key={story.id} article={story} index={index} viewMode={viewMode} onClick={onArticleClick} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-6 bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-[40px]">
          <div className="w-24 h-24 rounded-[32px] bg-indigo-500/5 flex items-center justify-center text-indigo-500/30">
            <BookOpen size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Chưa có bài viết nào</h3>
            <p className="text-[var(--color-text-muted)] text-sm max-w-xs mx-auto">
              Khám phá góc nhìn chuyên sâu về quản lý tài chính thông qua các tình huống thực tế.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
