import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Search, X } from 'lucide-react';
import knowledgeData from '../../../data/knowledgeBase.json';
import type { ArticleFilters as IArticleFilters } from '../types';

interface ArticleFiltersProps {
  show: boolean;
  onClose: () => void;
  tempFilters: IArticleFilters;
  setTempFilters: (filters: IArticleFilters | ((prev: IArticleFilters) => IArticleFilters)) => void;
  onApply: () => void;
  onReset: () => void;
  authorOptions: string[];
}

export function ArticleFilters({
  show,
  onClose,
  tempFilters,
  setTempFilters,
  onApply,
  onReset,
  authorOptions,
}: ArticleFiltersProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[105]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[var(--color-border)] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <Filter size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--color-text-primary)]">Bộ lọc bài viết</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                    Tối ưu danh sách
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto p-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-blue-400">Tìm kiếm</label>
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    size={16}
                  />
                  <input
                    value={tempFilters.search}
                    onChange={(event) => setTempFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder="Tiêu đề, mô tả, nội dung..."
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-blue-400">Tác giả</label>
                <select
                  value={tempFilters.author}
                  onChange={(event) => setTempFilters((current) => ({ ...current, author: event.target.value }))}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm font-bold outline-none transition-all focus:border-blue-500"
                >
                  <option value="">Tất cả tác giả</option>
                  {authorOptions.map((author) => (
                    <option key={author} value={author}>
                      {author}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-blue-400">
                  Thuật ngữ (Tag)
                </label>
                <select
                  value={tempFilters.tag}
                  onChange={(event) => setTempFilters((current) => ({ ...current, tag: event.target.value }))}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm font-bold outline-none transition-all focus:border-blue-500"
                >
                  <option value="">Tất cả thuật ngữ</option>
                  {(knowledgeData as any).terms.map((term: any) => (
                    <option key={term.id} value={term.term}>
                      {term.term}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-blue-400">Thời gian</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: '', label: 'Mọi thời gian' },
                    { id: '30d', label: '30 ngày' },
                    { id: '90d', label: '90 ngày' },
                    { id: '365d', label: '1 năm' },
                  ].map((option) => (
                    <button
                      key={option.id || 'all'}
                      type="button"
                      onClick={() => setTempFilters((current) => ({ ...current, dateRange: option.id }))}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                        tempFilters.dateRange === option.id
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-blue-400">Sắp xếp theo</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'newest', label: 'Mới nhất trước' },
                    { id: 'oldest', label: 'Cũ nhất trước' },
                    { id: 'title', label: 'Tên bài viết A-Z' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTempFilters((current) => ({ ...current, sortBy: option.id }))}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all ${
                        tempFilters.sortBy === option.id
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[var(--color-border)] p-6">
              <button
                onClick={onReset}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-4 text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text-primary)]"
              >
                Xóa hết
              </button>
              <button
                onClick={onApply}
                className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500"
              >
                Áp dụng
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
