import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

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

/* ─── Mock notifications ─── */
const MOCK_NOTIFS = [
  { id: 1, icon: '🚨', title: 'Khoản nợ sắp đáo hạn', desc: 'Vay xe máy — đáo hạn ngày 25', time: '5 phút trước', unread: true },
  { id: 2, icon: '⚠️', title: 'EAR cao bất thường', desc: 'Thẻ tín dụng VCB — EAR 32.1%', time: '1 giờ trước', unread: true },
  { id: 3, icon: '📈', title: 'Tham lam cực độ', desc: 'Fear & Greed Index: 82/100', time: '2 giờ trước', unread: false },
];

export default function Header({ sidebarWidth = 260 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  const unreadCount = notifs.filter(n => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, unread: false })));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 h-[60px] border-b"
      style={{
        left: sidebarWidth,
        background: 'rgba(11, 17, 32, 0.85)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Left: Page breadcrumb placeholder ── */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[12px] text-slate-600 font-medium">FinSight</span>
        <span className="text-slate-700">/</span>
        <span className="text-[12px] text-slate-400 font-medium">Tổng quan</span>
      </div>

      {/* ── Right: Actions cluster ── */}
      <div className="flex items-center gap-1.5">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
          title={dark ? 'Chuyển Light mode' : 'Chuyển Dark mode'}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={dark ? 'moon' : 'sun'}
              initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              className="text-[16px] leading-none"
            >
              {dark ? '🌙' : '☀️'}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(v => !v); setAvatarOpen(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06] text-slate-400 hover:text-slate-200"
          >
            <span className="text-[16px] leading-none">🔔</span>
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
                className="absolute right-0 top-[calc(100%+8px)] w-[340px] rounded-2xl border overflow-hidden shadow-2xl"
                style={{
                  background: '#0d1526',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-white">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors">
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Notif list */}
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer border-b border-white/[0.04] last:border-0"
                      style={{ background: n.unread ? 'rgba(59,130,246,0.04)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'rgba(59,130,246,0.04)' : 'transparent')}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-slate-200 truncate">{n.title}</p>
                          {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.desc}</p>
                        <p className="text-[10px] text-slate-700 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/[0.06] text-center">
                  <Link to="/debts" onClick={() => setNotifOpen(false)} className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
                    Xem tất cả thông báo →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-1.5" />

        {/* Avatar / User dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => { setAvatarOpen(v => !v); setNotifOpen(false); }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[13px] font-bold text-white shadow-md shadow-blue-500/20">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[12px] font-semibold text-slate-300 leading-tight max-w-[100px] truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] text-slate-600 truncate max-w-[100px]">{user?.email || ''}</p>
            </div>
            <span className="text-slate-600 text-[10px] hidden sm:block">▼</span>
          </button>

          <AnimatePresence>
            {avatarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl border overflow-hidden shadow-2xl"
                style={{
                  background: '#0d1526',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                {/* User info */}
                <div className="px-4 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {[
                    { to: '/profile', icon: '👤', label: 'Hồ sơ cá nhân' },
                    { to: '/', icon: '📊', label: 'Dashboard' },
                    { to: '/investment', icon: '📈', label: 'Đầu tư' },
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all"
                    >
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="p-1.5 border-t border-white/[0.06]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-slate-400 hover:text-red-400 hover:bg-red-500/[0.07] transition-all"
                  >
                    <span className="text-base w-5 text-center">🚪</span>
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
