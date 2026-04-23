import React from 'react';
import { FileText, ExternalLink, Calendar, Globe } from 'lucide-react';

export default function EconomicNewsFeed({ news = [] }) {
  if (news.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <FileText size={16} className="text-blue-400" />
          </div>
          Tin tức & Phân tích
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-[11px] font-semibold text-slate-400">
          <Globe size={12} />
          Nguồn tin chọn lọc
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        {news.map((article, i) => (
          <a 
            key={i} 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  {article.source}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <Calendar size={12} />
                  {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <h4 className="text-base font-bold text-slate-300 group-hover:text-white transition-colors leading-snug mb-5 line-clamp-2">
                {article.title}
              </h4>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 group-hover:text-blue-400 transition-colors">
              Đọc chi tiết
              <div className="p-1 rounded-full bg-white/5 group-hover:bg-blue-500/10 transition-colors ml-1">
                 <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
