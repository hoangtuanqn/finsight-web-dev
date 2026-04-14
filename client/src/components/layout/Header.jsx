import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

import { userAPI } from '../../api/index.js';

/* ─── Dark mode hook (persisted to localStorage) ─── */
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('finsight-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('finsight-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark];
}

export default function Header({ sidebarWidth = 260, isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await userAPI.getNotifications();
      setNotifs(res.data.data.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markAllAsRead = async () => {
    try {
      await userAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneAsRead = async (id) => {
    try {
      await userAPI.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifIcon = (type, severity) => {
    if (type === 'DOMINO_RISK') return '🚨';
    if (severity === 'DANGER') return '🔥';
    if (severity === 'WARNING') return '⚠️';
    return '🔔';
  };

  const getTimeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 h-[89px] border-b transition-all duration-300"
      style={{
        left: sidebarWidth,
        background: 'var(--color-bg-secondary)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* ── Left: Toggle + Page breadcrumb ── */}
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            className="flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="m14 9-3 3 3 3" />
            </svg>
          </motion.div>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[14px] text-[var(--color-text-secondary)] font-medium">FinSight</span>
          <span className="text-slate-500">/</span>
          <span className="text-[16px] text-[var(--color-text-primary)] font-medium uppercase tracking-wider">Tổng quan</span>
        </div>
      </div>

      {/* ── Right: Actions cluster ── */}
      <div className="flex items-center gap-1.5">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={dark ? 'Chuyển Sang Sáng' : 'Chuyển Sang Tối'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={dark ? 'moon' : 'sun'}
              initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
              transition={{ duration: 0.2 }}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setAvatarOpen(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none shadow-lg shadow-red-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-2xl border overflow-hidden shadow-2xl z-50"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-[11px] text-[var(--color-text-secondary)] hover:text-blue-500 transition-colors">
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Notif list */}
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length > 0 ? (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markOneAsRead(n.id)}
                        className="flex items-start gap-4 px-4 py-4 transition-colors cursor-pointer border-b last:border-0 hover:bg-slate-500/5"
                        style={{
                          background: !n.isRead ? 'var(--color-bg-primary)' : 'transparent',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{getNotifIcon(n.type, n.severity)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate">{n.title}</p>
                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">{getTimeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-500 text-[13px]">
                      Không có thông báo nào
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
                  <Link to="/debts" onClick={() => setNotifOpen(false)} className="text-[12px] text-blue-500 hover:text-blue-600 transition-colors font-bold uppercase tracking-wide">
                    Tất cả thông báo
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--color-border)] mx-1.5" />

        {/* Avatar / User dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => { setAvatarOpen(v => !v); setNotifOpen(false); }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-500/10 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[13px] font-bold text-white shadow-md shadow-blue-500/20">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[14px] font-bold text-[var(--color-text-primary)] leading-tight max-w-[100px] truncate">
                {user?.fullName || 'User'}
              </p>
            </div>
            <span className="text-[var(--color-text-secondary)] text-[10px] hidden sm:block">▼</span>
          </button>

          <AnimatePresence>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border overflow-hidden shadow-2xl z-50"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* User info */}
                <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">{user?.fullName}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)] truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {[
                    {
                      to: '/profile',
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
                      label: 'Hồ sơ cá nhân'
                    },
                    {
                      to: '/',
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
                      label: 'Dashboard'
                    },
                    {
                      to: '/investment',
                      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
                      label: 'Đầu tư'
                    },
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-500/5 transition-all"
                    >
                      <span className="w-5 flex justify-center shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="p-1.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/5 transition-all"
                  >
                    <span className="w-5 flex justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    </span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
