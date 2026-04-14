import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', end: true },
  { to: '/debts', icon: '💳', label: 'Quản lý nợ' },
  { to: '/debts/ear-analysis', icon: '🔍', label: 'Phân tích EAR' },
  { to: '/debts/repayment', icon: '📋', label: 'Kế hoạch trả nợ' },
  { to: '/investment', icon: '📈', label: 'Đầu tư' },
  { to: '/risk-assessment', icon: '🎯', label: 'Đánh giá rủi ro' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ' },
];

export default function Sidebar({ isCollapsed, width }) {
  console.log('Sidebar isCollapsed:', isCollapsed, 'width:', width);
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
      <div className="p-6 h-[89px] flex items-center shrink-0">
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
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${isActive
                ? 'bg-blue-600/10 text-blue-500 shadow-sm shadow-blue-500/5'
                : 'text-[var(--color-text-secondary)] hover:bg-slate-500/5 hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
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
