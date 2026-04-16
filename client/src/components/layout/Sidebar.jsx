import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CreditCard, Search, ClipboardList, TrendingUp, Target, User } from 'lucide-react';

const navItems = [
  {
    to: '/home',
    icon: <LayoutDashboard size={18} />,
    label: 'Dashboard',
    end: true
  },
  {
    to: '/debts',
    icon: <CreditCard size={18} />,
    label: 'Quản lý nợ',
    end: true
  },
  {
    to: '/debts/ear-analysis',
    icon: <Search size={18} />,
    label: 'Phân tích EAR'
  },
  {
    to: '/debts/repayment',
    icon: <ClipboardList size={18} />,
    label: 'Kế hoạch trả nợ'
  },
  {
    to: '/investment',
    icon: <TrendingUp size={18} />,
    label: 'Đầu tư'
  },
  {
    to: '/risk-assessment',
    icon: <Target size={18} />,
    label: 'Đánh giá rủi ro'
  },
  {
    to: '/profile',
    icon: <User size={18} />,
    label: 'Hồ sơ'
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
      animate={{ width }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden transition-colors duration-300 border-r"
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Logo */}
      <div className="p-6 h-22.25 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 shrink-0">
            F
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold text-[var(--color-text-primary)] whitespace-nowrap"
              >
                FinSight
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border)] shrink-0" />

      {/* Nav - Scrollable if too many items */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={isCollapsed ? item.label : ''}
            onClick={() => isMobile && onClose?.()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-600/10 text-blue-500 shadow-sm shadow-blue-500/5'
                : 'text-[var(--color-text-secondary)] hover:bg-slate-500/5 hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <span className="w-5 flex items-center justify-center shrink-0">{item.icon}</span>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

    </motion.aside>
  );
}
