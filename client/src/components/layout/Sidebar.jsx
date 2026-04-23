import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, Search, ClipboardList,
  TrendingUp, Target, User, BarChart2, LogOut, ChevronRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      { id: 'tour-dashboard',  to: '/home',  icon: LayoutDashboard, label: 'Dashboard',     end: true,  color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400'     },
    ],
  },
  {
    label: 'Quản lý nợ',
    items: [
      { id: 'tour-debts',      to: '/debts',               icon: CreditCard,    label: 'Danh sách nợ',    end: true, color: '#ef4444', gradient: 'from-red-500 to-rose-400'     },
      { id: 'tour-ear',        to: '/debts/ear-analysis',  icon: Search,        label: 'Phân tích EAR',              color: '#8b5cf6', gradient: 'from-purple-500 to-violet-400' },
      { id: 'tour-dti',        to: '/debts/dti',           icon: BarChart2,     label: 'Phân tích DTI',              color: '#06b6d4', gradient: 'from-cyan-500 to-sky-400'      },
      { id: 'tour-repayment',  to: '/debts/repayment',     icon: ClipboardList, label: 'Kế hoạch trả nợ',            color: '#10b981', gradient: 'from-emerald-500 to-teal-400'  },
    ],
  },
  {
    label: 'Phân tích',
    items: [
      { id: 'tour-investment', to: '/investment',      icon: TrendingUp, label: 'Đầu tư AI',       color: '#f59e0b', gradient: 'from-amber-500 to-orange-400' },
      { id: 'tour-risk',       to: '/risk-assessment', icon: Target,     label: 'Đánh giá rủi ro', color: '#f43f5e', gradient: 'from-rose-500 to-pink-400'   },
    ],
  },
  {
    label: 'Tài khoản',
    items: [
      { id: 'tour-profile', to: '/profile', icon: User, label: 'Hồ sơ cá nhân', color: '#64748b', gradient: 'from-slate-500 to-slate-400' },
    ],
  },
];

export default function Sidebar({ isCollapsed, width, onClose, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      id="tour-sidebar"
      animate={{ width }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden border-r z-20"
      style={{
        background:  'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      {/* ── Logo ── */}
      <div className="relative px-4 h-[89px] flex items-center shrink-0">
        <div className="flex items-center justify-center gap-3 w-full">
          {!isCollapsed ? (
            <a href="/home">
              <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-16 w-50" />
            </a>
          ) : (
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.45)' }}>F</div>
          )}
        </div>
      </div>

      {/* Top gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent shrink-0 mx-3" />

      {/* ── Nav ── */}
      <nav className="relative flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] px-5 mb-1.5"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="px-2 space-y-0.5">
              {group.items.filter(item => item.icon).map((item) => (
                <NavLink
                  key={item.to}
                  id={item.id}
                  to={item.to}
                  end={item.end}
                  title={isCollapsed ? item.label : ''}
                  onClick={() => isMobile && onClose?.()}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3  w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group cursor-pointer ${
                      isActive ? 'text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active background */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} opacity-90`}
                          style={{ boxShadow: `0 4px 16px ${item.color}40` }}
                          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                        />
                      )}

                      {/* Hover background */}
                      {!isActive && (
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: `${item.color}10` }}
                        />
                      )}

                      {/* Icon */}
                      <div className="relative w-5 flex items-center justify-center shrink-0">
                        <item.icon
                          size={17}
                          className="transition-transform duration-200 group-hover:scale-110"
                          style={{ color: isActive ? 'white' : item.color }}
                        />
                      </div>

                      {/* Label */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            className="relative flex-1 whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Chevron on hover */}
                      {!isCollapsed && !isActive && (
                        <ChevronRight
                          size={13}
                          className="relative opacity-0 group-hover:opacity-60 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 shrink-0"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent shrink-0 mx-3" />

      {/* ── User footer ── */}
      <div className="relative p-3 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl group transition-all duration-200 hover:bg-red-500/8 cursor-pointer"
          title={isCollapsed ? 'Đăng xuất' : ''}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-[12px] font-black text-white shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-[12px] font-bold text-[var(--color-text-primary)] truncate leading-tight">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LogOut
                  size={15}
                  className="text-[var(--color-text-muted)] group-hover:text-red-400 transition-colors shrink-0"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
