import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

export default function ChatHistory({ sessions, onSelect, onDelete, onNew, currentSessionId }) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-colors hover:opacity-90 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', color: 'white' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Cuộc trò chuyện mới
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {sessions.length === 0 && (
          <p className="text-center text-[11px] py-6 opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
            Chưa có cuộc trò chuyện nào
          </p>
        )}
        
        {sessions.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
              currentSessionId === s.id ? 'ring-1 ring-blue-500/40' : ''
            }`}
            style={{
              background: currentSessionId === s.id ? 'var(--color-bg-elevated)' : 'transparent',
              color: 'var(--color-text-primary)',
            }}
            onClick={() => onSelect(s.id)}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-[12px]">{s.title || 'Cuộc trò chuyện'}</p>
              <p className="text-[10px] opacity-40 mt-0.5">{s._count?.messages || 0} tin nhắn</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="opacity-0 group-hover:opacity-70 hover:!opacity-100 p-1 rounded-lg hover:bg-rose-500/10 transition-all"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Xóa"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
