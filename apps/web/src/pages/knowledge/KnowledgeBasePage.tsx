import { AnimatePresence, motion } from 'framer-motion';
import { BookMarked, BookOpen, Filter, LayoutGrid, Lightbulb, List, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import knowledgeData from '../../data/knowledgeBase.json';
import { useArticles } from '../../hooks/useArticleQuery';

// Components
import { ArticleDetail } from './components/ArticleDetail';
import { ArticleFilters } from './components/ArticleFilters';
import { ArticlesTab } from './components/ArticlesTab';
import { TermsTab } from './components/TermsTab';

// Types & Utils
import type { Article, ArticleFilters as IArticleFilters } from './types';
import { emptyArticleFilters } from './types';
import { getArticleTime, normalizeText } from './utils';

const ITEMS_PER_PAGE = 10;

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState('terms');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [articleFilters, setArticleFilters] = useState<IArticleFilters>(emptyArticleFilters);
  const [tempArticleFilters, setTempArticleFilters] = useState<IArticleFilters>(emptyArticleFilters);
  const [showArticleFilters, setShowArticleFilters] = useState(false);
  const [articleViewMode, setArticleViewMode] = useState(() => localStorage.getItem('finsight_article_view') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: articles, isLoading } = useArticles() as { data: Article[] | undefined; isLoading: boolean };

  const articleList = articles || [];

  useEffect(() => {
    if (showArticleFilters) {
      setTempArticleFilters(articleFilters);
    }
  }, [showArticleFilters, articleFilters]);

  useEffect(() => {
    localStorage.setItem('finsight_article_view', articleViewMode);
  }, [articleViewMode]);

  const handleApplyArticleFilters = () => {
    setArticleFilters(tempArticleFilters);
    setShowArticleFilters(false);
  };

  const handleResetArticleFilters = () => {
    setArticleFilters(emptyArticleFilters);
    setTempArticleFilters(emptyArticleFilters);
    setShowArticleFilters(false);
  };

  // Terms Pagination & Filter Logic
  const filteredTerms = useMemo(() => {
    return (knowledgeData as any).terms.filter(
      (term: any) =>
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const currentTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTerms, currentPage]);

  const authorOptions = useMemo(() => {
    return Array.from(new Set(articleList.map((article) => article.author).filter(Boolean))).sort();
  }, [articleList]);

  const filteredArticles = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '365d': 365 * 24 * 60 * 60 * 1000,
    };

    const filtered = articleList.filter((article) => {
      if (articleFilters.search) {
        const keyword = normalizeText(articleFilters.search);
        const haystack = normalizeText(`${article.title || ''} ${article.excerpt || ''} ${article.content || ''}`);
        if (!haystack.includes(keyword)) return false;
      }

      if (articleFilters.author && article.author !== articleFilters.author) {
        return false;
      }

      if (articleFilters.dateRange) {
        const articleTime = getArticleTime(article);
        if (!articleTime || now - articleTime > ranges[articleFilters.dateRange]) {
          return false;
        }
      }

      if (articleFilters.tag) {
        if (!article.tags || !Array.isArray(article.tags) || !article.tags.includes(articleFilters.tag)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (articleFilters.sortBy === 'oldest') {
        return getArticleTime(a) - getArticleTime(b);
      }
      if (articleFilters.sortBy === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''), 'vi');
      }
      return getArticleTime(b) - getArticleTime(a);
    });
  }, [articleFilters, articleList]);

  const hasActiveArticleFilters = Boolean(
    articleFilters.search ||
    articleFilters.author ||
    articleFilters.dateRange ||
    articleFilters.tag ||
    articleFilters.sortBy !== 'newest',
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <BookOpen size={11} /> Kho tàng kiến thức
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[var(--color-text-primary)] leading-none">
            Kiến thức{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-400">
              Tài chính
            </span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-2xl">
            Tối ưu hóa chiến lược quản lý nợ thông qua các khái niệm cốt lõi và câu chuyện thực tiễn.
          </p>
        </div>
      </motion.div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[20px] w-fit">
          {[
            { id: 'terms', label: 'Thuật ngữ', icon: BookMarked },
            { id: 'stories', label: 'Bài viết thực tế', icon: Lightbulb },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`relative px-8 py-3 rounded-[15px] text-[13px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="kb-tab-active"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[15px]"
                  style={{ boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <tab.icon size={16} /> {tab.label}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'terms' ? (
          <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] px-4 py-2 rounded-xl border border-[var(--color-border)]">
              Tổng cộng: <span className="text-indigo-400">{filteredTerms.length}</span> thuật ngữ
            </span>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm thuật ngữ..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-indigo-500/50 outline-none transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <button
              onClick={() => setShowArticleFilters(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black transition-all active:scale-95 ${
                hasActiveArticleFilters
                  ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Filter size={16} />
              Bộ lọc
              {hasActiveArticleFilters && <span className="h-2 w-2 rounded-full bg-indigo-400" />}
            </button>
            <div className="hidden items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1 shadow-sm sm:flex">
              <button
                onClick={() => setArticleViewMode('grid')}
                className={`rounded-xl p-2 transition-colors ${
                  articleViewMode === 'grid'
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                title="Xem nhiều thẻ"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setArticleViewMode('list')}
                className={`rounded-xl p-2 transition-colors ${
                  articleViewMode === 'list'
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
                title="Xem theo hàng"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'terms' ? (
          <TermsTab
            currentTerms={currentTerms}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <ArticlesTab
            isLoading={isLoading}
            articles={filteredArticles}
            viewMode={articleViewMode}
            onArticleClick={setSelectedArticle}
          />
        )}
      </AnimatePresence>

      <ArticleFilters
        show={showArticleFilters}
        onClose={() => setShowArticleFilters(false)}
        tempFilters={tempArticleFilters}
        setTempFilters={setTempArticleFilters}
        onApply={handleApplyArticleFilters}
        onReset={handleResetArticleFilters}
        authorOptions={authorOptions}
      />

      <ArticleDetail article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
