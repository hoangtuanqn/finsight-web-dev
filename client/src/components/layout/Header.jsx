import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  ChevronDown,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  TrendingUp,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { userAPI } from '../../api/index.js';
import { ToggleMode } from './components/ToggleMode.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';

/* ─── Dark mode hook (persisted to localStorage) ─── */

export default function Header({ sidebarWidth = 260, isCollapsed, setIsCollapsed, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  const unreadCount = notifs.filter((n) => !n.isRead).length;

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
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOneAsRead = async (id) => {
    try {
      await userAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifIcon = (type, severity) => {
    if (type === 'DOMINO_RISK') return <AlertOctagon size={18} className="text-red-500" />;
    if (severity === 'DANGER') return <Flame size={18} className="text-red-400" />;
    if (severity === 'WARNING') return <AlertTriangle size={18} className="text-amber-400" />;
    return <Bell size={18} className="text-blue-400" />;
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
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 h-[89px] border-b transition-all duration-300"
      style={{
        left: isMobile ? 0 : sidebarWidth,
        background: 'var(--color-bg-secondary)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* ── Left: Toggle + Page breadcrumb ── */}
      <div className="flex items-center gap-3">
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isMobile ? (
            <Menu size={20} />
          ) : (
            <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} className="flex items-center justify-center">
              <PanelLeftClose size={20} />
            </motion.div>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[14px] text-[var(--color-text-secondary)] font-medium hidden sm:block">FinSight</span>
          <span className="text-slate-500 hidden sm:block">/</span>
          <span className="text-[15px] sm:text-[16px] text-[var(--color-text-primary)] font-medium uppercase tracking-wider">
            Tổng quan
          </span>
        </div>
      </div>

      {/* ── Right: Actions cluster ── */}
      <div className="flex items-center gap-1.5">
        {/* Dark mode toggle */}
        <ToggleMode dark={dark} setDark={setDark} />

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setAvatarOpen(false);
            }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-slate-500/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Bell size={19} />
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
                <div
                  className="flex items-center justify-between px-4 py-3.5 border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-[10px] font-bold">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[var(--color-text-secondary)] hover:text-blue-500 transition-colors"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Notif list */}
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length > 0 ? (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markOneAsRead(n.id)}
                        className="flex items-start gap-4 px-4 py-4 transition-colors cursor-pointer border-b last:border-0 hover:bg-slate-500/5"
                        style={{
                          background: !n.isRead ? 'var(--color-bg-primary)' : 'transparent',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <span className="shrink-0 mt-0.5">{getNotifIcon(n.type, n.severity)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate">{n.title}</p>
                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">{getTimeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-slate-500 text-[13px]">Không có thông báo nào</div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
                  <Link
                    to="/debts"
                    onClick={() => setNotifOpen(false)}
                    className="text-[12px] text-blue-500 hover:text-blue-600 transition-colors font-bold uppercase tracking-wide"
                  >
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
            onClick={() => {
              setAvatarOpen((v) => !v);
              setNotifOpen(false);
            }}
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
            <ChevronDown size={14} className="text-[var(--color-text-secondary)] hidden sm:block" />
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
                      <p className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-secondary)] truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {[
                    {
                      to: '/profile',
                      icon: <User size={16} />,
                      label: 'Hồ sơ cá nhân',
                    },
                    {
                      to: '/',
                      icon: <LayoutDashboard size={16} />,
                      label: 'Dashboard',
                    },
                    {
                      to: '/investment',
                      icon: <TrendingUp size={16} />,
                      label: 'Đầu tư',
                    },
                  ].map((item) => (
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
                      <LogOut size={16} />
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
