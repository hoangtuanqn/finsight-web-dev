import React from 'react';
import { FileText, ExternalLink, Clock, Globe, TrendingUp } from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const SOURCE_COLORS: Record<string, string> = {
  'VnExpress': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'CafeF':     'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'VnEconomy': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

export default function EconomicNewsFeed({ news = [] }: { news: any[] }) {
  if (news.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <FileText size={15} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tin tức & Phân tích</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Cập nhật từ VnExpress, CafeF, VnEconomy</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-[11px] font-semibold text-slate-400">
          <TrendingUp size={11} className="text-emerald-400" />
          {news.length} bài mới nhất
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {news.map((article, i) => {
          const sourceStyle = SOURCE_COLORS[article.source] || 'bg-white/5 border-white/10 text-slate-400';
          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group"
            >
              {/* Source + time */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 border rounded-full ${sourceStyle}`}>
                  {article.source}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Clock size={11} />
                  {timeAgo(article.publishedAt)}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors leading-snug mb-2 line-clamp-2">
                {article.title}
              </h4>

              {/* Description */}
              {article.description && (
                <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {article.description.replace(/<[^>]*>/g, '')}
                </p>
              )}

              {/* Read more */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 group-hover:text-blue-400 transition-colors mt-auto pt-2 border-t border-white/5">
                <ExternalLink size={11} />
                Đọc chi tiết
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
