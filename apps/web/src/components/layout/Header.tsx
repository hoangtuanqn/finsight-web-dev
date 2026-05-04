import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  Flame,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useTourContext } from '../../context/TourContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import NotificationDetailModal from './components/NotificationDetailModal';
import { ToggleMode } from './components/ToggleMode';
import DebtCalendarPopover from './DebtCalendarPopover';

// ─── Helpers ─────────────────────────────────────────────────────

function NotifIcon({ type, severity }: { type: string; severity: string }) {
  if (type === 'DOMINO_RISK') return <AlertOctagon size={15} className="text-red-400" />;
  if (severity === 'DANGER') return <Flame size={15} className="text-red-400" />;
  if (severity === 'WARNING') return <AlertTriangle size={15} className="text-amber-400" />;
  return <Bell size={15} className="text-blue-400" />;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Dropdown Panel - wraps children properly ─────────────────────
function Panel({ children, width = 'w-80' }: { children: React.ReactNode; width?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.14 }}
      className={`absolute right-0 top-[calc(100%+6px)] z-[200] ${width} rounded-2xl border overflow-hidden`}
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 16px 50px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Icon Button - stable size, color-only hover ──────────────────
function IconBtn({
  onClick,
  title,
  badge,
  children,
  id,
}: {
  onClick: () => void;
  title?: string;
  badge?: number;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className="IconBtn"
      style={{
        position: 'relative',
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        color: 'var(--color-text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
        e.currentTarget.style.color = '#60a5fa';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 8px rgba(239,68,68,0.7)',
            fontSize: 9,
            fontWeight: 900,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Header ─────────────────────────────────────────────────

interface HeaderProps {
  sidebarWidth?: number;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobile: boolean;
}

export default function Header({ sidebarWidth = 260, isCollapsed, setIsCollapsed, isMobile }: HeaderProps) {
  const { user, logout } = useAuth() as any;
  const { startTour } = useTourContext() as any;
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetch = async () => {
      try {
        setNotifs((await (userAPI as any).getNotifications()).data.data.notifications || []);
      } catch (_) {}
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markAll = async () => {
    try {
      await (userAPI as any).markAllRead();
      setNotifs((p) => p.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
  };
  const markOne = async (id: string) => {
    try {
      await (userAPI as any).markRead(id);
      setNotifs((p) => p.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      // If the selected notification is the one being marked, update it
      if (selectedNotif?.id === id) {
        setSelectedNotif((p: any) => ({ ...p, isRead: true }));
      }
    } catch (_) {}
  };

  const handleNotifClick = (n: any) => {
    setSelectedNotif(n);
    setIsNotifModalOpen(true);
    setNotifOpen(false);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: isMobile ? 0 : sidebarWidth,
        height: 64,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(20px)',
        transition: 'left 0.3s',
      }}
    >
      {/* Gradient top line */}
      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 1,
          background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Sidebar toggle */}
        <IconBtn title={isCollapsed ? 'Mở rộng' : 'Thu gọn'} onClick={() => setIsCollapsed(!isCollapsed)}>
          {isMobile ? (
            <Menu size={18} />
          ) : (
            <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
              <PanelLeftClose size={18} />
            </motion.div>
          )}
        </IconBtn>

        {/* Breadcrumb - visible on sm+ */}
        <div
          className="hidden sm:flex"
          style={{
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 10,
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 5px #34d399',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>FinSight</span>
          <span style={{ color: 'var(--color-border)' }}>/</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Tổng quan</span>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Theme toggle */}
        <ToggleMode dark={dark} setDark={setDark} />

        {/* Replay Tour */}
        <IconBtn id="tour-replay-btn" title="Xem lại hướng dẫn" onClick={startTour}>
          <HelpCircle size={17} />
        </IconBtn>

        {/* ── Calendar ── */}
        <div style={{ position: 'relative' }} ref={calendarRef}>
          <IconBtn
            title="Lịch trả nợ"
            onClick={() => {
              setCalendarOpen((v) => !v);
              setNotifOpen(false);
              setAvatarOpen(false);
            }}
          >
            <CalendarDays size={17} />
          </IconBtn>

          <AnimatePresence>
            {calendarOpen && (
              <DebtCalendarPopover
                open={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                isMobile={isMobile}
                user={user}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Bell ── */}
        <div id="tour-header-notif" style={{ position: 'relative' }} ref={notifRef}>
          <IconBtn
            badge={unread}
            onClick={() => {
              setNotifOpen((v) => !v);
              setAvatarOpen(false);
              setCalendarOpen(false);
            }}
          >
            <Bell size={17} />
          </IconBtn>

          <AnimatePresence>
            {notifOpen && (
              <Panel width="w-80">
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      Thông báo
                    </span>
                    {unread > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: '#60a5fa',
                          background: 'rgba(59,130,246,0.12)',
                          padding: '1px 7px',
                          borderRadius: 999,
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {unread > 0 && (
                      <button
                        onClick={markAll}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#60a5fa',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                        }}
                      >
                        Đã đọc tất cả
                      </button>
                    )}
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {notifs.length > 0 ? (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border)',
                          background: !n.isRead ? 'rgba(59,130,246,0.04)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-bg-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = !n.isRead ? 'rgba(59,130,246,0.04)' : 'transparent';
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: 'var(--color-bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <NotifIcon type={n.type} severity={n.severity} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 2,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: '#60a5fa',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-secondary)',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {n.message}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: 'var(--color-text-muted)',
                              marginTop: 4,
                            }}
                          >
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '40px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Bell size={24} color="var(--color-text-muted)" />
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Không có thông báo
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '8px 16px',
                    textAlign: 'center',
                  }}
                >
                  <Link
                    to="/debts"
                    onClick={() => setNotifOpen(false)}
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#60a5fa',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Xem tất cả →
                  </Link>
                </div>
              </Panel>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: 'var(--color-border)',
            margin: '0 4px',
            flexShrink: 0,
          }}
        />

        {/* ── Avatar ── */}
        <div style={{ position: 'relative' }} ref={avatarRef}>
          <button
            onClick={() => {
              setAvatarOpen((v) => !v);
              setNotifOpen(false);
              setCalendarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px 4px 4px',
              borderRadius: 10,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 900,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(59,130,246,0.4)',
              }}
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span
              className="hidden sm:block"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                maxWidth: 90,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName?.split(' ').pop() || 'User'}
            </span>
            <motion.div
              animate={{ rotate: avatarOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:block"
            >
              <ChevronDown size={13} color="var(--color-text-muted)" />
            </motion.div>
          </button>

          <AnimatePresence>
            {avatarOpen && (
              <Panel width="w-52">
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.fullName}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--color-text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 1,
                    }}
                  >
                    {user?.email}
                  </p>
                </div>

                <div style={{ padding: 6 }}>
                  {[
                    {
                      to: '/profile',
                      icon: User,
                      label: 'Hồ sơ cá nhân',
                      color: '#3b82f6',
                    },
                    {
                      to: '/home',
                      icon: LayoutDashboard,
                      label: 'Dashboard',
                      color: '#10b981',
                    },
                    {
                      to: '/investment',
                      icon: TrendingUp,
                      label: 'Đầu tư AI',
                      color: '#f59e0b',
                    },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setAvatarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-primary)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div
                  style={{
                    padding: 6,
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                      e.currentTarget.style.color = '#f87171';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <LogOut size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                    Đăng xuất
                  </button>
                </div>
              </Panel>
            )}
          </AnimatePresence>
        </div>
      </div>

      <NotificationDetailModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notification={selectedNotif}
        onMarkRead={markOne}
      />
    </header>
  );
}
