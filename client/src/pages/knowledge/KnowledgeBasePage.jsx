import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Lightbulb, Bookmark, ArrowRight, BookMarked, BrainCircuit, 
  User, Calendar, Loader2, Sparkles, X, ChevronRight, Share2, Clock,
  ChevronLeft, Search
} from 'lucide-react';
import knowledgeData from '../../data/knowledgeBase.json';
import { useArticles, useSeedArticles } from '../../hooks/useArticleQuery';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState('terms');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: articles, isLoading } = useArticles();
  const { mutate: seed, isPending: isSeeding } = useSeedArticles();

  const handleSeed = () => {
    seed(null, {
      onSuccess: () => toast.success('Đã nạp dữ liệu bài viết mẫu!'),
      onError: () => toast.error('Lỗi khi nạp dữ liệu.')
    });
  };

  // Terms Pagination & Filter Logic
  const filteredTerms = useMemo(() => {
    return knowledgeData.terms.filter(term => 
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const currentTerms = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTerms, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <BookOpen size={11} /> Kho tàng kiến thức
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[var(--color-text-primary)] leading-none">
            Kiến thức <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-400">Tài chính</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm max-w-2xl">
            Tối ưu hóa chiến lược quản lý nợ thông qua các khái niệm cốt lõi và câu chuyện thực tiễn.
          </p>
        </div>
        
        {activeTab === 'stories' && (!articles || articles.length === 0) && !isLoading && (
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Nạp dữ liệu mẫu
          </button>
        )}
      </motion.div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[20px] w-fit">
          {[
            { id: 'terms', label: 'Thuật ngữ', icon: BookMarked },
            { id: 'stories', label: 'Bài viết thực tế', icon: Lightbulb }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`relative px-8 py-3 rounded-[15px] text-[13px] font-bold transition-all ${
                activeTab === tab.id ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="kb-tab-active"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[15px]"
                  style={{ boxShadow: '0 8px 20px rgba(79,70,229,0.3)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <tab.icon size={16} /> {tab.label}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'terms' && (
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
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-indigo-500/50 outline-none transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'terms' ? (
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
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-indigo-500/10 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
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
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
        ) : (
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
            ) : articles && articles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {articles.map((story, index) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={story.id}
                    onClick={() => setSelectedArticle(story)}
                    className="group cursor-pointer rounded-[40px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] overflow-hidden flex flex-col hover:border-indigo-500/30 hover:translate-y-[-4px] transition-all duration-500"
                    style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
                  >
                    <div className="h-64 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
                      <img 
                        src={story.imageUrl} 
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-wider">
                          <Calendar size={12} className="text-indigo-400" /> {story.date}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/80 backdrop-blur-xl border border-indigo-400/20 text-white text-[10px] font-black uppercase tracking-wider">
                          <User size={12} /> {story.author}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1 relative">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-black text-[var(--color-text-primary)] leading-tight tracking-tighter group-hover:text-indigo-400 transition-colors flex-1 pr-4">
                          {story.title}
                        </h3>
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                      
                      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                        {story.excerpt}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-5">
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-[11px] font-bold">
                          <Clock size={13} /> 5 phút đọc
                        </div>
                        <span className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Đọc ngay <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
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
        )}
      </AnimatePresence>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-primary)] rounded-[48px] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto custom-scrollbar">
                <div className="relative h-80 md:h-96">
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)] via-transparent to-transparent z-10" />
                  <img 
                    src={selectedArticle.imageUrl} 
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-10 left-10 right-10 z-20">
                    <div className="flex gap-4 mb-4">
                      <span className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-400" /> {selectedArticle.date}
                      </span>
                      <span className="px-4 py-2 rounded-2xl bg-indigo-600/80 backdrop-blur-xl border border-indigo-400/20 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                        <User size={14} /> {selectedArticle.author}
                      </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none pr-12">
                      {selectedArticle.title}
                    </h2>
                  </div>
                </div>

                <div className="p-10 md:p-16 space-y-10">
                  <div className="p-8 rounded-[32px] bg-indigo-500/5 border border-indigo-500/20 border-l-4 border-l-indigo-500 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 text-indigo-500/10">
                      <Bookmark size={80} />
                    </div>
                    <p className="text-xl font-bold text-[var(--color-text-primary)] italic relative z-10 leading-relaxed">
                      "{selectedArticle.excerpt}"
                    </p>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div className="text-[var(--color-text-secondary)] text-lg leading-[1.8] font-medium whitespace-pre-line space-y-6">
                      {selectedArticle.content}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-indigo-400 font-bold text-sm transition-colors">
                        <Share2 size={18} /> Chia sẻ bài viết
                      </button>
                      <button className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-indigo-400 font-bold text-sm transition-colors">
                        <Bookmark size={18} /> Lưu bài viết
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedArticle(null)}
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
    </div>
  );
}
